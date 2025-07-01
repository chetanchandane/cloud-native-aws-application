import React, { useState } from "react";
import "../styles/Calculators.css";

const CalorieCalculator = () => {
  const [activeTab, setActiveTab] = useState("us");
  const [formData, setFormData] = useState({
    ageUs: "",
    genderUs: "male",
    height_feet: "",
    height_inches: "",
    weightUs: "",
    activityUs: "1.2",
    ageMetric: "",
    genderMetric: "male",
    height_cm: "",
    weightMetric: "",
    activityMetric: "1.2",
    bmrFormula: "mifflin",
    energyUnits: "cal",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [result, setResult] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [error, setError] = useState("");

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    setScenarios([]);
    setError("");
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError("");
    let data = {};

    if (activeTab === "us") {
      data = {
        system: "us",
        age: Number(formData.ageUs),
        gender: formData.genderUs,
        height_feet: Number(formData.height_feet),
        height_inches: Number(formData.height_inches),
        weight_lbs: Number(formData.weightUs),
        activity_level: formData.activityUs,
      };
    } else if (activeTab === "metric") {
      data = {
        system: "metric",
        age: Number(formData.ageMetric),
        gender: formData.genderMetric,
        height_cm: Number(formData.height_cm),
        weight_kg: Number(formData.weightMetric),
        activity_level: formData.activityMetric,
      };
    }

    data.formula = formData.bmrFormula;
    data.energy_unit = formData.energyUnits;

    try {
      const res = await fetch(
        "https://7dg6pochn9.execute-api.us-east-1.amazonaws.com/dev/calculate-calorie",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Calculation failed.");
      }

      const response = await res.json();
      setResult(response);

      const base = response.daily_energy;
      const unit = response.energy_unit;
      const round = (val) => Math.round(val * 100) / 100;

      const calorieScenarios = {
        Maintain: base,
        "Mild Loss (0.5 lb/week)": base * 0.9,
        "Loss (1 lb/week)": base * 0.8,
        "Extreme Loss (2 lb/week)": base * 0.62,
        "Mild Gain (0.5 lb/week)": base * 1.1,
        "Gain (1 lb/week)": base * 1.19,
        "Fast Gain (2 lb/week)": base * 1.38,
      };

      const scenarioList = Object.entries(calorieScenarios).map(
        ([label, val]) => ({
          label,
          value: round(val),
          unit,
        })
      );
      setScenarios(scenarioList);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClear = () => {
    setFormData({
      ageUs: "",
      genderUs: "male",
      height_feet: "",
      height_inches: "",
      weightUs: "",
      activityUs: "1.2",
      ageMetric: "",
      genderMetric: "male",
      height_cm: "",
      weightMetric: "",
      activityMetric: "1.2",
      bmrFormula: "mifflin",
      energyUnits: "cal",
    });
    setResult(null);
    setScenarios([]);
    setError("");
    setShowSettings(false);
  };

  return (
    <div className="container">
      <h2>Calorie Calculator</h2>

      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === "us" ? "active" : ""}`}
          onClick={() => handleTabChange("us")}
        >
          US
        </button>
        <button
          className={`tab-btn ${activeTab === "metric" ? "active" : ""}`}
          onClick={() => handleTabChange("metric")}
        >
          Metric
        </button>
      </div>

      {/* US Form */}
      <form
        id="usForm"
        className={`tab-content ${activeTab === "us" ? "active" : ""}`}
      >
        <div className="form-row">
          <label>Age</label>
          <input name="ageUs" value={formData.ageUs} onChange={handleInput} />
        </div>
        <div className="form-row radio-row">
          <label>
            <input
              type="radio"
              name="genderUs"
              value="male"
              checked={formData.genderUs === "male"}
              onChange={handleInput}
            />
            Male
          </label>
          <label>
            <input
              type="radio"
              name="genderUs"
              value="female"
              checked={formData.genderUs === "female"}
              onChange={handleInput}
            />
            Female
          </label>
        </div>
        <div className="form-row height-row">
          <label>Height</label>
          <div className="height-inputs">
            <input
              name="height_feet"
              placeholder="ft"
              value={formData.height_feet}
              onChange={handleInput}
            />
            <input
              name="height_inches"
              placeholder="in"
              value={formData.height_inches}
              onChange={handleInput}
            />
          </div>
        </div>
        <div className="form-row">
          <label>Weight (lbs)</label>
          <input
            name="weightUs"
            value={formData.weightUs}
            onChange={handleInput}
          />
        </div>
        <div className="form-row">
          <label>Activity</label>
          <select
            name="activityUs"
            value={formData.activityUs}
            onChange={handleInput}
          >
            <option value="1.2">Sedentary</option>
            <option value="1.375">Light</option>
            <option value="1.55">Moderate</option>
            <option value="1.725">Active</option>
            <option value="1.9">Very Active</option>
          </select>
        </div>
      </form>

      {/* Metric Form */}
      <form
        id="metricForm"
        className={`tab-content ${activeTab === "metric" ? "active" : ""}`}
      >
        <div className="form-row">
          <label>Age</label>
          <input
            name="ageMetric"
            value={formData.ageMetric}
            onChange={handleInput}
          />
        </div>
        <div className="form-row radio-row">
          <label>
            <input
              type="radio"
              name="genderMetric"
              value="male"
              checked={formData.genderMetric === "male"}
              onChange={handleInput}
            />
            Male
          </label>
          <label>
            <input
              type="radio"
              name="genderMetric"
              value="female"
              checked={formData.genderMetric === "female"}
              onChange={handleInput}
            />
            Female
          </label>
        </div>
        <div className="form-row">
          <label>Height (cm)</label>
          <input
            name="height_cm"
            value={formData.height_cm}
            onChange={handleInput}
          />
        </div>
        <div className="form-row">
          <label>Weight (kg)</label>
          <input
            name="weightMetric"
            value={formData.weightMetric}
            onChange={handleInput}
          />
        </div>
        <div className="form-row">
          <label>Activity</label>
          <select
            name="activityMetric"
            value={formData.activityMetric}
            onChange={handleInput}
          >
            <option value="1.2">Sedentary</option>
            <option value="1.375">Light</option>
            <option value="1.55">Moderate</option>
            <option value="1.725">Active</option>
            <option value="1.9">Very Active</option>
          </select>
        </div>
      </form>

      {/* Settings Panel */}
      <div className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
        <span>{showSettings ? "- Settings" : "+ Settings"}</span>
      </div>
      {showSettings && (
        <div className="settings-panel">
          <div className="form-row radio-row">
            <label>BMR Formula:</label>
            <label>
              <input
                type="radio"
                name="bmrFormula"
                value="mifflin"
                checked={formData.bmrFormula === "mifflin"}
                onChange={handleInput}
              />
              Mifflin-St Jeor
            </label>
            <label>
              <input
                type="radio"
                name="bmrFormula"
                value="katch"
                checked={formData.bmrFormula === "katch"}
                onChange={handleInput}
              />
              Katch-McArdle
            </label>
          </div>
          <div className="form-row radio-row">
            <label>Energy Unit:</label>
            <label>
              <input
                type="radio"
                name="energyUnits"
                value="cal"
                checked={formData.energyUnits === "cal"}
                onChange={handleInput}
              />
              Calorie
            </label>
            <label>
              <input
                type="radio"
                name="energyUnits"
                value="kJ"
                checked={formData.energyUnits === "kJ"}
                onChange={handleInput}
              />
              Kilojoule
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn calculate-btn" onClick={handleCalculate}>
          Calculate
        </button>
        <button className="btn clear-btn" onClick={handleClear}>
          Clear
        </button>
      </div>

      {/* Result and Scenarios */}
      {result && (
        <div className="result">
          BMR: {result.bmr} | Daily Energy: {result.daily_energy}{" "}
          {result.energy_unit}
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {scenarios.length > 0 && (
        <div className="extra-results">
          <h3>Calorie Scenarios</h3>
          {scenarios.map((s, idx) => (
            <div className="scenario-row" key={idx}>
              <div className="scenario-title">{s.label}</div>
              <div className="scenario-details">
                <span className="scenario-cal">{s.value}</span>
                <span className="scenario-unit">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalorieCalculator;
