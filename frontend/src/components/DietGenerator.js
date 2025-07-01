import React, { useState } from 'react';
import '../styles/DietGenerator.css';

const DietGenerator = () => {
  const [targetWeight, setTargetWeight] = useState();
  const [allergies, setAllergies] = useState({ peanuts: false, shellfish: false, lactose: false, other: '' });
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [foodIntake, setFoodIntake] = useState({ breakfast: false, lunch: false, dinner: false, snacks: false });
  const [activities, setActivities] = useState([{ name: '', frequency: 0 }]);
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [triggers, setTriggers] = useState(['']);
  const [loading, setLoading] = useState(false);


  const userProfile = JSON.parse(sessionStorage.getItem('userProfile'));
  
  const userId = userProfile['user_id']


  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      userId,
      targetWeight,
      allergies,
      // otherAllergies,
      dietaryPreferences,
      foodIntake,
      activities,
      activityFrequency: activities.map(a => a.frequency),
      fitnessGoals,
      triggers,
      otherTriggers: triggers.filter(t => !['stress', 'boredom', 'sadness'].includes(t.toLowerCase()))
    }

    console.log({
      userId,
      targetWeight,
      allergies,
      dietaryPreferences,
      foodIntake,
      activities,
      fitnessGoals,
      triggers,
    });
    generateDiet(payload)
  };

  
  const generateDiet = async (payload) => {
    setLoading(true);
  
    try {
      const response = await fetch(`${process.env.REACT_APP_aws_api_base_url}/generate-diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate diet plan");
      }
  
      await response.json(); 
      // window.alert("Diet plan generated successfully");
      window.location.href = '/diet-dashboard';
    } catch (err) {
      console.error(err);
      window.alert("An error occurred while generating the plan.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="diet-generator-container wide">
      {loading && (
      <div className="loading">
        <div className="spinner"></div>
        <div>Generating your plan...</div>
      </div>
    )}
      <h2 className="form-title">Diet Generator</h2>
      <form onSubmit={handleSubmit}>

      <div className="form-section">
          <label className="label">Target Weight:</label>
          <input type="number" className="input" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} />
        </div>

        <div className="form-section">
          <label className="label">Food Allergies or Intolerances:</label>
          <div className="checkbox-group">
            {['peanuts', 'shellfish', 'lactose'].map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={allergies[item]}
                  onChange={e => setAllergies({ ...allergies, [item]: e.target.checked })}
                /> {item.charAt(0).toUpperCase() + item.slice(1)}
              </label>
            ))}
            <input
              type="text" className="input" value={allergies.other} onChange={e => setAllergies({ ...allergies, other: e.target.value })}
              placeholder="Other"
            />
          </div>
        </div>

        <div className="form-section">
          <label className="label">Dietary Preferences and Restrictions:</label>
          <select className="select" value={dietaryPreferences} onChange={e => setDietaryPreferences(e.target.value)}>
            <option value="none">None</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="pescatarian">Pescatarian</option>
            <option value="vegan">Vegan</option>
            <option value="keto">Keto</option>
            <option value="paleo">Paleo</option>
            <option value="halal">Halal</option>
            <option value="kosher">Kosher</option>
            <option value="jain">Jain</option>
          </select>
        </div>

        <div className="form-section">
          <label className="label">Typical Food Intake:</label>
          <div className="checkbox-group">
            {Object.entries(foodIntake).map(([key, val]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={val}
                  onChange={e => setFoodIntake({ ...foodIntake, [key]: e.target.checked })}
                /> {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>
        </div>


        <div className="form-section">
          <label className="label">Physical Activities and Frequency (per week):</label>
          {activities.map((activity, index) => (
            <div key={index} className="input-group" style={{ marginBottom: '10px' }}>
              <input
                type="text"
                className="input"
                placeholder="Activity Name"
                value={activity.name}
                onChange={(e) => {
                  const newActivities = [...activities];
                  newActivities[index].name = e.target.value;
                  setActivities(newActivities);
                }}
              />
              <input
                type="range"
                min="0"
                max="7"
                value={activity.frequency}
                onChange={(e) => {
                  const newActivities = [...activities];
                  newActivities[index].frequency = parseInt(e.target.value);
                  setActivities(newActivities);
                }}
              />
              <span style={{ marginLeft: '10px' }}>{activity.frequency}x/week</span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setActivities([...activities, { name: '', frequency: 0 }])}
            className="add-button"
          >
            + Add Activity
          </button>
        </div>

        <div className="form-section">
          <label className="label">Fitness Goals:</label>
          <select className="select" value={fitnessGoals} onChange={e => setFitnessGoals(e.target.value)}>
            <option value="weight_loss">Weight Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="endurance">Endurance</option>
            <option value="flexibility">Flexibility</option>
            <option value="maingain">Main-Gain</option>
          </select>
        </div>

        <div className="form-section">
          <label className="label">Emotional Eating Triggers:</label>
          {triggers.map((trigger, index) => (
            <div key={index} className="input-group" style={{ marginBottom: '10px' }}>
              <input
                type="text"
                className="input"
                placeholder="Trigger"
                value={trigger}
                onChange={(e) => {
                  const newTriggers = [...triggers];
                  newTriggers[index] = e.target.value;
                  setTriggers(newTriggers);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setTriggers([...triggers, ''])}
            className="add-button"
          >
            + Add Trigger
          </button>
        </div>


      

        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
};

export default DietGenerator;
