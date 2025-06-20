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
import Exercise from './Exercise';

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

// Define a list of standard time zones
const timeZoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'UTC', label: 'UTC' },
  // Add more as needed
];

// Add helper functions for time format conversion
const formatTimeForDisplay = (hours, minutes) => {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

const parseTimeFromDisplay = (displayTime) => {
  const [time, period] = displayTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let parsedHours = hours;
  if (period === 'PM' && hours !== 12) parsedHours += 12;
  if (period === 'AM' && hours === 12) parsedHours = 0;
  return { hours: parsedHours, minutes };
};

// Helper to extract standardized macronutrient info from a food object.
// This is the single source of truth for interpreting nutrition data.
const getFoodMacros = (food) => {
  if (!food) {
    return { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 };
  }

  // This function is now robust enough to handle any food data structure
  // in the database, whether it's the newest format, an older nested
  // format, or the original default food format.
  const data = food.nutritionix_data || food.nutrition || food;

  return {
    calories: Math.round(data.nf_calories || data.calories || 0),
    fat: Math.round(data.nf_total_fat || data.fat || 0),
    carbs: Math.round(data.nf_total_carbohydrate || data.carbs || 0),
    protein: Math.round(data.nf_protein || data.protein || 0),
    fiber: Math.round(data.nf_dietary_fiber || data.fiber || 0),
  };
};

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
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activePage, setActivePage] = useState('nutrition'); // 'nutrition' or 'exercise'

  // Add state for cartHour12, cartMinute, and cartAmPm, defaulting to current time
  const now = new Date();
  let defaultHour = now.getHours();
  const [cartHour12, setCartHour12] = useState(((defaultHour % 12) || 12));
  const [cartMinute, setCartMinute] = useState(now.getMinutes());
  const [cartAmPm, setCartAmPm] = useState(defaultHour >= 12 ? 'PM' : 'AM');

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

  // Load userProfile from Firestore
  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    const fetchProfile = async () => {
      const ref = doc(db, 'userProfile', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserProfile(snap.data());
      } else {
        // Create default profile
        const defaultProfile = {
          goals: defaultGoals,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          pinnedFoods: []
        };
        await setDoc(ref, defaultProfile);
        setUserProfile(defaultProfile);
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Save userProfile to Firestore
  const saveUserProfile = async (profile) => {
    if (!user) return;
    const ref = doc(db, 'userProfile', user.uid);
    await setDoc(ref, profile);
    setUserProfile(profile);
  };

  // Helper to get user's timezone from userProfile
  const getUserTimezone = () => userProfile?.timezone || 'UTC';

  // Use userProfile.goals for nutrition goals
  let goals = userProfile?.goals || defaultGoals;
  let modalInitialGoals = goals;

  // Helper to get food by ID
  const getFoodById = (id) => foodList.find(f => f.id === id);

  // Helper to slugify a string for generating consistent document IDs.
  function slugify(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
  }

  // Helper to save a food to Firestore if it doesn't exist.
  // This uses the same robust logic as the FoodLibrary component.
  const saveFoodIfNeeded = async (food) => {
    const foodName = food.food_name || food.label;
    if (!foodName) return null;

    let foodId;
    if (food.nix_item_id) {
      foodId = `branded_${food.nix_item_id}`;
    } else if (food.ndb_no) {
      foodId = `usda_${food.ndb_no}`;
    } else {
      foodId = `common_${slugify(foodName)}`;
    }

    if (foodList.some(f => f.id === foodId)) {
      return foodId; // Already in library
    }

    try {
      const foodToSave = {
        ...food,
        id: foodId,
        label: foodName,
        created_at: new Date().toISOString(),
        source: food.source || 'nutritionix'
      };
      await setDoc(doc(db, 'foods', foodId), foodToSave);
      foodList.push(foodToSave); // Update local list
      return foodId;
    } catch (err) {
      console.error('Error saving new food to Firestore:', err, food);
      return null;
    }
  };

  // Helper to get 24-hour time from 12-hour + AM/PM
  const get24Hour = (hour12, ampm) => {
    let h = parseInt(hour12, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h;
  };

  // Helper to format timestamp in local time zone
  const formatTimestampLocal = (dateStr, hour12, minute, ampm) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const hour24 = get24Hour(hour12, ampm);
    const d = new Date(year, month - 1, day, hour24, minute, 0, 0);
    // Return ISO string to seconds (no Z, so it's local time)
    return d.toISOString().slice(0, 19);
  };

  // Log a new food to foodLog
  const logFood = async (foodItem) => {
    let food = foodList.find(f => f.label === foodItem.label);
    if (!food) {
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
    const timestamp = formatTimestampLocal(cartDate, cartHour12, cartMinute, cartAmPm);
    const recordedTime = new Date().toISOString().slice(0, 19);
    const newLog = {
      foodId: food.id,
      timestamp,
      serving: food.serving || 1,
      units: food.units || food.default_serving?.label || 'serving',
      userId: user.uid,
      recordedTime
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
      if (food) {
        const macros = getFoodMacros(food);
        const multiplier = log.serving / (food.serving_qty || 1);
        Object.keys(macros).forEach(key => {
          acc[key] += (macros[key] || 0) * multiplier;
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
    const tz = getUserTimezone();
    for (const item of foodCart) {
      let food = foodList.find(f => f.label === item.label && (f.units === item.units || f.default_serving?.label === item.units));
      if (!food) {
        const newFoodId = await saveFoodIfNeeded(item);
        if (newFoodId) {
          food = { ...item, id: newFoodId };
        } else {
          console.warn("Could not save new food for cart item:", item);
          continue;
        }
      }
      for (let i = 0; i < item.quantity; i++) {
        const timestamp = formatTimestampLocal(cartDate, cartHour12, cartMinute, cartAmPm);
        const recordedTime = new Date().toISOString().slice(0, 19);
        const newLog = {
          foodId: food.id,
          timestamp,
          serving: item.serving || 1,
          units: item.units || food.default_serving?.label || 'serving',
          userId: user.uid,
          recordedTime
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

  // Helper to pin/unpin a food
  const togglePinFood = async (foodId) => {
    if (!userProfile) return;
    let newPinned;
    if (userProfile.pinnedFoods?.includes(foodId)) {
      newPinned = userProfile.pinnedFoods.filter(id => id !== foodId);
    } else {
      newPinned = [...(userProfile.pinnedFoods || []), foodId];
    }
    const updatedProfile = { ...userProfile, pinnedFoods: newPinned };
    await saveUserProfile(updatedProfile);
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

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activePage === 'nutrition'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActivePage('nutrition')}
              >
                🍽️ Nutrition
              </button>
              <button
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activePage === 'exercise'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActivePage('exercise')}
              >
                💪 Exercise
              </button>
            </div>
          </div>

          {/* Page Content */}
          {activePage === 'nutrition' ? (
            <>
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
                  {userProfile?.pinnedFoods && userProfile.pinnedFoods.length > 0 ? (
                    userProfile.pinnedFoods.map(foodId => {
                      const item = foodList.find(f => f.id === foodId);
                      if (!item) return null;
                      const macros = getFoodMacros(item);
                      return (
                        <div key={item.id || item.label} className="relative">
                          <button
                            onClick={() => addToCart(item)}
                            className="bg-gray-100 border hover:bg-blue-100 rounded p-2 text-sm flex flex-col w-full"
                          >
                            <span>{item.label}</span>
                            <span className="text-xs text-gray-500">
                              {item.serving_qty}{item.serving_unit} • {macros.calories}c {macros.fat}f {macros.carbs}c {macros.protein}p
                            </span>
                          </button>
                          <button
                            className="absolute top-1 right-1 text-yellow-500 hover:text-yellow-700 text-lg font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinFood(item.id);
                            }}
                            title="Unpin food"
                            style={{lineHeight: 1}}
                          >
                            📌
                          </button>
                        </div>
                      );
                    })
                  ) : null}
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
                </div>
                {(showCustomForm || foodCart.length > 0) && (
                  <div className="relative max-w-2xl mx-auto mt-6">
                    <div className="bg-white border rounded-lg p-4 flex flex-col gap-2 shadow-lg">
                      {showCustomForm && (
                        <>
                          <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">Search Nutritionix</label>
                            <div className="flex flex-col gap-1 relative">
                              <div className="flex gap-2">
                                <input
                                  className="border rounded px-2 py-1 flex-1"
                                  placeholder="e.g. 3 beef tacos"
                                  value={foodList.nutritionixQuery || ''}
                                  onChange={e => {
                                    foodList.setNutritionixQuery(e.target.value);
                                    foodList.setShowDbDropdown && foodList.setShowDbDropdown(true);
                                  }}
                                  disabled={foodList.nutritionixLoading}
                                  autoComplete="off"
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
                              {foodList.nutritionixQuery && (
                                <ul className="z-20 bg-white border border-gray-200 rounded w-full mt-1 max-h-56 overflow-auto shadow-lg">
                                  {foodList.dbResults && foodList.dbResults.length > 0 && foodList.dbResults.map((food, idx) => {
                                    const macros = getFoodMacros(food);
                                    return (
                                      <li
                                        key={food.id || food.label + idx}
                                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm flex items-center justify-between"
                                        onClick={() => {
                                          if (foodList.handleSelectDbFood) foodList.handleSelectDbFood(food);
                                          if (foodList.onNutritionixAdd) foodList.onNutritionixAdd(food);
                                        }}
                                      >
                                        <span>
                                          {food.label}
                                          {(macros.calories > 0 || macros.fat > 0 || macros.carbs > 0 || macros.protein > 0) && (
                                            <>
                                              {' '}<span>🍽️{macros.calories}</span>
                                              <span> 🥑{macros.fat}g</span>
                                              <span> 🍞{macros.carbs}g</span>
                                              <span> 🍗{macros.protein}g</span>
                                              <span> 🌱{macros.fiber}g</span>
                                            </>
                                          )}
                                        </span>
                                        <button
                                          className={`ml-2 text-yellow-500 hover:text-yellow-700 bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-300`}
                                          onClick={e => {
                                            e.stopPropagation();
                                            togglePinFood(food.id);
                                          }}
                                          title={userProfile?.pinnedFoods?.includes(food.id) ? "Unpin food" : "Pin food"}
                                          style={{lineHeight: 1}}
                                        >
                                          {userProfile?.pinnedFoods?.includes(food.id) ? '📌' : '📍'}
                                        </button>
                                      </li>
                                    );
                                  })}
                                  {Array.isArray(foodList.nutritionixPreview) && foodList.nutritionixPreview.filter(apiFood => !foodList.dbResults.some(f => f.label.toLowerCase() === apiFood.label.toLowerCase())).map((apiFood, idx) => (
                                    <li
                                      key={apiFood.label + idx}
                                      className="px-3 py-2 cursor-pointer text-sm flex items-center justify-between bg-blue-50 border border-blue-200"
                                      style={{ transition: 'background 0.2s' }}
                                    >
                                      <span
                                        className="flex-1"
                                        onClick={async () => {
                                          const foodWithNutrition = await foodList.fetchNutritionixItem(apiFood);
                                          if (foodWithNutrition) {
                                            if (foodList.saveNutritionixToLibrary) {
                                              await foodList.saveNutritionixToLibrary(foodWithNutrition);
                                            }
                                            if (foodList.onNutritionixAdd) {
                                              foodList.onNutritionixAdd(foodWithNutrition);
                                            }
                                          }
                                        }}
                                      >
                                        {apiFood.label}
                                        {/* 
                                          The macro preview for live API results is removed, as they
                                          don't contain nutrition data until they are saved.
                                        */}
                                      </span>
                                      <button
                                        className="ml-2 text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-full p-1 flex items-center justify-center border border-blue-300"
                                        title="Add to Library"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const foodWithNutrition = await foodList.fetchNutritionixItem(apiFood);
                                          if (foodWithNutrition) {
                                            if (foodList.saveNutritionixToLibrary) {
                                              await foodList.saveNutritionixToLibrary(foodWithNutrition);
                                            }
                                          }
                                          // Optionally, visually update the row to white (handled by re-render)
                                        }}
                                      >
                                        <span className="text-lg font-bold">+</span>
                                      </button>
                                    </li>
                                  ))}
                                  {(!foodList.dbResults || foodList.dbResults.length === 0) && (!Array.isArray(foodList.nutritionixPreview) || foodList.nutritionixPreview.length === 0) && (
                                    <li className="px-3 py-2 text-gray-400 cursor-default text-sm">No results found</li>
                                  )}
                                </ul>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Powered by Nutritionix</div>
                          </div>
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
                              <label className="text-sm mr-2">Time:</label>
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={12}
                                  className="w-12 border rounded px-2 py-1 text-center"
                                  value={cartHour12}
                                  onChange={e => setCartHour12(Math.max(1, Math.min(12, Number(e.target.value))))}
                                />
                                :
                                <input
                                  type="number"
                                  min={0}
                                  max={59}
                                  className="w-12 border rounded px-2 py-1 text-center"
                                  value={cartMinute.toString().padStart(2, '0')}
                                  onChange={e => setCartMinute(Math.max(0, Math.min(59, Number(e.target.value))))}
                                />
                                <select
                                  className="border rounded px-2 py-1"
                                  value={cartAmPm}
                                  onChange={e => setCartAmPm(e.target.value)}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <h3 className="font-semibold mb-2">Food Cart</h3>
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-2 py-1">Food</th>
                                <th className="px-2 py-1">Qty</th>
                                <th className="px-2 py-1">Unit</th>
                                <th className="px-2 py-1">🍽️</th>
                                <th className="px-2 py-1">🥑</th>
                                <th className="px-2 py-1">🍞</th>
                                <th className="px-2 py-1">🍗</th>
                                <th className="px-2 py-1">🌱</th>
                                <th className="px-2 py-1"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {foodCart.map((item, idx) => {
                                const macros = getFoodMacros(item);
                                return (
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
                                    <td className="border-r border-gray-100 px-2 py-1">{macros.calories}</td>
                                    <td className="border-r border-gray-100 px-2 py-1">{macros.fat}</td>
                                    <td className="border-r border-gray-100 px-2 py-1">{macros.carbs}</td>
                                    <td className="border-r border-gray-100 px-2 py-1">{macros.protein}</td>
                                    <td className="border-r border-gray-100 px-2 py-1">{macros.fiber}</td>
                                    <td className="px-2 py-1">
                                      <button className="text-red-500" onClick={() => removeFromCart(item.label, item.units)}>✖️</button>
                                    </td>
                                  </tr>
                                );
                              })}
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
                                {segmentLogs.map((log, i) => {
                                  const food = getFoodById(log.foodId);
                                  const multiplier = food ? (log.serving / (food.serving_qty || 1)) : 1;
                                  const macros = getFoodMacros(food);

                                  if (!food) {
                                    return (
                                      <tr key={log.id} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                                        <td colSpan="9" className="px-2 py-1 text-red-500 italic">
                                          Warning: Logged food with ID "{log.foodId}" has been deleted.
                                        </td>
                                      </tr>
                                    );
                                  }

                                  return (
                                    <tr 
                                      key={log.id} 
                                      className="border-t hover:bg-gray-50 cursor-pointer"
                                      onClick={() => setEditingLog(log)}
                                    >
                                      <td className="px-2 py-1">{food.label}</td>
                                      <td className="px-2 py-1">{log.serving}</td>
                                      <td className="px-2 py-1">{food.serving_unit || 'serving'}</td>
                                      <td className="px-2 py-1">{Math.round(macros.calories * multiplier)}</td>
                                      <td className="px-2 py-1">{Math.round(macros.fat * multiplier)}</td>
                                      <td className="px-2 py-1">{Math.round(macros.carbs * multiplier)}</td>
                                      <td className="px-2 py-1">{Math.round(macros.protein * multiplier)}</td>
                                      <td className="px-2 py-1">{Math.round(macros.fiber * multiplier)}</td>
                                      <td className="px-2 py-1">
                                        <button 
                                          onClick={(ev) => {
                                            ev.stopPropagation();
                                            deleteLog(log.id);
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
            </>
          ) : (
            <Exercise 
              user={user} 
              userProfile={userProfile} 
              saveUserProfile={saveUserProfile}
            />
          )}

          {goalsModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-center">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Time Zone</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={userProfile?.timezone || 'America/New_York'}
                      onChange={e => setUserProfile({ ...userProfile, timezone: e.target.value })}
                    >
                      {timeZoneOptions.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Daily Calories</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1"
                      value={userProfile?.goals?.calories || ''}
                      onChange={e => setUserProfile({ ...userProfile, goals: { ...userProfile.goals, calories: Number(e.target.value) } })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['carbs', 'fat', 'protein'].map(macro => (
                      <div key={macro} className="flex flex-col items-center">
                        <label className="block text-sm font-medium mb-1">{macro.charAt(0).toUpperCase() + macro.slice(1)}</label>
                        <input
                          type="number"
                          className="w-16 border rounded text-center"
                          value={userProfile?.goals?.[macro] || ''}
                          onChange={e => setUserProfile({ ...userProfile, goals: { ...userProfile.goals, [macro]: Number(e.target.value) } })}
                        />
                        <span className="text-xs text-gray-500">g</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fiber</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1"
                      value={userProfile?.goals?.fiber || ''}
                      onChange={e => setUserProfile({ ...userProfile, goals: { ...userProfile.goals, fiber: Number(e.target.value) } })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setGoalsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={async () => { await saveUserProfile(userProfile); setGoalsModalOpen(false); }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <div className="inline-flex items-center gap-1">
                      {(() => {
                        const d = new Date(editingLog.timestamp);
                        let hour = d.getHours();
                        const minute = d.getMinutes();
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const hour12 = (hour % 12) || 12;
                        return <>
                          <input
                            type="number"
                            min={1}
                            max={12}
                            className="w-12 border rounded px-2 py-1 text-center"
                            value={hour12}
                            onChange={e => {
                              let newHour = parseInt(e.target.value, 10);
                              if (isNaN(newHour) || newHour < 1) newHour = 1;
                              if (newHour > 12) newHour = 12;
                              let h24 = ampm === 'PM' ? (newHour === 12 ? 12 : newHour + 12) : (newHour === 12 ? 0 : newHour);
                              const d2 = new Date(editingLog.timestamp);
                              d2.setHours(h24);
                              setEditingLog({ ...editingLog, timestamp: d2.toISOString() });
                            }}
                          />
                          :
                          <input
                            type="number"
                            min={0}
                            max={59}
                            className="w-12 border rounded px-2 py-1 text-center"
                            value={minute.toString().padStart(2, '0')}
                            onChange={e => {
                              let newMinute = parseInt(e.target.value, 10);
                              if (isNaN(newMinute) || newMinute < 0) newMinute = 0;
                              if (newMinute > 59) newMinute = 59;
                              const d2 = new Date(editingLog.timestamp);
                              d2.setMinutes(newMinute);
                              setEditingLog({ ...editingLog, timestamp: d2.toISOString() });
                            }}
                          />
                          <select
                            className="border rounded px-2 py-1"
                            value={ampm}
                            onChange={e => {
                              let newAmpm = e.target.value;
                              let h = hour12;
                              let h24 = newAmpm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
                              const d2 = new Date(editingLog.timestamp);
                              d2.setHours(h24);
                              setEditingLog({ ...editingLog, timestamp: d2.toISOString() });
                            }}
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </>;
                      })()}
                    </div>
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
