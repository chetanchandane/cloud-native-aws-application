import AWS from 'aws-sdk';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();

const openaiApiKey    = process.env.OPENAI_API_KEY;
const usersTable      = process.env.USERS_TABLE;
const dietPlansTable  = process.env.DIET_PLANS_TABLE;
const subscriptionTable = process.env.CUSTOMIZED_SUBSCRIPTION;

// Shared CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

// Utility: calculate age from "YYYY-MM-DD"
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const diffMs    = Date.now() - birthDate.getTime();
  const ageDate   = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export const handler = async (event) => {
  // 1) Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers:   CORS_HEADERS,
      body:      ''
    };
  }

  try {
    // 2) Parse incoming POST body
    const body   = event.body ? JSON.parse(event.body) : event;
    const userId = body.userId || '12345';

    // 3) Fetch user record
    const userResult = await docClient.get({
      TableName: usersTable,
      Key:       { user_id: userId }
    }).promise();

    if (!userResult.Item) {
      throw new Error('User not found in Users table.');
    }
    const userRecord      = userResult.Item;
    const currentWeight   = userRecord.weight;
    const height          = userRecord.height;
    const dob             = userRecord.date_of_birth;
    const healthConditions = userRecord.health_conditions || [];
    const age             = calculateAge(dob);

    // 4) Build OpenAI prompt
    const targetWeight   = body.targetWeight;
    const weightDiff     = parseFloat(currentWeight) - parseFloat(targetWeight);
    const goalDescription = weightDiff > 0
      ? 'weight loss'
      : weightDiff < 0
        ? 'weight gain'
        : 'maintenance';

    const prompt = `Generate a customized diet plan in JSON format for a user with the following details:
- Current Weight: ${currentWeight} kg
- Target Weight: ${targetWeight} kg (Goal: ${goalDescription})
- Height: ${height}
- Age: ${age}
- Health Conditions: ${Array.isArray(healthConditions) ? healthConditions.join(', ') : healthConditions}
- Dietary Preferences: ${body.dietaryPreferences}
- Food Intake: ${Array.isArray(body.foodIntake) ? body.foodIntake.join(', ') : body.foodIntake}
- Physical Activities: ${Array.isArray(body.activities) ? body.activities.join(', ') : body.activities}
- Activity Frequency: ${body.activityFrequency}
- Fitness Goals: ${body.fitnessGoals}
- Emotional Eating Triggers: ${Array.isArray(body.triggers) ? body.triggers.join(', ') : body.triggers}

Return only a valid JSON object exactly following this structure:
{
  "diet_goal": "<string>",
  "target_weight": "<string>",
  "food_allergies": [ "<string>", … ],
  "physical_activity": [ "<string>", … ],
  "frequency": "<string>",
  "time_constraint": "<string>",
  "emotional_eating_triggers": [ "<string>", … ],
  "breakfast": {"option1": {
                "dish": "",
                "ingredients": [],
                "calories": ""
            },
            "option2": {
                "dish": "",
                "ingredients": [],
                "calories": ""
            }
        }, },
  "lunch":     {"option1": {
                "dish": "",
                "ingredients": [],
                "calories": ""
            },
            "option2": {
                "dish": "",
                "ingredients": [],
                "calories": ""
            }
        }, },
  "dinner":    { "option1": {
                "dish": "",
                "ingredients": [],
                "calories": ""
            },
            "option2": {
                "dish": "",
                "ingredients": [],
                "calories": ""
            }
        }, },
  "snacks":    { "option1": {
                "dish": "",
                "ingredients": [],
                "calories": ""
            },
            "option2": {
                "dish": "",
                "ingredients": [],
                "calories": ""
            }
        }, },
  "total_daily_calories": <number>,
  "notes": "<string>"
}`;

    // 5) Call OpenAI
    const openaiResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model:    'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a nutrition expert.' },
          { role: 'user',   content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 6) Clean & parse
    const raw        = openaiResp.data.choices[0].message.content;
    const cleaned    = raw.replace(/```(json)?/gi, '').trim();
    let   parsedPlan;
    try {
      parsedPlan = JSON.parse(cleaned);
    } catch (err) {
      throw new Error('Generated diet plan is not valid JSON: ' + err.message);
    }

    // 7) Store new plan & deactivate old ones
    const dietPlanId = uuidv4();
    const now        = new Date().toISOString();

    // Insert new plan
    await docClient.put({
      TableName: dietPlansTable,
      Item: {
        user_id:      userId,
        plan_date:    now,
        diet_plan_id: dietPlanId,
        active:       true,
        plan_details: parsedPlan,
        created_at:   now
      }
    }).promise();

    // Deactivate prior plans
    const existing = await docClient.query({
      TableName:                 dietPlansTable,
      KeyConditionExpression:    'user_id = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    }).promise();
    for (const plan of existing.Items || []) {
      if (plan.diet_plan_id !== dietPlanId && plan.active) {
        await docClient.update({
          TableName: dietPlansTable,
          Key:       { user_id: userId, plan_date: plan.plan_date },
          UpdateExpression:          'SET active = :false',
          ExpressionAttributeValues: { ':false': false }
        }).promise();
      }
    }

    // 8) Refresh subscription
    const subs = await docClient.query({
      TableName:                 subscriptionTable,
      KeyConditionExpression:    'user_id = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    }).promise();
    for (const s of subs.Items || []) {
      await docClient.delete({
        TableName: subscriptionTable,
        Key:       { user_id: userId, subscription_start_date: s.subscription_start_date }
      }).promise();
    }
    await docClient.put({
      TableName: subscriptionTable,
      Item: {
        user_id:             userId,
        subscription_start_date: now,
        subscription_status: 'active',
        dietary_preferences: body.dietaryPreferences,
        health_conditions:   healthConditions,
        fitness_goals:       body.fitnessGoals,
        plan_frequency:      body.activityFrequency,
        last_diet_plan_id:   dietPlanId,
        next_plan_due:       '',
        updated_at:          now
      }
    }).promise();

    // 9) Return to frontend
    return {
      statusCode: 200,
      headers:    { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body:       JSON.stringify({
        dietPlan: parsedPlan,
        message:  'Diet plan generated and subscription updated successfully.'
      })
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers:    { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body:       JSON.stringify({
        message: 'Error generating diet plan.',
        error:   error.message
      })
    };
  }
};