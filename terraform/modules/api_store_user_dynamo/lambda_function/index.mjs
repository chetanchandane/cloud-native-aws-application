import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.USER_TABLE;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

export const handler = async (event) => {
  // 1) CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, Allow: "POST,OPTIONS" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  // 2) Parse body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON payload" })
    };
  }

  const {
    user_id,
    email,
    name,
    height,
    weight,
    date_of_birth,
    gender,
    health_conditions
  } = body;

  if (!user_id) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Missing required field: user_id" })
    };
  }

  // 3) Fetch existing item
  let existing;
  try {
    const { Item } = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { user_id }
    }));
    existing = Item;
  } catch (err) {
    console.error("DynamoDB Get failed:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Error checking existing user" })
    };
  }

  // 4) If user exists, only add **missing** attributes
  if (existing) {
    const updates = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    // list of scalar fields to check
    const fields = { email, name, height, weight, date_of_birth, gender };
    for (const [key, val] of Object.entries(fields)) {
      // if incoming payload includes the key AND it's not in existing
      if (val != null && existing[key] == null) {
        updates.push(`#${key} = :${key}`);
        ExpressionAttributeNames[`#${key}`]   = key;
        ExpressionAttributeValues[`:${key}`] = val;
      }
    }

    // health_conditions (list) 
    if (health_conditions && existing.health_conditions == null) {
      const list = Array.isArray(health_conditions)
        ? health_conditions
        : health_conditions.split(",").map(s => s.trim());
      updates.push(`#hc = :hc`);
      ExpressionAttributeNames[`#hc`]    = "health_conditions";
      ExpressionAttributeValues[`:hc`]  = list;
    }

    // if there’s anything to update, run UpdateCommand
    if (updates.length) {
      // always bump last_updated
      updates.push(`#lu = :lu`);
      ExpressionAttributeNames[`#lu`]     = "last_updated";
      ExpressionAttributeValues[`:lu`]    = new Date().toISOString();

      const updateExpr = "SET " + updates.join(", ");
      try {
        const { Attributes } = await ddb.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { user_id },
          UpdateExpression: updateExpr,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
          ReturnValues: "ALL_NEW"
        }));
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ message: "Attributes added", item: Attributes })
        };
      } catch (err) {
        console.error("DynamoDB Update failed:", err);
        return {
          statusCode: 500,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "Failed to update user" })
        };
      }
    }

    // nothing was missing → return existing
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "User exists", item: existing })
    };
  }

  // 5) If not existing, insert brand‑new record (validate min fields)
  if (!email || !name) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Missing required fields: email or name" })
    };
  }

  const now = new Date().toISOString();
  const item = {
    user_id,
    email,
    name,
    height: height || null,
    weight: weight || null,
    date_of_birth: date_of_birth || null,
    gender: gender || null,
    health_conditions: health_conditions
      ? (Array.isArray(health_conditions)
         ? health_conditions
         : health_conditions.split(",").map(s => s.trim()))
      : [],
    date_created: now,
    last_updated: now
  };

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));
    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "User created", item })
    };
  } catch (err) {
    console.error("DynamoDB Put failed:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to save user profile" })
    };
  }
};