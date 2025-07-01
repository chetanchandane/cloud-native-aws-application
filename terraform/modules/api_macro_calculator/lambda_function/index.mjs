// calculate.mjs

/**
 * Calculate BMR using the Mifflin-St Jeor formula.
 * @param {number} weightKg - Weight in kilograms.
 * @param {number} heightCm - Height in centimeters.
 * @param {number} age - Age in years.
 * @param {string} gender - "male" or "female".
 * @returns {number} - The BMR value.
 */
function mifflinStJeor(weightKg, heightCm, age, gender) {
  return gender === "male"
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
    : (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
}

/**
 * Calculate BMR using the Katch-McArdle formula.
 * @param {number} weightKg - Weight in kilograms.
 * @param {number} bodyFatPercentage - Body fat percentage.
 * @returns {number} - The BMR value.
 */
function katchMcArdle(weightKg, bodyFatPercentage) {
  const leanMass = weightKg * (1 - (bodyFatPercentage / 100));
  return 370 + (21.6 * leanMass);
}

/**
 * Adjust BMR for activity factor and goal to calculate TDEE.
 * @param {number} bmr - Basal metabolic rate.
 * @param {number} activityFactor - Activity multiplier.
 * @param {string} goal - "maintain", "mildloss", "weightloss", "mildgain", or "weightgain".
 * @returns {number} - Total daily energy expenditure.
 */
function calculateTDEE(bmr, activityFactor, goal) {
  let tdee = bmr * activityFactor;
  switch (goal) {
    case "mildloss":
      tdee *= 0.9;
      break;
    case "weightloss":
      tdee *= 0.8;
      break;
    case "mildgain":
      tdee *= 1.1;
      break;
    case "weightgain":
      tdee *= 1.2;
      break;
    default:
      // maintain weight: no adjustment
      break;
  }
  return tdee;
}

/**
 * Macro distribution ratios and factors based on processed sample data.
 * Each plan includes:
 *   - The portion of total calories from protein, carbs, and fat.
 *   - sugarFactor: the fraction of total carbohydrate grams estimated as sugar.
 *   - satFatFactor: the fraction of total fat grams estimated as saturated fat.
 */
const macroRatios = {
  balanced: {
    protein: 0.28,
    carbs: 0.45,
    fat: 0.27,
    sugarFactor: 0.15,  // 15% of carb grams
    satFatFactor: 0.25  // 25% of fat grams
  },
  lowfat: {
    protein: 0.30,
    carbs: 0.50,
    fat: 0.20,
    sugarFactor: 0.10,
    satFatFactor: 0.20
  },
  lowcarb: {
    protein: 0.40,
    carbs: 0.15,
    fat: 0.45,
    sugarFactor: 0.10,
    satFatFactor: 0.30
  },
  highprotein: {
    protein: 0.45,
    carbs: 0.35,
    fat: 0.20,
    sugarFactor: 0.10,
    satFatFactor: 0.20
  }
};

/**
 * Calculate macronutrient distributions based on TDEE.
 * Uses 4 kcal/g for protein/carbs and 9 kcal/g for fat.
 * @param {number} tdee - Total daily energy expenditure.
 * @returns {object} - Macro distributions for each plan.
 */
function calculateMacros(tdee) {
  const results = {};
  for (const plan in macroRatios) {
    const { protein, carbs, fat, sugarFactor, satFatFactor } = macroRatios[plan];
    
    const proteinKcal = tdee * protein;
    const carbsKcal   = tdee * carbs;
    const fatKcal     = tdee * fat;
    
    const proteinGrams = proteinKcal / 4;
    const carbsGrams   = carbsKcal / 4;
    const fatGrams     = fatKcal / 9;
    
    const sugarGrams   = carbsGrams * sugarFactor;
    const satFatGrams  = fatGrams * satFatFactor;
    
    results[plan] = {
      protein: proteinGrams.toFixed(0),
      carbs:   carbsGrams.toFixed(0),
      fat:     fatGrams.toFixed(0),
      sugar:   sugarGrams.toFixed(0),
      satfat:  satFatGrams.toFixed(0),
      kcal:    tdee.toFixed(0)
    };
  }
  return results;
}

/**
 * AWS Lambda handler function.
 * Expects a JSON payload with input values.
 * Example input:
 * {
 *   "age": 25,
 *   "gender": "male",
 *   "heightCm": 178,
 *   "weightKg": 75,
 *   "activityFactor": 1.465,
 *   "goal": "maintain",
 *   "formula": "mifflin",
 *   "bodyFatPerc": 15
 * }
 * Returns a JSON object with macro distributions.
 */
export async function handler(event) {
  // Define common CORS headers:
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      age = 25,
      gender = "male",
      heightCm = 175,
      weightKg = 70,
      activityFactor = 1.2,
      goal = "maintain",
      formula = "mifflin",
      bodyFatPerc = 0
    } = body;
    
    // Calculate BMR based on chosen formula.
    const bmr = (formula === "mifflin")
      ? mifflinStJeor(weightKg, heightCm, age, gender)
      : katchMcArdle(weightKg, bodyFatPerc);
    
    // Calculate TDEE.
    const tdee = calculateTDEE(bmr, activityFactor, goal);
    
    // Calculate macronutrient distributions.
    const macroResults = calculateMacros(tdee);
    
    // Build final response object.
    const responseBody = {
      tdee,
      balanced:    macroResults.balanced,
      lowfat:      macroResults.lowfat,
      lowcarb:     macroResults.lowcarb,
      highprotein: macroResults.highprotein
    };
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
      body: JSON.stringify(responseBody)
    };
  } catch (error) {
    console.error("Error in lambda handler:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
      body: JSON.stringify({ error: "An error occurred while processing your request." })
    };
  }
}
