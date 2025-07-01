import React, { useState, useEffect } from 'react';
import '../styles/DietDashboard.css';

const DietDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [activePlanHtml, setActivePlanHtml] = useState('');
  const [tabs, setTabs] = useState([]);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const userProfile = JSON.parse(sessionStorage.getItem('userProfile'));
  const userId = userProfile['user_id'];

  useEffect(() => {
    loadPlans();
  }, []);

  const renderOptionStylePlan = (planDetails) => {
    const renderMealOptions = (meal) => {
      return `
        <p><strong>Option 1:</strong> ${meal.option1.dish} (${meal.option1.calories} cal)</p>
        <p><strong>Ingredients:</strong> ${meal.option1.ingredients.join(', ')}</p>
        <p><strong>Option 2:</strong> ${meal.option2.dish} (${meal.option2.calories} cal)</p>
        <p><strong>Ingredients:</strong> ${meal.option2.ingredients.join(', ')}</p>
      `;
    };
    return `
      <h3>${planDetails.diet_goal}</h3>
      <p><strong>Target Weight:</strong> ${planDetails.target_weight}</p>
      <p><strong>Food Allergies:</strong> ${planDetails.food_allergies.join(', ') || 'None'}</p>
      <p><strong>Physical Activities:</strong> ${planDetails.physical_activity.join(', ')}</p>
      <p><strong>Frequency:</strong> ${planDetails.frequency}</p>
      <p><strong>Time Constraint:</strong> ${planDetails.time_constraint}</p>
      <p><strong>Emotional Eating Triggers:</strong> ${planDetails.emotional_eating_triggers.join(', ')}</p>

      <h4>Breakfast</h4>${renderMealOptions(planDetails.breakfast)}
      <h4>Lunch</h4>${renderMealOptions(planDetails.lunch)}
      <h4>Dinner</h4>${renderMealOptions(planDetails.dinner)}
      <h4>Snacks</h4>${renderMealOptions(planDetails.snacks)}

      <p><strong>Total Daily Calories:</strong> ${planDetails.total_daily_calories}</p>
      <p><strong>Notes:</strong> ${planDetails.notes}</p>
    `;
  };

  const renderItemStylePlan = (planDetails) => {
    const renderMeal = (meal) => {
      return `
        <p><strong>Items:</strong> ${meal.items.map(item => item.name).join(', ')}</p>
        <p><strong>Total Calories:</strong> ${meal.total_calories}</p>
      `;
    };

    return `
      <h3>${planDetails.diet_goal}</h3>
      <p><strong>Target Weight:</strong> ${planDetails.target_weight}</p>
      <p><strong>Food Allergies:</strong> ${planDetails.food_allergies.join(', ') || 'None'}</p>
      <p><strong>Physical Activities:</strong> ${planDetails.physical_activity.join(', ')}</p>
      <p><strong>Frequency:</strong> ${planDetails.frequency}</p>
      <p><strong>Time Constraint:</strong> ${planDetails.time_constraint}</p>
      <p><strong>Emotional Eating Triggers:</strong> ${planDetails.emotional_eating_triggers.join(', ')}</p>

      <h4>Breakfast</h4>${renderMeal(planDetails.breakfast)}
      <h4>Lunch</h4>${renderMeal(planDetails.lunch)}
      <h4>Dinner</h4>${renderMeal(planDetails.dinner)}
      <h4>Snacks</h4>${renderMeal(planDetails.snacks)}

      <p><strong>Total Daily Calories:</strong> ${planDetails.total_daily_calories}</p>
      <p><strong>Notes:</strong> ${planDetails.notes}</p>
    `;
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_aws_api_base_url}/plans?userId=${encodeURIComponent(userId)}`
      );
      const data = await response.json();
      const { dietPlans, subscriptionRecords } = data;

      const activeSubscription = subscriptionRecords?.find(
        (sub) => sub.subscription_status.toLowerCase() === 'active'
      );
      const activePlan = dietPlans?.find((plan) => plan.active);

      if (activeSubscription && activePlan?.plan_details) {
        setActivePlanHtml(
          activePlan.plan_details.breakfast?.option1
            ? renderOptionStylePlan(activePlan.plan_details)
            : renderItemStylePlan(activePlan.plan_details)
        );
      } else {
        setActivePlanHtml('<p>No active subscription or diet plan found.</p>');
      }

      const inactivePlans = dietPlans?.filter((plan) => !plan.active) || [];
      setTabs(inactivePlans);
      setSelectedTabIndex(0);
    } catch (err) {
      console.error('Error loading plans:', err);
      setActivePlanHtml('<p style="color:red;">An error occurred while loading your plans.</p>');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="dashboard-container">
      <h1>My Diet Plans Dashboard</h1>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <div>Loading your plans...</div>
        </div>
      )}

      <div className="subscription-section">
        <h2>Current Active Subscription</h2>
        <div dangerouslySetInnerHTML={{ __html: activePlanHtml }} />
      </div>

      <div className="plans-section">
        <h2>Previous Diet Plans</h2>
        <div className="tabs">
          {tabs.map((plan, index) => (
            <button
              key={index}
              className={`tab ${selectedTabIndex === index ? 'active' : ''}`}
              onClick={() => setSelectedTabIndex(index)}
            >
              Plan {index + 1} ({formatDate(plan.plan_date)})
            </button>
          ))}
        </div>
        <div
          className="tab-content" 
          dangerouslySetInnerHTML={{
            __html: (() => {
              const plan = tabs[selectedTabIndex];
              if (!plan?.plan_details) return '<p>No previous diet plans available.</p>';

              const pd = typeof plan.plan_details === 'string'
                ? JSON.parse(plan.plan_details)
                : plan.plan_details;

              return pd.breakfast?.option1
                ? renderOptionStylePlan(pd)
                : renderItemStylePlan(pd);
            })(),
          }}
        />
      </div>
    </div>
  );
};

export default DietDashboard;
