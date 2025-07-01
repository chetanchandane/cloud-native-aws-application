import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Create a DynamoDB client instance.
const client = new DynamoDBClient({});

/**
 * Queries the subscription table for an active subscription for a given user_id.
 * Returns the subscription item if found; otherwise returns null.
 */
async function getActiveSubscription(user_id) {
  const params = {
    TableName: process.env.SUBSCRIPTION_TABLE,
    KeyConditionExpression: "user_id = :uid",
    FilterExpression: "subscription_status = :active",
    ExpressionAttributeValues: {
      ":uid": { S: user_id },
      ":active": { S: "active" }
    }
  };

  try {
    const result = await client.send(new QueryCommand(params));
    if (result.Items && result.Items.length > 0) {
      return result.Items[0];
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error querying subscription table:", err);
    throw err;
  }
}

/**
 * Lambda handler function that calculates total calories from food items
 * and inserts a meal log item into the MealLogs table.
 */
export const handler = async (event) => {
  let body;
  
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid JSON input." })
    };
  }

  // Destructure payload and default notes to empty string if not provided
  const {
    user_id,
    meal_timestamp,
    meal_type,
    food_items,
    date  // date selected by the user, e.g., "2025-04-08"
  } = body;
  // Allow notes to be empty string if missing
  const notes = body.notes || "";

  // Validate required fields (note: notes can be empty)
  if (!user_id || !meal_timestamp || !meal_type || !food_items || !date) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error:
          "Missing required fields: user_id, meal_timestamp, meal_type, food_items, and date."
      })
    };
  }

  // Retrieve the active subscription to get diet_plan_id.
  let subscription;
  try {
    subscription = await getActiveSubscription(user_id);
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Error retrieving subscription information.",
        details: err.message
      })
    };
  }

  if (!subscription) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "No active subscription found for the user." })
    };
  }

  const diet_plan_id = subscription.last_diet_plan_id.S; // Extract diet_plan_id from the subscription.

  // Compute the total calories by summing the calories from each food item.
  const computedTotalCalories = food_items.reduce(
    (total, item) => total + Number(item.calories || 0),
    0
  );
  
  // Generate a unique meal log ID and record the current time.
  const meal_log_id = uuidv4();
  const logged_at = new Date().toISOString();

  // Convert the user-selected date into "YYYY-MM-DD" format.
  const dateOnly = new Date(date).toISOString().split("T")[0];

  // Build the DynamoDB food_items attribute from the food_items array.
  const foodItemsAttr = {
    L: food_items.map(item => ({
      M: {
        "name": { S: item.name },
        "portion": { S: item.portion },
        "calories": { N: String(item.calories || 0) },
        "macros": {
          M: {
            "carbs": { N: String((item.macros && item.macros.carbs) || 0) },
            "fat": { N: String((item.macros && item.macros.fat) || 0) },
            "protein": { N: String((item.macros && item.macros.protein) || 0) }
          }
        }
      }
    }))
  };

  // Construct the DynamoDB item.
  const params = {
    TableName: process.env.MEAL_LOGS_TABLE,
    Item: {
      "meal_log_id": { S: meal_log_id },
      "user_id": { S: user_id },
      "meal_timestamp": { S: meal_timestamp },
      "date": { S: dateOnly },
      "meal_type": { S: meal_type },
      "food_items": foodItemsAttr,
      "total_calories": { N: String(computedTotalCalories) },
      "notes": { S: notes },
      "logged_at": { S: logged_at },
      "diet_plan_id": { S: diet_plan_id }
    }
  };

  try {
    await client.send(new PutItemCommand(params));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Meal log inserted successfully.", meal_log_id })
    };
  } catch (err) {
    console.error("DynamoDB insertion error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Could not insert meal log.", details: err.message })
    };
  }
};
