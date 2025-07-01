import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  // Get date (and optionally user_id) from query string parameters.
  const date = event.queryStringParameters?.date;
  const user_id = event.queryStringParameters?.user_id;

  if (!date) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing 'date' query parameter." })
    };
  }

  const params = {
    TableName: process.env.MEAL_LOGS_TABLE
  };

  try {
    const result = await client.send(new ScanCommand(params));
    // Default to an empty array if result.Items is undefined.
    const items = (result.Items || [])
      .filter(item => item.date && item.date.S === date)
      .filter(item => !user_id || (item.user_id && item.user_id.S === user_id))
      .map(item => {
        // Here we assume "food_items" is stored as a List of Maps.
        let foodItems = [];
        if (item.food_items && item.food_items.L) {
          foodItems = item.food_items.L.map(x => ({
            name: x.M.name.S,
            portion: x.M.portion.S,
            calories: Number(x.M.calories.N),
            macros: {
              carbs: Number(x.M.macros.M.carbs.N),
              fat: Number(x.M.macros.M.fat.N),
              protein: Number(x.M.macros.M.protein.N),
            }
          }));
        }
        return {
          meal_log_id: item.meal_log_id.S,
          user_id: item.user_id.S,
          date: item.date.S,
          meal_type: item.meal_type.S,
          notes: item.notes && item.notes.S ? item.notes.S : "",
          food_items: foodItems,
          total_calories: item.total_calories && item.total_calories.N ? item.total_calories.N : "0",
          logged_at: item.logged_at && item.logged_at.S ? item.logged_at.S : "",
          diet_plan_id: item.diet_plan_id && item.diet_plan_id.S ? item.diet_plan_id.S : ""
        };
      });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ meal_logs: items })
    };
  } catch (err) {
    console.error("DynamoDB scan error:", err);
    const errorDetails = err.message || err.toString() || "No additional error details provided.";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Could not fetch meal logs.", details: errorDetails })
    };
  }
};
