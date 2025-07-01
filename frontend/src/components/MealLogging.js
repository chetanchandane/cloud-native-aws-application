import React, { useEffect, useState } from 'react';
import '../styles/MealLogging.css';

export default function MealLogging() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealLogs, setMealLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mealType, setMealType] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const userProfile = JSON.parse(sessionStorage.getItem('userProfile'));

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const createEmptyFoodItem = () => ({
    id: Date.now() + Math.random(),
    name: '',
    portion: '',
    unit: '',
    calories: 0,
    macros: { carbs: 0, fat: 0, protein: 0 },
    status: '',
  });
  const [foodItems, setFoodItems] = useState([createEmptyFoodItem()]);


  const fetchMealLogs = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    try {
      const res = await fetch(`${process.env.REACT_APP_aws_api_base_url}/get-meal-logs?date=${dateStr}&user_id=${userProfile.user_id}`);
      // const res = await fetch(`${process.env.REACT_APP_aws_api_base_url}/get-meal-logs`);

      // const res = await fetch(`${process.env.REACT_APP_aws_api_base_url}/getMealLogs?date=${dateStr}`);
      // const res = await fetch(`https://wh0c0wa7s3.execute-api.us-east-1.amazonaws.com/prod/getMealLogs?date=${dateStr}`);
      const data = await res.json();
      setMealLogs(data.meal_logs || []);
    } catch (err) {
      console.error(err);
      setMealLogs([]);
    }
  };

  useEffect(() => {
    fetchMealLogs();
  }, [selectedDate]);

  const handleDateChange = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  const handleAddFoodItem = () => {
    setFoodItems([...foodItems, createEmptyFoodItem()]);
  };

  const handleFoodChange = (id, field, value) => {
    setFoodItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCalcNutrients = async (id) => {
    const item = foodItems.find((f) => f.id === id);
    if (!item.name || !item.portion || !item.unit) {
      updateFoodStatus(id, 'Fill all fields');
      return;
    }

    updateFoodStatus(id, 'Calculating...');
    try {
      const res = await fetch(`${process.env.REACT_APP_aws_api_base_url}/calories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food: item.name,
          portion: item.portion,
          unit: item.unit,
        }),
      });
      const data = await res.json();
      setFoodItems((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                calories: data.total_calories,
                macros: data.macros,
                status: '',
              }
            : f
        )
      );
    } catch (err) {
      console.error(err);
      updateFoodStatus(id, 'Error calculating');
    }
  };

  const updateFoodStatus = (id, status) => {
    setFoodItems((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f))
    );
  };

  const handleDeleteFoodItem = (id) => {
    setFoodItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const foodList = foodItems.map((item) => ({
      name: item.name,
      portion: item.portion,
      unit: item.unit,
      calories: parseFloat(item.calories),
      macros: {
        carbs: parseFloat(item.macros.carbs),
        fat: parseFloat(item.macros.fat),
        protein: parseFloat(item.macros.protein),
      },
    }));

    const mealData = {
      user_id: userProfile.user_id,
      // user_id: "12345",
      meal_timestamp: new Date().toISOString(),
      meal_type: mealType,
      food_items: foodList,
      notes,
      date: selectedDate.toISOString().split('T')[0],
    };

    try {
      await fetch(`${process.env.REACT_APP_aws_api_base_url}/insert-meal-log`, {
        // await fetch(`${process.env.REACT_APP_aws_api_base_url}/insertMealLog`, {
        // await fetch(`https://wh0c0wa7s3.execute-api.us-east-1.amazonaws.com/prod/insertMealLog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData),
      });
      fetchMealLogs();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMealType('');
    setNotes('');
    setFoodItems([createEmptyFoodItem()]);
  };

  return (
    <div className="meal-logging-container">
      <div className="date-nav-container">
        <button className="nav-btn" onClick={() => handleDateChange(-1)}>&laquo;</button>
        <span id="currentDate">{formatDate(selectedDate)}</span>
        <button className="nav-btn" onClick={() => handleDateChange(1)}>&raquo;</button>
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-header">
          <h2>Meal Logs for {formatDate(selectedDate)}</h2>
          <button className="accent-btn" onClick={() => setShowModal(true)}>Add Meal</button>
        </div>
        <div className="meal-logs-container">
          {mealLogs.length === 0 ? (
            <p>No meal logs for this day.</p>
          ) : (
            mealLogs.map((log, idx) => (
              <MealLog key={idx} log={log} formatTime={formatTime} />
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h2>Add Meal Log</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Meal Type</label>
                <div className="radio-group">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                    <label key={type}>
                      <input
                        type="radio"
                        name="meal_type"
                        value={type}
                        checked={mealType === type}
                        onChange={(e) => setMealType(e.target.value)}
                        required
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Food Items</label>
                {foodItems.map((item) => (
                  <div className="food-item" key={item.id}>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteFoodItem(item.id)}
                    >
                      ×
                    </button>
                    <label>Food</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleFoodChange(item.id, 'name', e.target.value)}
                      placeholder="e.g., Scrambled Eggs"
                      required
                    />
                    <div className="portion-container">
                      <label>Portion</label>
                      <input
                        type="number"
                        value={item.portion}
                        onChange={(e) => handleFoodChange(item.id, 'portion', e.target.value)}
                        min="0"
                        step="any"
                        required
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => handleFoodChange(item.id, 'unit', e.target.value)}
                        required
                        className="unit-select"
                      >
                        <option value="">-- Unit --</option>
                        {['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'serving'].map(
                          (unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="calc-container">
                      <button type="button" className="calc-btn" onClick={() => handleCalcNutrients(item.id)}>
                        Calculate Nutrients
                      </button>
                      <div className="calories-output">
                        {item.status || `Calories: ${item.calories}`}
                      </div>
                    </div>
                    {item.macros && (
                      <div className="macros-output">
                        Protein: {item.macros.protein} | Carbs: {item.macros.carbs} | Fat: {item.macros.fat}
                      </div>
                    )}
                  </div>
                ))}
                <div className="controls">
                  <button type="button" className="accent-btn" onClick={handleAddFoodItem}>
                    + Add Food Item
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes..."
                />
              </div>

              <button type="submit" className="accent-btn submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Meal Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MealLog({ log, formatTime }) {
  const [showDetails, setShowDetails] = useState(false);
  console.log(log, formatTime(log.logged_at));
  return (
    <div className="log-item" onClick={() => setShowDetails(!showDetails)}>
      <strong>{log.meal_type}</strong> at {formatTime(log.logged_at)}  {log.notes}
      {showDetails && (
        <div className="log-details">
          {log.food_items.map((item, idx) => (
            <div className="food-item-detail" key={idx}>
              <div className="food-item-name">
                {item.name} ({item.portion}, {item.calories} cal)
              </div>
              <div className="food-item-macros">
                Carbs: {item.macros.carbs}g | Fat: {item.macros.fat}g | Protein: {item.macros.protein}g
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


