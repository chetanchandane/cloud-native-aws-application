import React, { useState } from "react";
import "../styles/Calculators.css";

const BmiCalculator = () => {
  const [activeTab, setActiveTab] = useState("us");
  const [formData, setFormData] = useState({
    usAge: "",
    usFeet: "",
    usInches: "",
    usWeight: "",
    metricAge: "",
    metricHeight: "",
    metricWeight: "",
  });
  const [result, setResult] = useState("");
  const [details, setDetails] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const apiEndpoint =
    "https://7dg6pochn9.execute-api.us-east-1.amazonaws.com/dev/calculate-bmi";

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    clearResults();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateBMI = async (unit) => {
    let payload = {};
    if (unit === "us") {
      const { usFeet, usInches, usWeight } = formData;
      if (!usFeet || !usInches || !usWeight) return alert("Fill all US fields");
      payload = {
        unit: "us",
        feet: usFeet,
        inches: usInches,
        weight: usWeight,
      };
    } else if (unit === "metric") {
      const { metricHeight, metricWeight } = formData;
      if (!metricHeight || !metricWeight) return alert("Fill all Metric fields");
      payload = {
        unit: "metric",
        height: metricHeight,
        weight: metricWeight,
      };
    } else {
      setResult("Custom unit conversion logic goes here.");
      setShowDetails(true);
      return;
    }

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { bmi, category, minHealthyWeight, maxHealthyWeight, prime, pi } = data;

      setResult(`Your BMI is ${bmi} kg/m².`);
      setDetails([
        `BMI = ${bmi} kg/m²`,
        `Category: ${category}`,
        `Healthy BMI range: 18.5 - 25 kg/m²`,
        `Healthy weight: ${minHealthyWeight} kg - ${maxHealthyWeight} kg`,
        `BMI Prime: ${prime}`,
        `Ponderal Index: ${pi} kg/m³`,
      ]);
      setShowDetails(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const clearResults = () => {
    setFormData({
      usAge: "",
      usFeet: "",
      usInches: "",
      usWeight: "",
      metricAge: "",
      metricHeight: "",
      metricWeight: "",
    });
    setResult("");
    setDetails([]);
    setShowDetails(false);
  };

  return (
    <div className="bmi-container">
      <h1>BMI Calculator</h1>
      <div className="tabs">
        {["us", "metric", "other"].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => handleTabSwitch(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* US Form */}
      {activeTab === "us" && (
        <div className="bmi-form active">
          <div className="form-row">
            <label>Age</label>
            <input
              type="number"
              name="usAge"
              value={formData.usAge}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row height-group">
            <label>Height</label>
            <input
              type="number"
              name="usFeet"
              placeholder="Feet"
              value={formData.usFeet}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="usInches"
              placeholder="Inches"
              value={formData.usInches}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row weight-group">
            <label>Weight (lbs)</label>
            <input
              type="number"
              name="usWeight"
              value={formData.usWeight}
              onChange={handleInputChange}
            />
          </div>
          <div className="button-row">
            <button id="us-calc-btn" onClick={() => calculateBMI("us")}>
              Calculate
            </button>
            <button id="us-clear-btn" onClick={clearResults}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Metric Form */}
      {activeTab === "metric" && (
        <div className="bmi-form active">
          <div className="form-row">
            <label>Age</label>
            <input
              type="number"
              name="metricAge"
              value={formData.metricAge}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row">
            <label>Height (cm)</label>
            <input
              type="number"
              name="metricHeight"
              value={formData.metricHeight}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row">
            <label>Weight (kg)</label>
            <input
              type="number"
              name="metricWeight"
              value={formData.metricWeight}
              onChange={handleInputChange}
            />
          </div>
          <div className="button-row">
            <button id="metric-calc-btn" onClick={() => calculateBMI("metric")}>
              Calculate
            </button>
            <button id="metric-clear-btn" onClick={clearResults}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Other Form */}
      {activeTab === "other" && (
        <div className="bmi-form active">
          <div className="button-row">
            <button id="other-calc-btn" onClick={() => calculateBMI("other")}>
              Calculate
            </button>
            <button id="other-clear-btn" onClick={clearResults}>
              Clear
            </button>
          </div>
        </div>
      )}

      {result && <div className="result">{result}</div>}

      {showDetails && (
        <div className="detailed-result">
          <ul>
            {details.map((d, idx) => (
              <li key={idx}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BmiCalculator;
