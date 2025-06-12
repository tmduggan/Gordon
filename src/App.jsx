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

export default function FoodTracker() {
  const [logs, setLogs] = useState([]); // foodLog entries
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFood, setCustomFood] = useState({ label: "", calories: "", fat: "", carbs: "", protein: "", fiber: "" });
  const [loading, setLoading] = useState(true);
  const [hiddenFoods, setHiddenFoods] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [user, setUser] = useState(null);
  const loadedRef = useRef(false);
  const foodList = FoodLibrary();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [userGoals, setUserGoals] = useState(null);

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

  // Log a new food to foodLog
  const logFood = async (foodItem) => {
    const timestamp = new Date().toISOString();
    const food = foodList.find(f => f.label === foodItem.label);
    if (!food || !user) return;
    const newLog = {
      foodId: food.id,
      timestamp,
      serving: food.serving || 1,
      units: food.units || 'serving',
      userId: user.uid
    };
    try {
      const docRef = await addDoc(collection(db, 'foodLog'), newLog);
      setLogs([{ id: docRef.id, ...newLog }, ...logs]);
    } catch (error) {
      console.error("Error adding food log:", error);
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
        const multiplier = log.serving / (food.serving || 1);
        Object.keys(defaultGoals).forEach(k => {
          acc[k] += (food[k] || 0) * multiplier;
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
            <div className="ml-auto z-10">
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
                onClick={showAllFoods}
                title="Show all foods"
              >
                <span style={{fontSize: '1.2em'}}>⤢</span> Show All
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {foodList && foodList.length > 0 ? (
                <>
                  {getSortedFoodList().filter(item => !hiddenFoods.includes(item.id || item.label)).map(item => (
                    <div key={item.id || item.label} className="relative">
                      <button
                        onClick={() => logFood(item)}
                        className="bg-gray-100 border hover:bg-blue-100 rounded p-2 text-sm flex flex-col w-full"
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-500">
                          {item.serving}{item.units} • {item.calories}c {item.fat}f {item.carbs}c {item.protein}p
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
            {showCustomForm && (
              <div className="bg-white border rounded-lg p-4 mt-4 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Food name" value={customFood.label} onChange={e => setCustomFood({ ...customFood, label: e.target.value })} />
                  <input className="border rounded px-2 py-1" placeholder="Calories" type="number" value={customFood.calories} onChange={e => setCustomFood({ ...customFood, calories: e.target.value })} />
                  <input className="border rounded px-2 py-1" placeholder="Fat" type="number" value={customFood.fat} onChange={e => setCustomFood({ ...customFood, fat: e.target.value })} />
                  <input className="border rounded px-2 py-1" placeholder="Carbs" type="number" value={customFood.carbs} onChange={e => setCustomFood({ ...customFood, carbs: e.target.value })} />
                  <input className="border rounded px-2 py-1" placeholder="Protein" type="number" value={customFood.protein} onChange={e => setCustomFood({ ...customFood, protein: e.target.value })} />
                  <input className="border rounded px-2 py-1" placeholder="Fiber" type="number" value={customFood.fiber} onChange={e => setCustomFood({ ...customFood, fiber: e.target.value })} />
                  <input className="border rounded px-2 py-1" placeholder="Serving Size" type="number" value={customFood.serving} onChange={e => setCustomFood({ ...customFood, serving: e.target.value })} />
                  <input className="border rounded px-2 py-1" placeholder="Units (e.g. g, bowl)" value={customFood.units} onChange={e => setCustomFood({ ...customFood, units: e.target.value })} />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white rounded p-2 flex items-center justify-center text-xl"
                    title="Save"
                    onClick={() => {
                      logFood(customFood);
                      setShowCustomForm(false);
                      setCustomFood({ label: "", calories: "", fat: "", carbs: "", protein: "", fiber: "", serving: "", units: "" });
                    }}
                  >
                    <span role="img" aria-label="Save">💾</span>
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white rounded p-2 flex items-center justify-center text-xl"
                    title="Cancel"
                    onClick={() => {
                      setShowCustomForm(false);
                      setCustomFood({ label: "", calories: "", fat: "", carbs: "", protein: "", fiber: "", serving: "", units: "" });
                    }}
                  >
                    <span role="img" aria-label="Cancel">✖️</span>
                  </button>
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
                                    <td key={k} className="px-2 py-1">{food ? Math.round((food[k] || 0) * multiplier) : ''}</td>
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
