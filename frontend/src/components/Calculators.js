import React, { useState } from "react";
import MacroCalculator from "./MacroCalculator";
import CalorieCounter from "./CalorieCounter";
import BmiCalculator from "./BmiCalculator";
import "../styles/Calculators.css";

const Calculators = () => {
  const [activeTab, setActiveTab] = useState("macro");

  const renderTabContent = () => {
    switch (activeTab) {
      case "macro":
        return <MacroCalculator />;
      case "calorie":
        return <CalorieCounter />;
      case "bmi":
        return <BmiCalculator />;
      default:
        return null;
    }
  };
  return (
    <div className="calculator-wrapper">
      <div className="top-tabs">
        <button className={`calc-tab-btn ${activeTab === "macro" ? "active" : ""}`} onClick={() => setActiveTab("macro")}>Macro</button>
        <button className={`calc-tab-btn ${activeTab === "calorie" ? "active" : ""}`} onClick={() => setActiveTab("calorie")}>Calorie</button>
        <button className={`calc-tab-btn ${activeTab === "bmi" ? "active" : ""}`} onClick={() => setActiveTab("bmi")}>BMI</button>
      </div>
      <div className="calculator-body">{renderTabContent()}</div>
    </div>
  );
};

export default Calculators;