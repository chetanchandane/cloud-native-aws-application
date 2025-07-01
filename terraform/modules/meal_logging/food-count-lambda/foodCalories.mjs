import axios from 'axios';

/**
 * Lambda function handler.
 * Expects event.body with JSON containing:
 * {
 *   "food": "Scrambled Eggs",
 *   "portion": "2",
 *   "unit": "piece"
 * }
 *
 * The function calls the OpenAI Chat API (gpt-4-turbo) to get total calories
 * and macronutrient values (protein, carbs, fat). The response must be a JSON
 * in the following format:
 * {
 *   "total_calories": <number>,
 *   "macros": {
 *     "protein": <number>,
 *     "carbs": <number>,
 *     "fat": <number>
 *   }
 * }
 */
export const handler = async (event) => {
  let body;
  // If body is already an object, use it directly; otherwise, try parsing it.
  if (typeof event.body === 'object') {
    body = event.body;
  } else {
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Invalid JSON input." })
      };
    }
  }
  
  const { food, portion, unit } = body;
  if (!food || !portion || !unit) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing required parameters: food, portion, and unit." })
    };
  }
  
  // Construct a careful prompt for the LLM.
  const prompt = `
You are a nutrition expert.
Given the food details below, calculate the total calories and the macronutrient breakdown.
Return your answer strictly as a valid JSON object with the following format:
{
  "total_calories": <number>,
  "macros": {
    "protein": <number>,
    "carbs": <number>,
    "fat": <number>
  }
}
Do not include any text before or after the JSON output.
Food: ${food}, Portion: ${portion}, Unit: ${unit}.
`.trim();
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "OpenAI API key is not set." })
    };
  }
  
  try {
    // Call the OpenAI Chat Completions API using Axios.
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: "You are a nutrition expert." },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract assistant's message.
    const responseMessage = openaiResponse.data.choices[0].message.content.trim();
    
    // We expect a valid JSON output from the LLM.
    let resultJson;
    try {
      resultJson = JSON.parse(responseMessage);
    } catch (jsonErr) {
      // In case the LLM returns extra text, attempt to extract the JSON part.
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Error parsing LLM response as JSON.", details: responseMessage })
      };
    }
    
    // Return the parsed data back to the frontend.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(resultJson)
    };
    
  } catch (apiErr) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Error calculating nutrients.",
        details: apiErr.response ? apiErr.response.data : apiErr.message
      })
    };
  }
};
