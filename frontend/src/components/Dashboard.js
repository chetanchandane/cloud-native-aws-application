import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import '../styles/Dashboard.css';
import ImageUpload from './ImageUpload';
import ProgressRing from './ProgressRing';

const dummyWaterData = [
  { time: '12:00 AM', amount: 0 },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // const [waterModalOpen, setWaterModalOpen] = useState(false);
  // const [waterIntake, setWaterIntake] = useState(dummyWaterData);
  const [calorieIntake, setCalorieIntake] = useState(0);
  const userProfile = JSON.parse(sessionStorage.getItem('userProfile'));

  const [mealLogs, setMealLogs] = useState([]);
  const [mealSummary, setMealSummary] = useState({
    total: 0,
    byMealType: {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0,
      Snacks: 0,
    },
  });

  // const totalWaterIntake = waterIntake.reduce((total, entry) => total + entry.amount, 0);
  const [maxCalories, setMaxCalories] = useState(0);
  // const maxWater = 3000;

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! How can I help you today?' }
  ]);
  const apiUrl = 'https://jfhuy02jl8.execute-api.us-east-1.amazonaws.com/prod/chat';

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleChat = () => setChatOpen(!chatOpen);
  // const openWaterModal = () => setWaterModalOpen(true);
  // const closeWaterModal = () => setWaterModalOpen(false);
  // const addWaterIntake = (amount) => setWaterIntake([...waterIntake, { time: new Date().toLocaleTimeString(), amount }]);

  useEffect(() => {
    const fetchTodayMeals = async () => {
      const today = new Date().toISOString().split('T')[0];
      try {
        const res = await fetch(`${process.env.REACT_APP_aws_api_base_url}/get-meal-logs?date=${today}&user_id=${userProfile.user_id}`);
        const data = await res.json();
        setMealLogs(data.meal_logs || []);
      } catch (err) {
        console.error('Error fetching meal logs:', err);
        setMealLogs([]);
      }
    };
    fetchTodayMeals();
  }, []);
  useEffect(() => {
    const fetchDietPlan = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_aws_api_base_url}/plans?userId=${userProfile.user_id}`
        );
        const data = await response.json();
        const { dietPlans, subscriptionRecords } = data;
  
        const activeSubscription = subscriptionRecords?.find(
          (sub) => sub.subscription_status.toLowerCase() === 'active'
        );
        const activePlan = dietPlans?.find((plan) => plan.active);
  
        if (activeSubscription && activePlan?.plan_details?.total_daily_calories) {
          setMaxCalories(activePlan.plan_details.total_daily_calories);
        }
      } catch (err) {
        console.error('Error fetching diet plan:', err);
      }
    };
  
    fetchDietPlan();
  }, []);
  useEffect(() => {
    const summary = { total: 0, byMealType: { Breakfast: 0, Lunch: 0, Dinner: 0, Snacks: 0 } };
  
    mealLogs.forEach((log) => {
      const mealType = log.meal_type;
      let caloriesForMeal = 0;
  
      log.food_items.forEach((item) => {
        caloriesForMeal += parseFloat(item.calories || 0);
      });
  
      summary.total += caloriesForMeal;
  
      if (summary.byMealType[mealType] !== undefined) {
        summary.byMealType[mealType] += caloriesForMeal;
      }
    });
  
    setMealSummary(summary);
    console.log(mealSummary);
    
    setCalorieIntake(summary.total);
  }, [mealLogs]);


  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
  
    const newUserMessage = { role: 'user', content: chatInput };
    const updatedHistory = [...chatMessages, newUserMessage];
  
    setChatMessages(updatedHistory);
    setChatInput('');
  
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedHistory })
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
  
      const botMessage = { role: 'assistant', content: data.reply };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${error.message}` }]);
    }
  };


  return (
    <div className="dashboard-container">
      
      <div className="dashboard-grid">
        <div className="tile calories" onClick={() => navigate('/meal-logging')}>
          <h3 className="tile-heading">Today's Summary</h3>
          <div className="progress-circle">
            <svg width="120" height="120">
              <circle cx="60" cy="60" r="50" stroke="#e0e0e0" strokeWidth="10" fill="none" />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#4caf50"
                strokeWidth="10"
                fill="none"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={(1 - calorieIntake / maxCalories) * 2 * Math.PI * 50}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="65" textAnchor="middle" fontSize="15" fill="#333" fontWeight="bold">
                {maxCalories - calorieIntake}/{maxCalories}
              </text>
              <text x="60" y="85" textAnchor="middle" fontSize="10" fill="#333">
                Calories Remaining
              </text>
            </svg>
          </div>

          <div className="meal-log">
            <h4>Log Meal</h4>
            <ul>
            {[
              { type: 'Breakfast', calories: mealSummary.byMealType.Breakfast, icon: '🍳' },
              { type: 'Lunch', calories: mealSummary.byMealType.Lunch, icon: '🍽️' },
              { type: 'Dinner', calories: mealSummary.byMealType.Dinner, icon: '🌇' },
              { type: 'Snacks', calories: mealSummary.byMealType.Snacks, icon: '🌙' },
            ].map((meal) => (
                <li key={meal.type}>
                  <span className="meal-icon">{meal.icon}</span>
                  <span className="meal-name">{meal.type}</span>
                  <span className="meal-calories">
                    {meal.calories !== null ? `${meal.calories} cal` : 'Add'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* <div className="tile water">
          <h3>Water Intake</h3>
          <div className="water-btns">
            <button onClick={() => addWaterIntake(1000)}>1L</button>
            <button onClick={() => addWaterIntake(750)}>750ml</button>
            <button onClick={() => addWaterIntake(500)}>500ml</button>
            <button onClick={() => addWaterIntake(250)}>1 Glass</button>
          </div>
          <ProgressRing
            radius={60}
            stroke={10}
            progress={Math.min((totalWaterIntake / maxWater) * 100, 100)}
            color="#03A9F4"
            label={`${totalWaterIntake} ml`}
          />
        </div> */}

        <div className="tile diet" onClick={() => navigate('/diet-dashboard')}>
          <h3>Diet Plans</h3>
          <p style={{ color: '#43a047', fontWeight: '600', fontSize: '18px' }}>Your diet plans</p>
        </div>
        

        <div className="tile calculator" onClick={() => navigate('/calculators')}>
          <h3>Calculators</h3>
          {/* <p style={{ color: '#43a047', fontWeight: '600', fontSize: '18px' }}>Generate your diet</p> */}
        </div>


        <div className="tile scanner">
          <h3>Food Scanner</h3>
          <p style={{ color: '#43a047', fontWeight: '600', fontSize: '18px' }}>Note: Works only for raw food items</p>
          <ImageUpload />
        </div>
      </div>

      <div className="tile textract" onClick={() => navigate('/textract')}>
          <h3>Food Label Scanner</h3>
        </div>

      

      {/* {waterModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Daily Water Intake</h3>
            {totalWaterIntake > 0 ? (
              waterIntake.map((entry, index) => (
                <p key={index}>{entry.time}: {entry.amount} ml</p>
              ))
            ) : (
              <p>No water intake recorded today.</p>
            )}
            <button onClick={closeWaterModal}>Close</button>
          </div>
        </div>
      )} */}

      {chatOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <span>Chat with us</span>
            <button onClick={toggleChat} className="close-chat">X</button>
          </div>

          <div className="chat-body">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
            />
            <button onClick={sendChatMessage}>➤</button>
          </div>
        </div>
      )}

      <div className="chatbot-btn" onClick={toggleChat}>💬</div>
    </div>
  );
};

export default Dashboard;
