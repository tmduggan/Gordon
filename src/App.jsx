// A minimalist food tracker app built in React with Tailwind CSS.
// Includes persistent localStorage, editable entries, daily summaries, and quick logging.

import React from "react";
import { useState, useEffect, useRef } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import FoodLibrary from './FoodLibrary';
import Auth from './Auth';
import ProfileMenu from './ProfileMenu';
import DailyGoalsModal from './DailyGoalsModal';

const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

// Helper function to determine time segment
const getTimeSegment = (date) => {
  const hours = date.getHours();
  if (hours >= 0 && hours < 9) return "Morning";
  if (hours >= 9 && hours < 16) return "Midday";
  return "Evening";
};

// Helper to get current time segment in Eastern US time
function getDefaultTimeSegment() {
  const now = new Date();
  // Convert to Eastern Time (America/New_York)
  const options = { timeZone: 'America/New_York', hour: 'numeric', hour12: false };
  const hour = parseInt(now.toLocaleString('en-US', options));
  if (hour >= 0 && hour < 9) return 'Morning';
  if (hour >= 9 && hour < 16) return 'Midday';
  return 'Evening';
}

export default function FoodTracker() {
  const [foodCart, setFoodCart] = useState([]);
  const [logs, setLogs] = useState([]); // foodLog entries
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFood, setCustomFood] = useState({ label: "", calories: "", fat: "", carbs: "", protein: "", fiber: "" });
  const [loading, setLoading] = useState(true);
  const [hiddenFoods, setHiddenFoods] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [user, setUser] = useState(null);
  const loadedRef = useRef(false);

  // Add to cart helper (now inside the component)
  const addToCart = (food, quantity = 1) => {
    setFoodCart(cart => {
      const idx = cart.findIndex(item => item.label === food.label && item.units === food.units);
      if (idx !== -1) {
        // If already in cart, increment quantity
        const updated = [...cart];
        updated[idx].quantity += quantity;
        return updated;
      } else {
        return [...cart, { ...food, quantity }];
      }
    });
  };

  const foodList = FoodLibrary({ onNutritionixAdd: addToCart });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [userGoals, setUserGoals] = useState(null);
  const [showAllFoodsToggle, setShowAllFoodsToggle] = useState(false);
  const [cartDate, setCartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cartSegment, setCartSegment] = useState(getDefaultTimeSegment());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!loadedRef.current && user) {
        try {
          const logsQuery = query(
            collection(db, 'foodLog'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
          );
          const querySnapshot = await getDocs(logsQuery);
          const fetchedLogs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setLogs(fetchedLogs);
          loadedRef.current = true;
        } catch (error) {
          console.error("Error fetching food logs:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchLogs();
  }, [user]);

  // Load user goals from Firestore
  useEffect(() => {
    const fetchGoals = async () => {
      if (user) {
        const goalsRef = doc(db, 'userGoals', user.uid);
        const goalsSnap = await getDoc(goalsRef);
        if (goalsSnap.exists()) {
          setUserGoals(goalsSnap.data());
        } else {
          setUserGoals(null);
        }
      }
    };
    fetchGoals();
  }, [user]);

  // Helper to get food by ID
  const getFoodById = (id) => foodList.find(f => f.id === id);

  // Helper to save a food to Firestore if it doesn't exist
  const saveFoodIfNeeded = async (food) => {
    if (!food || !food.label) return null;
    // Normalize ID
    const foodId = (food.id || food.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32));
    // Check if food already exists in foodList
    if (foodList.some(f => f.id === foodId)) return foodId;
    // Save to Firestore
    try {
      await setDoc(doc(db, 'foods', foodId), { ...food, id: foodId });
      // Optionally update local foodList
      foodList.push({ ...food, id: foodId });
      return foodId;
    } catch (err) {
      console.error('Error saving new food to Firestore:', err, food);
      return null;
    }
  };

  // Log a new food to foodLog
  const logFood = async (foodItem) => {
    console.log("logFood called", foodItem);
    const timestamp = new Date().toISOString();
    let food = foodList.find(f => f.label === foodItem.label);
    if (!food) {
      // Try to save the food first
      const newFoodId = await saveFoodIfNeeded(foodItem);
      if (newFoodId) {
        food = { ...foodItem, id: newFoodId };
      } else {
        console.warn("Could not save new food:", foodItem);
        return;
      }
    }
    if (!user) {
      console.warn("No user logged in");
      return;
    }
    const newLog = {
      foodId: food.id,
      timestamp,
      serving: food.serving || 1,
      units: food.units || food.default_serving?.label || 'serving',
      userId: user.uid
    };
    try {
      const customId = `${timestamp}_${food.id}`;
      await setDoc(doc(db, 'foodLog', customId), newLog);
      setLogs([{ id: customId, ...newLog }, ...logs]);
      console.log("Successfully logged food:", newLog);
    } catch (error) {
      console.error("Error adding food log:", error, newLog);
    }
  };

  // Update a food log entry
  const updateLog = async (id, field, value) => {
    try {
      const logRef = doc(db, 'foodLog', id);
      const log = logs.find(l => l.id === id);
      let updateData = {};
      if (field === 'date' || field === 'time') {
        const d = new Date(log.timestamp);
        if (field === 'date') {
          const time = d.toTimeString().slice(0, 5);
          updateData.timestamp = new Date(`${value}T${time}`).toISOString();
        } else {
          const date = d.toISOString().slice(0, 10);
          updateData.timestamp = new Date(`${date}T${value}`).toISOString();
        }
      } else {
        const newVal = field === 'serving' ? parseFloat(value) || 1 : value;
        updateData[field] = newVal;
      }
      await updateDoc(logRef, updateData);
      setLogs(logs.map(l => l.id === id ? { ...l, ...updateData } : l));
    } catch (error) {
      console.error("Error updating food log:", error);
    }
  };

  const deleteLog = async (id) => {
    try {
      await deleteDoc(doc(db, 'foodLog', id));
      setLogs(logs.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting food log:", error);
    }
  };

  const todayString = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === todayString);

  // Group today's logs by date
  const groupByDate = todayLogs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toDateString();
    acc[date] = acc[date] || [];
    acc[date].push(log);
    return acc;
  }, {});

  // Group today's logs by time segment
  const groupByTimeSegment = (dayLogs) => {
    return dayLogs.reduce((acc, log) => {
      const segment = getTimeSegment(new Date(log.timestamp));
      acc[segment] = acc[segment] || [];
      acc[segment].push(log);
      return acc;
    }, { Morning: [], Midday: [], Evening: [] });
  };

  // Calculate daily totals
  const dailyTotals = (logsArr) => {
    return logsArr.reduce((acc, log) => {
      const food = getFoodById(log.foodId);
      if (food && food.nutrition) {
        const multiplier = log.serving / (food.default_serving?.grams || 1);
        Object.keys(defaultGoals).forEach(k => {
          acc[k] += (food.nutrition[k] || 0) * multiplier;
        });
      }
      return acc;
    }, { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 });
  };

  const renderProgressBar = (label, value, goal) => {
    const percentage = Math.min((value / goal) * 100, 100);
    return (
      <div key={label} className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
        <p className="text-xs text-gray-600">{Math.round(value)} / {goal} ({percentage.toFixed(1)}%)</p>
      </div>
    );
  };

  // Handler to hide a food
  const hideFood = (id) => {
    setHiddenFoods([...hiddenFoods, id]);
  };

  // Handler to show all foods
  const showAllFoods = () => {
    setHiddenFoods([]);
  };

  // Calculate food frequencies for the past 3 days
  const getFoodFrequencies = () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return logs.reduce((acc, log) => {
      const logDate = new Date(log.timestamp);
      if (logDate >= threeDaysAgo) {
        acc[log.foodId] = (acc[log.foodId] || 0) + 1;
      }
      return acc;
    }, {});
  };

  // Sort food list by frequency
  const getSortedFoodList = () => {
    const frequencies = getFoodFrequencies();
    return [...foodList].sort((a, b) => {
      const freqA = frequencies[a.id] || 0;
      const freqB = frequencies[b.id] || 0;
      return freqB - freqA;
    });
  };

  // Save user goals to Firestore
  const handleSaveGoals = async (goals) => {
    if (!user) return;
    const goalsRef = doc(db, 'userGoals', user.uid);
    await setDoc(goalsRef, goals);
    setUserGoals(goals);
  };

  // Use userGoals or fallback to defaultGoals
  let goals = userGoals || defaultGoals;
  let modalInitialGoals = goals;
  if (userGoals && userGoals.macroPercents) {
    modalInitialGoals = {
      calories: userGoals.calories,
      ...userGoals.macroPercents,
    };
  }

  // Remove from cart
  const removeFromCart = (label, units) => {
    setFoodCart(cart => cart.filter(item => !(item.label === label && item.units === units)));
  };

  // Update quantity in cart
  const updateCartQuantity = (label, units, newQty) => {
    setFoodCart(cart => cart.map(item =>
      item.label === label && item.units === units ? { ...item, quantity: newQty } : item
    ));
  };

  // Log all foods in cart
  const logCart = async () => {
    console.log("logCart called", foodCart);
    if (!user) {
      console.warn("No user logged in");
      return;
    }
    if (foodCart.length === 0) {
      console.warn("Cart is empty");
      return;
    }
    const logDate = new Date(cartDate);
    // Set time for segment
    const [hours, minutes] = cartSegment === 'Morning' ? [4, 0] : cartSegment === 'Midday' ? [12, 0] : [20, 0];
    logDate.setHours(hours, minutes, 0, 0);
    for (const item of foodCart) {
      let food = foodList.find(f => f.label === item.label && (f.units === item.units || f.default_serving?.label === item.units));
      if (!food) {
        // Try to save the food first
        const newFoodId = await saveFoodIfNeeded(item);
        if (newFoodId) {
          food = { ...item, id: newFoodId };
        } else {
          console.warn("Could not save new food for cart item:", item);
          continue;
        }
      }
      for (let i = 0; i < item.quantity; i++) {
        const timestamp = logDate.toISOString();
        const newLog = {
          foodId: food.id,
          timestamp,
          serving: item.serving || 1,
          units: item.units || food.default_serving?.label || 'serving',
          userId: user.uid
        };
        try {
          const customId = `${timestamp}_${food.id}`;
          await setDoc(doc(db, 'foodLog', customId), newLog);
          setLogs(logs => [{ id: customId, ...newLog }, ...logs]);
          console.log("Successfully logged cart item:", newLog);
        } catch (error) {
          console.error("Error adding food log from cart:", error, newLog);
        }
      }
    }
    setFoodCart([]);
  };

  // Handler for clicking outside the add food/search area
  const handleOverlayClick = (e) => {
    if (foodCart.length === 0) {
      setShowCustomForm(false);
    } else {
      setShowCustomForm(false); // Hide search, but keep cart
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : !user ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h1 className="text-3xl font-bold text-center mb-6">
            <span role="img" aria-label="Chef">👨🏻‍🍳</span> GORDON <span role="img" aria-label="Chef">👨🏻‍🍳</span>
          </h1>
          <Auth />
        </div>
      ) : (
        <>
          <div className="relative flex items-center justify-center mb-6">
            <h1 className="text-3xl font-bold absolute left-1/2 transform -translate-x-1/2 w-full text-center">
              <span role="img" aria-label="Chef">👨🏻‍🍳</span> GORDON <span role="img" aria-label="Chef">👨🏻‍🍳</span>
            </h1>
            <div className="ml-auto z-10 flex items-center gap-4">
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 hover:border-blue-500"
                onClick={() => setProfileMenuOpen(v => !v)}
              />
              {profileMenuOpen && (
                <ProfileMenu
                  onClose={() => setProfileMenuOpen(false)}
                  onOpenGoals={() => { setGoalsModalOpen(true); }}
                  onSignOut={() => { auth.signOut(); setProfileMenuOpen(false); }}
                />
              )}
            </div>
          </div>
          {goalsModalOpen && (
            <DailyGoalsModal
              onClose={() => setGoalsModalOpen(false)}
              initialGoals={modalInitialGoals}
              onSave={handleSaveGoals}
            />
          )}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex justify-end mb-2">
              <button
                className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                onClick={() => setShowAllFoodsToggle(v => !v)}
                title={showAllFoodsToggle ? "Show Less" : "Show All"}
              >
                <span style={{fontSize: '1.2em'}}>⤢</span> {showAllFoodsToggle ? "Show Less" : "Show All"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {foodList && foodList.length > 0 ? (
                <>
                  {(showAllFoodsToggle ? getSortedFoodList() : getSortedFoodList().slice(0, 20)).filter(item => !hiddenFoods.includes(item.id || item.label)).map(item => (
                    <div key={item.id || item.label} className="relative">
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-gray-100 border hover:bg-blue-100 rounded p-2 text-sm flex flex-col w-full"
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-500">
                          {item.serving}{item.units} • {item.nutrition?.calories ?? 0}c {item.nutrition?.fat ?? 0}f {item.nutrition?.carbs ?? 0}c {item.nutrition?.protein ?? 0}p
                        </span>
                      </button>
                      <button
                        className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-lg font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          hideFood(item.id || item.label);
                        }}
                        title="Hide food"
                        style={{lineHeight: 1}}
                      >
                        &minus;
                      </button>
                    </div>
                  ))}
                  <div className="relative">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white rounded p-2 flex flex-col items-center justify-center w-full h-full min-h-[60px] border-2 border-green-700 text-3xl"
                      style={{ minHeight: '60px' }}
                      onClick={() => setShowCustomForm(true)}
                      title="Add New Food"
                    >
                      <span>+</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="col-span-full text-center py-4">
                  No food items available. Add some using the form below.
                </div>
              )}
            </div>
            {(showCustomForm || foodCart.length > 0) && (
              <div className="relative max-w-2xl mx-auto mt-6">
                <div className="bg-white border rounded-lg p-4 flex flex-col gap-2 shadow-lg">
                  {showCustomForm && (
                    <>
                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-1">Search Nutritionix</label>
                        <div className="flex gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="e.g. 3 beef tacos"
                            value={foodList.nutritionixQuery || ''}
                            onChange={e => foodList.setNutritionixQuery(e.target.value)}
                            disabled={foodList.nutritionixLoading}
                          />
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1"
                            disabled={foodList.nutritionixLoading || !foodList.nutritionixQuery}
                            onClick={() => foodList.fetchNutritionix(foodList.nutritionixQuery, addToCart)}
                            type="button"
                          >
                            {foodList.nutritionixLoading ? 'Searching...' : 'Search'}
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Powered by Nutritionix</div>
                      </div>
                      {foodList.nutritionixPreview && (
                        <div className="mt-2 p-2 border rounded bg-gray-50">
                          <h4 className="font-semibold">{foodList.nutritionixPreview.label}</h4>
                          <div className="text-sm">
                            <div>Calories: {foodList.nutritionixPreview.nutrition?.calories}</div>
                            <div>Protein: {foodList.nutritionixPreview.nutrition?.protein}g</div>
                            <div>Carbs: {foodList.nutritionixPreview.nutrition?.carbs}g</div>
                            <div>Fat: {foodList.nutritionixPreview.nutrition?.fat}g</div>
                            <div>Fiber: {foodList.nutritionixPreview.nutrition?.fiber}g</div>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => foodList.confirmNutritionixAdd()}
                              className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 text-sm"
                            >
                              Add to Cart
                            </button>
                            <button
                              onClick={foodList.cancelNutritionixAdd}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded px-3 py-1 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded px-3 py-1 mb-2 w-fit"
                        onClick={() => {/* open custom food modal here */}}
                        type="button"
                      >
                        + Custom Food
                      </button>
                    </>
                  )}
                  {foodCart.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-col sm:flex-row gap-2 mb-2 items-center justify-between">
                        <div>
                          <label className="text-sm mr-2">Date:</label>
                          <input
                            type="date"
                            className="border rounded px-2 py-1"
                            value={cartDate}
                            onChange={e => setCartDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm mr-2">Time of Day:</label>
                          <select
                            className="border rounded px-2 py-1"
                            value={cartSegment}
                            onChange={e => setCartSegment(e.target.value)}
                          >
                            <option value="Morning">Morning</option>
                            <option value="Midday">Midday</option>
                            <option value="Evening">Evening</option>
                          </select>
                        </div>
                      </div>
                      <h3 className="font-semibold mb-2">Food Cart</h3>
                      <table className="min-w-full text-sm mb-2 border border-gray-200">
                        <thead>
                          <tr>
                            <th className="border-b border-gray-200 px-2 py-1 min-w-[180px]">Food</th>
                            <th className="border-b border-gray-200 px-2 py-1">Qty</th>
                            <th className="border-b border-gray-200 px-2 py-1">Unit</th>
                            <th className="border-b border-gray-200 px-2 py-1">🍽️</th>
                            <th className="border-b border-gray-200 px-2 py-1">🥑</th>
                            <th className="border-b border-gray-200 px-2 py-1">🍞</th>
                            <th className="border-b border-gray-200 px-2 py-1">🍗</th>
                            <th className="border-b border-gray-200 px-2 py-1">🌱</th>
                            <th className="border-b border-gray-200 px-2 py-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {foodCart.map((item, idx) => (
                            <tr key={item.label + item.units} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}>
                              <td className="border-r border-gray-100 px-2 py-1 min-w-[180px] font-medium">{item.label}</td>
                              <td className="border-r border-gray-100 px-2 py-1">
                                <input
                                  type="number"
                                  min={1}
                                  className="w-12 border rounded text-center"
                                  value={item.quantity}
                                  onChange={e => updateCartQuantity(item.label, item.units, Math.max(1, parseInt(e.target.value) || 1))}
                                />
                              </td>
                              <td className="border-r border-gray-100 px-2 py-1">{item.units}</td>
                              <td className="border-r border-gray-100 px-2 py-1">{item.nutrition?.calories ?? 0}</td>
                              <td className="border-r border-gray-100 px-2 py-1">{item.nutrition?.fat ?? 0}</td>
                              <td className="border-r border-gray-100 px-2 py-1">{item.nutrition?.carbs ?? 0}</td>
                              <td className="border-r border-gray-100 px-2 py-1">{item.nutrition?.protein ?? 0}</td>
                              <td className="border-r border-gray-100 px-2 py-1">{item.nutrition?.fiber ?? 0}</td>
                              <td className="px-2 py-1">
                                <button className="text-red-500" onClick={() => removeFromCart(item.label, item.units)}>✖️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex gap-2 mt-2">
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 flex items-center justify-center text-xl shadow"
                          disabled={foodCart.length === 0}
                          onClick={logCart}
                          title="Log All"
                          aria-label="Log All"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 flex items-center justify-center text-xl shadow"
                          disabled={foodCart.length === 0}
                          onClick={() => setFoodCart([])}
                          title="Clear Cart"
                          aria-label="Clear Cart"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Daily Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.keys(defaultGoals).map(k => renderProgressBar(k, dailyTotals(todayLogs)[k], goals[k]))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1">Food</th>
                  <th className="px-2 py-1">Amount</th>
                  <th className="px-2 py-1">Unit</th>
                  <th className="px-2 py-1">
                    <span role="img" aria-label="Calories">🍽️</span> Calories
                  </th>
                  <th className="px-2 py-1">
                    <span role="img" aria-label="Fat">🥑</span> Fat
                  </th>
                  <th className="px-2 py-1">
                    <span role="img" aria-label="Carbs">🍞</span> Carbs
                  </th>
                  <th className="px-2 py-1">
                    <span role="img" aria-label="Protein">🍗</span> Protein
                  </th>
                  <th className="px-2 py-1">
                    <span role="img" aria-label="Fiber">🌱</span> Fiber
                  </th>
                  <th className="px-2 py-1">❌</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupByDate).map(([date, dayLogs]) => {
                  const dailyTotal = dailyTotals(dayLogs);
                  const segments = groupByTimeSegment(dayLogs);
                  return (
                    <React.Fragment key={date}>
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan={3} className="px-2 py-2">
                          <span role="img" aria-label="Calendar">🗓️</span> {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-2 py-2">{Math.round(dailyTotal.calories)}</td>
                        <td className="px-2 py-2">{Math.round(dailyTotal.fat)}g</td>
                        <td className="px-2 py-2">{Math.round(dailyTotal.carbs)}g</td>
                        <td className="px-2 py-2">{Math.round(dailyTotal.protein)}g</td>
                        <td className="px-2 py-2">{Math.round(dailyTotal.fiber)}g</td>
                        <td></td>
                      </tr>
                      {Object.entries(segments).map(([segment, segmentLogs]) => (
                        segmentLogs.length > 0 && (
                          <React.Fragment key={segment}>
                            <tr className="bg-gray-50">
                              <td colSpan={3} className="px-2 py-1 font-medium">{segment}</td>
                              {(() => {
                                const segmentTotal = dailyTotals(segmentLogs);
                                return (
                                  <>
                                    <td className="px-2 py-1">{Math.round(segmentTotal.calories)}</td>
                                    <td className="px-2 py-1">{Math.round(segmentTotal.fat)}g</td>
                                    <td className="px-2 py-1">{Math.round(segmentTotal.carbs)}g</td>
                                    <td className="px-2 py-1">{Math.round(segmentTotal.protein)}g</td>
                                    <td className="px-2 py-1">{Math.round(segmentTotal.fiber)}g</td>
                                    <td></td>
                                  </>
                                );
                              })()}
                            </tr>
                            {segmentLogs.map(e => {
                              const food = getFoodById(e.foodId);
                              const multiplier = food ? (e.serving / (food.serving || 1)) : 1;
                              return (
                                <tr 
                                  key={e.id} 
                                  className="border-t hover:bg-gray-50 cursor-pointer"
                                  onClick={() => setEditingLog(e)}
                                >
                                  <td className="px-2 py-1">{food ? food.label : e.foodId}</td>
                                  <td className="px-2 py-1">{e.serving}</td>
                                  <td className="px-2 py-1">{e.units}</td>
                                  {Object.keys(defaultGoals).map(k => (
                                    <td key={k} className="px-2 py-1">{food ? Math.round((food.nutrition[k] || 0) * multiplier) : ''}</td>
                                  ))}
                                  <td className="px-2 py-1">
                                    <button 
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        deleteLog(e.id);
                                      }} 
                                      className="text-red-600"
                                    >
                                      ❌
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        )
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Edit Log Modal */}
          {editingLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Edit Entry</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full border rounded px-2 py-1"
                      value={new Date(editingLog.timestamp).toISOString().slice(0, 10)}
                      onChange={ev => {
                        const newDate = new Date(editingLog.timestamp);
                        const [year, month, day] = ev.target.value.split('-');
                        newDate.setFullYear(year, month - 1, day);
                        setEditingLog({ ...editingLog, timestamp: newDate.toISOString() });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time of Day</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={getTimeSegment(new Date(editingLog.timestamp))}
                      onChange={ev => {
                        const newDate = new Date(editingLog.timestamp);
                        const [hours, minutes] = ev.target.value === "Morning" ? [4, 0] :
                                               ev.target.value === "Midday" ? [12, 0] :
                                               [20, 0];
                        newDate.setHours(hours, minutes);
                        setEditingLog({ ...editingLog, timestamp: newDate.toISOString() });
                      }}
                    >
                      <option value="Morning">Morning</option>
                      <option value="Midday">Midday</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border rounded px-2 py-1"
                      value={editingLog.serving}
                      onChange={ev => setEditingLog({ ...editingLog, serving: parseFloat(ev.target.value) || 1 })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => setEditingLog(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => {
                        updateLog(editingLog.id, "timestamp", editingLog.timestamp);
                        updateLog(editingLog.id, "serving", editingLog.serving);
                        setEditingLog(null);
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
