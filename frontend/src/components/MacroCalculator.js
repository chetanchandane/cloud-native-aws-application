import React, { useState, useEffect } from "react";
import "../styles/Calculators.css";

function MacroCalculator() {
  const [unit, setUnit] = useState("us");
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    feet: "",
    inches: "",
    cm: "",
    weight: "",
    activityFactor: 1.2,
    goal: "maintain",
    formula: "mifflin",
    bodyFatPerc: "",
  });
  const [tdee, setTdee] = useState(null);
  const [macros, setMacros] = useState(null);
  const [customRatios, setCustomRatios] = useState({ protein: 40, carbs: 40, fat: 20 });

  const convertFeetInchesToCm = (feet, inches) => (feet * 12 + inches) * 2.54;
  const convertLbsToKg = (lbs) => lbs * 0.45359237;

  const calculateCustomMacros = (tdee, proteinRatio, carbsRatio, fatRatio) => {
    const proteinKcal = tdee * proteinRatio;
    const carbsKcal = tdee * carbsRatio;
    const fatKcal = tdee * fatRatio;

    return {
      protein: Math.round(proteinKcal / 4),
      carbs: Math.round(carbsKcal / 4),
      fat: Math.round(fatKcal / 9),
      sugar: Math.round((carbsKcal / 4) * 0.2),
      satfat: Math.round((fatKcal / 9) * 0.3),
      kcal: Math.round(tdee),
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalculate = async () => {
    const isMetric = unit === "metric";
    const payload = {
      units: unit,
      age: parseInt(formData.age),
      gender: formData.gender,
      heightCm: isMetric
        ? parseFloat(formData.cm)
        : convertFeetInchesToCm(parseInt(formData.feet), parseInt(formData.inches)),
      weightKg: isMetric ? parseFloat(formData.weight) : convertLbsToKg(parseFloat(formData.weight)),
      activityFactor: parseFloat(formData.activityFactor),
      goal: formData.goal,
      formula: formData.formula,
      bodyFatPerc: parseFloat(formData.bodyFatPerc) || 0,
    };

    try {
      const response = await fetch(
        "https://7dg6pochn9.execute-api.us-east-1.amazonaws.com/dev/calculate-macro",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      setTdee(data.tdee);
      setMacros(data);
    } catch (error) {
      alert("API call failed.");
      console.error(error);
    }
  };

  const updateCustomMacros = () => {
    if (!tdee) return;
    const ratios = {
      protein: customRatios.protein / 100,
      carbs: customRatios.carbs / 100,
      fat: customRatios.fat / 100,
    };
    setMacros((prev) => ({ ...prev, custom: calculateCustomMacros(tdee, ratios.protein, ratios.carbs, ratios.fat) }));
  };

  useEffect(() => {
    updateCustomMacros();
  }, [customRatios, tdee]);

  const handleSliderChange = (type, value) => {
    let newVal = parseInt(value);
    let others = Object.entries(customRatios).filter(([k]) => k !== type);
    let remainder = 100 - newVal;
    let [first, second] = others;
    let ratio = first[1] / (first[1] + second[1]);
    let firstVal = Math.round(remainder * ratio);
    let secondVal = remainder - firstVal;

    setCustomRatios({
      [type]: newVal,
      [first[0]]: firstVal,
      [second[0]]: secondVal,
    });
  };

  return (
    <div className="container">
      <h1>Macro Calculator</h1>

      {/* Unit Tabs */}
      <div className="unit-tabs">
        <button className={`tab-btn ${unit === "us" ? "active" : ""}`} onClick={() => setUnit("us")}>
          US Units
        </button>
        <button className={`tab-btn ${unit === "metric" ? "active" : ""}`} onClick={() => setUnit("metric")}>
          Metric Units
        </button>
      </div>

      {/* Form */}
      <div className={`calculator-form ${unit === "us" ? "active" : ""}`}>
        <div className="input-field"><label>Age</label><input name="age" value={formData.age} onChange={handleInputChange} /></div>
        <div className="input-field"><label>Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange}>
          <option value="male">Male</option><option value="female">Female</option></select></div>

        {unit === "us" ? (
          <>
            <div className="input-field split-input">
              <div><label>Height (feet)</label><input name="feet" value={formData.feet} onChange={handleInputChange} /></div>
              <div><label>Height (inches)</label><input name="inches" value={formData.inches} onChange={handleInputChange} /></div>
            </div>
            <div className="input-field"><label>Weight (lbs)</label><input name="weight" value={formData.weight} onChange={handleInputChange} /></div>
          </>
        ) : (
          <>
            <div className="input-field"><label>Height (cm)</label><input name="cm" value={formData.cm} onChange={handleInputChange} /></div>
            <div className="input-field"><label>Weight (kg)</label><input name="weight" value={formData.weight} onChange={handleInputChange} /></div>
          </>
        )}

        <div className="input-field"><label>Activity Level</label>
          <select name="activityFactor" value={formData.activityFactor} onChange={handleInputChange}>
            <option value="1.2">Sedentary</option>
            <option value="1.375">Light</option>
            <option value="1.55">Moderate</option>
            <option value="1.725">Active</option>
            <option value="1.9">Very Active</option>
          </select></div>

        <div className="input-field"><label>Goal</label>
          <select name="goal" value={formData.goal} onChange={handleInputChange}>
            <option value="maintain">Maintain</option>
            <option value="cut">Cut</option>
            <option value="bulk">Bulk</option>
          </select></div>

        <div className="input-field"><label>Body Fat %</label><input name="bodyFatPerc" value={formData.bodyFatPerc} onChange={handleInputChange} /></div>

        <button className="calculate-btn" onClick={handleCalculate}>Calculate</button>
      </div>

      {/* Results */}
      {macros && (
        <div className="results" style={{ display: "block" }}>
          <h3>TDEE: {tdee} kcal</h3>
          <div className="result-content active">
            <p><strong>Balanced:</strong> P: {macros.balanced?.protein}g | C: {macros.balanced?.carbs}g | F: {macros.balanced?.fat}g</p>
            <p><strong>Custom:</strong> P: {macros.custom?.protein}g | C: {macros.custom?.carbs}g | F: {macros.custom?.fat}g</p>
          </div>
          <div className="slider-container">
            <label>Protein: {customRatios.protein}%</label>
            <input type="range" min="0" max="100" value={customRatios.protein} onChange={(e) => handleSliderChange("protein", e.target.value)} />
            <label>Carbs: {customRatios.carbs}%</label>
            <input type="range" min="0" max="100" value={customRatios.carbs} onChange={(e) => handleSliderChange("carbs", e.target.value)} />
            <label>Fat: {customRatios.fat}%</label>
            <input type="range" min="0" max="100" value={customRatios.fat} onChange={(e) => handleSliderChange("fat", e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default MacroCalculator;
