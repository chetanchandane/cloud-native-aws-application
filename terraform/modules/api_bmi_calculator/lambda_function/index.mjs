export async function handler(event, context) {
  let statusCode = 200;
  const responseBody = {};

  try {
    // Parse the incoming request body (expected to be JSON)
    const body = JSON.parse(event.body);

    // Get unit type, default to metric if not provided.
    const unit = body.unit ? body.unit.toLowerCase() : 'metric';
    let bmi, category, heightM, weightKg;

    if (unit === 'metric') {
      // For metric input, expect height (cm) and weight (kg)
      const heightCm = parseFloat(body.height);
      weightKg = parseFloat(body.weight);

      if (isNaN(heightCm) || heightCm <= 0 || isNaN(weightKg) || weightKg <= 0) {
        throw new Error("Invalid parameters for metric calculation. Please provide positive numbers for height (cm) and weight (kg).");
      }

      // Convert height (cm) to meters
      heightM = heightCm / 100;
      bmi = weightKg / (heightM * heightM);
      
    } else if (unit === 'us') {
      // For US input, expect feet, inches, and weight (pounds)
      const feet = parseFloat(body.feet);
      const inches = parseFloat(body.inches);
      const weightLb = parseFloat(body.weight);

      if (
        isNaN(feet) || feet < 0 ||
        isNaN(inches) || inches < 0 ||
        isNaN(weightLb) || weightLb <= 0
      ) {
        throw new Error("Invalid parameters for US calculation. Please provide non-negative numbers for feet and inches, and a positive number for weight (lb).");
      }

      // Convert height: feet and inches to total inches then to meters
      const totalInches = feet * 12 + inches;
      heightM = totalInches * 0.0254;

      // Convert weight from pounds to kilograms
      weightKg = weightLb * 0.45359237;
      bmi = weightKg / (heightM * heightM);
      
    } else {
      throw new Error("Unsupported unit type. Please use 'metric' or 'us'.");
    }

    // Round BMI to 2 decimal places
    bmi = parseFloat(bmi.toFixed(2));

    // Determine the BMI category
    if (bmi < 18.5) {
      category = 'Underweight';
    } else if (bmi < 25) {
      category = 'Normal weight';
    } else if (bmi < 30) {
      category = 'Overweight';
    } else {
      category = 'Obesity';
    }

    // Compute additional metrics (always based on the converted metric values)
    // Healthy weight range: using standard BMI limits of 18.5 and 25
    const minHealthyWeight = 18.5 * (heightM * heightM);
    const maxHealthyWeight = 25 * (heightM * heightM);
    // BMI Prime: ratio of BMI to 25
    const prime = (bmi / 25).toFixed(2);
    // Ponderal Index: weight (kg) divided by height (m) cubed
    const pi = parseFloat((weightKg / Math.pow(heightM, 3)).toFixed(1));

    // Populate response payload with all computed values
    responseBody.bmi = bmi;
    responseBody.category = category;
    responseBody.minHealthyWeight = parseFloat(minHealthyWeight.toFixed(1));
    responseBody.maxHealthyWeight = parseFloat(maxHealthyWeight.toFixed(1));
    responseBody.prime = prime;
    responseBody.pi = pi;
    
  } catch (error) {
    statusCode = 400;
    responseBody.error = error.message;
  }

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" // Adjust CORS as needed.
    },
    body: JSON.stringify(responseBody)
  };
}
