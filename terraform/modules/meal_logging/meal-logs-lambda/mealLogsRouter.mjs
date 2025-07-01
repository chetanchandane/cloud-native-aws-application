import { handler as insertMealLogHandler } from "./insertMealLog.mjs";
import { handler as getMealLogsHandler } from "./getMealLogs.mjs";

export const handler = async (event) => {
  // Try to use the resourcePath provided by API Gateway.
  let resourcePath = "";
  if (event.requestContext && event.requestContext.resourcePath) {
    resourcePath = event.requestContext.resourcePath;
  }
  
  // Fallback: decide based on HTTP method or presence of body/query parameters.
  if (!resourcePath) {
    if (event.httpMethod && event.httpMethod.toUpperCase() === "GET") {
      resourcePath = "/getMealLogs";
    } else if (event.httpMethod && event.httpMethod.toUpperCase() === "POST") {
      resourcePath = "/insertMealLog";
    } else {
      // If HTTP method is not provided, try to check for query parameters vs. body.
      if (event.queryStringParameters) {
        resourcePath = "/getMealLogs";
      } else if (event.body) {
        resourcePath = "/insertMealLog";
      }
    }
  }

  console.log("Using Resource Path:", resourcePath);

  if (resourcePath.includes("insertMealLog")) {
    console.log("Routing to insertMealLogHandler");
    return await insertMealLogHandler(event);
  } else if (resourcePath.includes("getMealLogs")) {
    console.log("Routing to getMealLogsHandler");
    return await getMealLogsHandler(event);
  } else {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid resource" })
    };
  }
};
