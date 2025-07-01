export const handler = async (event) => {
  try {
    // Parse JSON data from the request body
    const data = JSON.parse(event.body || '{}');

    // Determine measurement system ("us" or "metric")
    const system = (data.system || 'us').toLowerCase();
    const age = data.age;
    const gender = (data.gender || '').toLowerCase();
    const formula = (data.formula || 'mifflin').toLowerCase(); // Default to Mifflin-St Jeor if not provided

    // Validate mandatory fields
    if (age == null || !gender) {
      throw new Error("Age and gender are required fields.");
    }

    let height_cm, weight_kg;

    // Convert height and weight depending on the system
    if (system === 'us') {
      const height_feet = data.height_feet;
      const height_inches = data.height_inches;
      const weight_lbs = data.weight_lbs;
      if (height_feet == null || height_inches == null || weight_lbs == null) {
        throw new Error("For US system, height_feet, height_inches, and weight_lbs are required.");
      }
      // Convert US measurements to metric
      const total_inches = Number(height_feet) * 12 + Number(height_inches);
      height_cm = total_inches * 2.54;      // 1 inch = 2.54 cm
      weight_kg = Number(weight_lbs) * 0.453592;  // 1 lb = 0.453592 kg
    } else {
      // Metric measurements
      height_cm = Number(data.height_cm);
      weight_kg = Number(data.weight_kg);
      if (isNaN(height_cm) || isNaN(weight_kg)) {
        throw new Error("For Metric system, height_cm and weight_kg are required.");
      }
    }

    // Calculate BMR based on selected formula
    let bmr;
    if (formula === 'mifflin') {
      if (gender === 'male') {
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
      } else if (gender === 'female') {
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
      } else {
        throw new Error("Invalid gender specified.");
      }
    } else if (formula === 'harris') {
      if (gender === 'male') {
        bmr = 88.362 + 13.397 * weight_kg + 4.799 * height_cm - 5.677 * age;
      } else if (gender === 'female') {
        bmr = 447.593 + 9.247 * weight_kg + 3.098 * height_cm - 4.330 * age;
      } else {
        throw new Error("Invalid gender specified.");
      }
    } else {
      // Default fallback to Mifflin-St Jeor
      if (gender === 'male') {
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
      } else {
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
      }
    }

    // Define multipliers for activity levels
    const activity_level = (data.activity_level || 'sedentary').toLowerCase();
    const activity_multipliers = {
      'bmr': 1.0,
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very active': 1.9,
      'extra active': 2.2
    };
    const multiplier = activity_multipliers[activity_level] || 1.2;

    // Calculate daily caloric needs
    const daily_calories = bmr * multiplier;

    // Convert energy units if necessary (calories to kilojoules)
    const energy_unit = (data.energy_unit || 'cal').toLowerCase(); // Default is calories
    const daily_energy = energy_unit === 'kj' ? daily_calories * 4.184 : daily_calories;

    // Build the response object (calculated values only)
    const response = {
      bmr: Math.round(bmr * 100) / 100,
      daily_calories: Math.round(daily_calories * 100) / 100,
      daily_energy: Math.round(daily_energy * 100) / 100,
      energy_unit: energy_unit === 'kj' ? "kilojoules" : "calories"
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Dynamically echo the origin if provided; otherwise, default to a specific origin for testing.
        "Access-Control-Allow-Origin": event.headers.Origin || event.headers.origin || "http://localhost:3000",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": event.headers.Origin || event.headers.origin || "http://localhost:3000",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
