import AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient();

// Environment variables for table names should be set in Lambda configuration.
const dietPlansTable = process.env.DIET_PLANS_TABLE; // e.g., "DietPlans"
const subscriptionTable = process.env.CUSTOMIZED_SUBSCRIPTION; // e.g., "CustomizedDietSubscription"

export const handler = async (event) => {
  try {
    // Extract userId from query string parameters
    const userId = event.queryStringParameters && event.queryStringParameters.userId;
    if (!userId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Missing userId parameter" })
      };
    }

    // Query the DietPlans table for records associated with userId
    const dietPlansParams = {
      TableName: dietPlansTable,
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      }
    };

    const dietPlansResult = await docClient.query(dietPlansParams).promise();

    // Query the Subscription table for records associated with userId
    const subscriptionParams = {
      TableName: subscriptionTable,
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      }
    };

    const subscriptionResult = await docClient.query(subscriptionParams).promise();

    // Return both records
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        dietPlans: dietPlansResult.Items || [],
        subscriptionRecords: subscriptionResult.Items || []
      })
    };
  } catch (error) {
    console.error("Error fetching plans:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "Error fetching plans",
        error: error.message
      })
    };
  }
};

