import React from "react";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import ExerciseLibrary from './ExerciseLibrary';

export default function Exercise({ user, userProfile, saveUserProfile }) {
  const [exerciseCart, setExerciseCart] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customExercise, setCustomExercise] = useState({ 
    label: "", 
    category: "Strength", 
    muscleGroup: "", 
    caloriesPerMinute: "" 
  });

  // Time and date state for exercise cart
  const now = new Date();
  let defaultHour = now.getHours();
  const [cartHour12, setCartHour12] = useState(((defaultHour % 12) || 12));
  const [cartMinute, setCartMinute] = useState(now.getMinutes());
  const [cartAmPm, setCartAmPm] = useState(defaultHour >= 12 ? 'PM' : 'AM');
  const [cartDate, setCartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cartDuration, setCartDuration] = useState(30); // minutes

  // Helper function to determine time segment
  const getTimeSegment = (date) => {
    const hours = date.getHours();
    if (hours >= 0 && hours < 9) return "Morning";
    if (hours >= 9 && hours < 16) return "Midday";
    return "Evening";
  };

  // Helper to get current time segment in user's timezone
  function getDefaultTimeSegment() {
    const now = new Date();
    const userTimezone = userProfile?.timezone || 'America/New_York';
    const options = { timeZone: userTimezone, hour: 'numeric', hour12: false };
    const hour = parseInt(now.toLocaleString('en-US', options));
    if (hour >= 0 && hour < 9) return 'Morning';
    if (hour >= 9 && hour < 16) return 'Midday';
    return 'Evening';
  }

  const [cartSegment, setCartSegment] = useState(getDefaultTimeSegment());

  // Initialize ExerciseLibrary
  const exerciseLibrary = ExerciseLibrary({ onExerciseAdd: addToExerciseCart });

  // Load exercise logs from Firestore
  useEffect(() => {
    const fetchExerciseLogs = async () => {
      if (!user) return;
      try {
        const logsQuery = query(
          collection(db, 'exerciseLog'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(logsQuery);
        const fetchedLogs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExerciseLogs(fetchedLogs);
      } catch (error) {
        console.error("Error fetching exercise logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExerciseLogs();
  }, [user]);

  // Add to exercise cart helper
  const addToExerciseCart = (exercise, duration = 30) => {
    setExerciseCart(cart => {
      const idx = cart.findIndex(item => item.id === exercise.id);
      if (idx !== -1) {
        // If already in cart, increment duration
        const updated = [...cart];
        updated[idx].duration += duration;
        return updated;
      } else {
        return [...cart, { ...exercise, duration }];
      }
    });
  };

  // Remove from exercise cart
  const removeFromExerciseCart = (exerciseId) => {
    setExerciseCart(cart => cart.filter(item => item.id !== exerciseId));
  };

  // Update exercise cart duration
  const updateExerciseCartDuration = (exerciseId, newDuration) => {
    setExerciseCart(cart => 
      cart.map(item => 
        item.id === exerciseId 
          ? { ...item, duration: Math.max(1, parseInt(newDuration) || 1) }
          : item
      )
    );
  };

  // Log exercise cart
  const logExerciseCart = async () => {
    if (!user || exerciseCart.length === 0) return;

    const userTimezone = userProfile?.timezone || 'America/New_York';
    const get24Hour = (hour12, ampm) => {
      let hour = parseInt(hour12);
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return hour;
    };

    const formatTimestampLocal = (dateStr, hour12, minute, ampm) => {
      const [year, month, day] = dateStr.split('-');
      const hour = get24Hour(hour12, ampm);
      const date = new Date(year, month - 1, day, hour, minute);
      
      // Convert to user's timezone
      const userDate = new Date(date.toLocaleString("en-US", {timeZone: userTimezone}));
      return userDate.toISOString();
    };

    try {
      const timestamp = formatTimestampLocal(cartDate, cartHour12, cartMinute, cartAmPm);
      
      for (const exercise of exerciseCart) {
        const calories = Math.round((exercise.caloriesPerMinute || 0) * exercise.duration);
        await addDoc(collection(db, 'exerciseLog'), {
          userId: user.uid,
          exerciseId: exercise.id,
          exerciseName: exercise.label,
          category: exercise.category,
          muscleGroup: exercise.muscleGroup,
          bodyPart: exercise.bodyPart,
          equipment: exercise.equipment,
          difficulty: exercise.difficulty,
          duration: exercise.duration,
          calories: calories,
          timestamp: timestamp,
          timeSegment: cartSegment,
          // Store all the additional fields from the API
          instructions: exercise.instructions,
          description: exercise.description,
          gifUrl: exercise.gifUrl,
          secondaryMuscles: exercise.secondaryMuscles
        });
      }

      // Refresh logs
      const logsQuery = query(
        collection(db, 'exerciseLog'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(logsQuery);
      const fetchedLogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExerciseLogs(fetchedLogs);

      // Clear cart
      setExerciseCart([]);
    } catch (error) {
      console.error("Error logging exercises:", error);
    }
  };

  // Delete exercise log
  const deleteExerciseLog = async (id) => {
    try {
      await deleteDoc(doc(db, 'exerciseLog', id));
      setExerciseLogs(logs => logs.filter(log => log.id !== id));
    } catch (error) {
      console.error("Error deleting exercise log:", error);
    }
  };

  // Update exercise log
  const updateExerciseLog = async (id, field, value) => {
    try {
      await updateDoc(doc(db, 'exerciseLog', id), { [field]: value });
      setExerciseLogs(logs => 
        logs.map(log => log.id === id ? { ...log, [field]: value } : log)
      );
    } catch (error) {
      console.error("Error updating exercise log:", error);
    }
  };

  // Toggle pin exercise
  const togglePinExercise = async (exerciseId) => {
    if (!userProfile) return;
    
    const currentPinned = userProfile.pinnedExercises || [];
    const isPinned = currentPinned.includes(exerciseId);
    
    const newPinned = isPinned 
      ? currentPinned.filter(id => id !== exerciseId)
      : [...currentPinned, exerciseId];
    
    const updatedProfile = {
      ...userProfile,
      pinnedExercises: newPinned
    };
    
    await saveUserProfile(updatedProfile);
  };

  // Group exercises by date
  const todayString = new Date().toDateString();
  const todayLogs = exerciseLogs.filter(l => new Date(l.timestamp).toDateString() === todayString);
  
  const groupByDate = exerciseLogs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const groupByTimeSegment = (dayLogs) => {
    return dayLogs.reduce((acc, log) => {
      const segment = getTimeSegment(new Date(log.timestamp));
      if (!acc[segment]) acc[segment] = [];
      acc[segment].push(log);
      return acc;
    }, {});
  };

  const dailyTotals = (logsArr) => {
    return logsArr.reduce((acc, log) => {
      acc.calories += log.calories || 0;
      acc.duration += log.duration || 0;
      return acc;
    }, { calories: 0, duration: 0 });
  };

  if (loading) {
    return <div className="text-center py-8">Loading exercises...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex justify-end mb-2">
          <button
            className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
            onClick={() => setShowCustomForm(v => !v)}
            title={showCustomForm ? "Hide Custom Exercise" : "Add Custom Exercise"}
          >
            <span style={{fontSize: '1.2em'}}>⤢</span> {showCustomForm ? "Hide" : "Custom Exercise"}
          </button>
        </div>
        
        {/* Pinned Exercises */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {userProfile?.pinnedExercises && userProfile.pinnedExercises.length > 0 ? (
            userProfile.pinnedExercises.map(exerciseId => {
              // Find exercise in local library
              const exercise = exerciseLibrary.localExercises.find(e => e.id === exerciseId);
              if (!exercise) return null;
              
              const exerciseForCart = {
                id: exercise.id,
                label: exercise.name,
                category: exercise.category || 'strength',
                muscleGroup: exercise.target,
                bodyPart: exercise.bodyPart,
                equipment: exercise.equipment,
                difficulty: exercise.difficulty,
                instructions: exercise.instructions,
                description: exercise.description,
                gifUrl: exercise.gifUrl,
                secondaryMuscles: exercise.secondaryMuscles,
                caloriesPerMinute: exercise.caloriesPerMinute || 6
              };
              
              return (
                <div key={exercise.id} className="relative">
                  <button
                    onClick={() => addToExerciseCart(exerciseForCart)}
                    className="bg-gray-100 border hover:bg-blue-100 rounded p-2 text-sm flex flex-col w-full"
                  >
                    <span className="font-medium">{exercise.name}</span>
                    <span className="text-xs text-gray-500">
                      {exercise.category} • {exercise.target}
                    </span>
                    <span className="text-xs text-blue-600">
                      {exercise.equipment} • {exercise.difficulty}
                    </span>
                  </button>
                  <button
                    className="absolute top-1 right-1 text-yellow-500 hover:text-yellow-700 text-lg font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinExercise(exercise.id);
                    }}
                    title="Unpin exercise"
                    style={{lineHeight: 1}}
                  >
                    📌
                  </button>
                </div>
              );
            })
          ) : null}
          
          {/* Add Custom Exercise Button */}
          <div className="relative">
            <button
              className="bg-green-500 hover:bg-green-600 text-white rounded p-2 flex flex-col items-center justify-center w-full h-full min-h-[60px] border-2 border-green-700 text-3xl"
              style={{ minHeight: '60px' }}
              onClick={() => setShowCustomForm(true)}
              title="Add Custom Exercise"
            >
              <span>+</span>
            </button>
          </div>
        </div>

        {/* Exercise Search Form */}
        {showCustomForm && (
          <div className="bg-white border rounded-lg p-4 flex flex-col gap-2 shadow-lg">
            <h3 className="font-semibold mb-2">Search Exercise Library</h3>
            <div className="flex flex-col gap-1 relative">
              <div className="flex gap-2">
                <input
                  className="border rounded px-2 py-1 flex-1"
                  placeholder="e.g. bench press, squats, push-ups"
                  value={exerciseLibrary.exerciseQuery}
                  onChange={e => {
                    exerciseLibrary.setExerciseQuery(e.target.value);
                    exerciseLibrary.handleSearch(e.target.value);
                  }}
                  disabled={exerciseLibrary.loading}
                  autoComplete="off"
                />
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1"
                  disabled={exerciseLibrary.loading || !exerciseLibrary.exerciseQuery}
                  onClick={() => exerciseLibrary.handleSearch(exerciseLibrary.exerciseQuery)}
                  type="button"
                >
                  {exerciseLibrary.loading ? 'Loading...' : 'Search'}
                </button>
              </div>
              
              {/* Exercise Search Results */}
              {exerciseLibrary.exerciseQuery && exerciseLibrary.showDropdown && (
                <ul className="z-20 bg-white border border-gray-200 rounded w-full mt-1 max-h-56 overflow-auto shadow-lg">
                  {exerciseLibrary.exerciseResults && exerciseLibrary.exerciseResults.length > 0 ? (
                    exerciseLibrary.exerciseResults.map((exercise, idx) => (
                      <li
                        key={exercise.id || exercise.name + idx}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm flex items-center justify-between"
                        onClick={() => exerciseLibrary.handleSelectExercise(exercise)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-xs text-gray-600">
                            {exercise.target} • {exercise.equipment} • {exercise.difficulty}
                          </div>
                          <div className="text-xs text-blue-600">
                            {exercise.bodyPart} • {exercise.secondaryMuscles?.join(', ')}
                          </div>
                        </div>
                        <button
                          className={`ml-2 text-yellow-500 hover:text-yellow-700 bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-300`}
                          onClick={e => {
                            e.stopPropagation();
                            togglePinExercise(exercise.id);
                          }}
                          title={userProfile?.pinnedExercises?.includes(exercise.id) ? "Unpin exercise" : "Pin exercise"}
                          style={{lineHeight: 1}}
                        >
                          {userProfile?.pinnedExercises?.includes(exercise.id) ? '📌' : '📍'}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-gray-400 cursor-default text-sm">
                      {exerciseLibrary.loading ? 'Loading...' : 'No exercises found'}
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">Searching local exercise library</div>
          </div>
        )}

        {/* Exercise Cart */}
        {exerciseCart.length > 0 && (
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
            <h3 className="font-semibold mb-2">Exercise Cart</h3>
            <table className="min-w-full text-sm mb-2 border border-gray-200">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 px-2 py-1">Exercise</th>
                  <th className="border-b border-gray-200 px-2 py-1">Category</th>
                  <th className="border-b border-gray-200 px-2 py-1">Duration (min)</th>
                  <th className="border-b border-gray-200 px-2 py-1">Calories</th>
                  <th className="border-b border-gray-200 px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {exerciseCart.map((exercise, idx) => (
                  <tr key={exercise.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="border-r border-gray-100 px-2 py-1 font-medium">{exercise.label}</td>
                    <td className="border-r border-gray-100 px-2 py-1">{exercise.category}</td>
                    <td className="border-r border-gray-100 px-2 py-1">
                      <input
                        type="number"
                        min={1}
                        className="w-16 border rounded text-center"
                        value={exercise.duration}
                        onChange={e => updateExerciseCartDuration(exercise.id, e.target.value)}
                      />
                    </td>
                    <td className="border-r border-gray-100 px-2 py-1">
                      {Math.round((exercise.caloriesPerMinute || 0) * exercise.duration)}
                    </td>
                    <td className="px-2 py-1">
                      <button className="text-red-500" onClick={() => removeFromExerciseCart(exercise.id)}>✖️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mt-2">
              <button
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 flex items-center justify-center text-xl shadow"
                disabled={exerciseCart.length === 0}
                onClick={logExerciseCart}
                title="Log All"
                aria-label="Log All"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 flex items-center justify-center text-xl shadow"
                disabled={exerciseCart.length === 0}
                onClick={() => setExerciseCart([])}
                title="Clear Cart"
                aria-label="Clear Cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Logs Table */}
      <div className="bg-white rounded-lg shadow p-4 overflow-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-1">Exercise</th>
              <th className="px-2 py-1">Category</th>
              <th className="px-2 py-1">Duration (min)</th>
              <th className="px-2 py-1">Calories</th>
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
                    <td colSpan={2} className="px-2 py-2">
                      <span role="img" aria-label="Calendar">🗓️</span> {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-2 py-2">{Math.round(dailyTotal.duration)}</td>
                    <td className="px-2 py-2">{Math.round(dailyTotal.calories)}</td>
                    <td></td>
                  </tr>
                  {Object.entries(segments).map(([segment, segmentLogs]) => (
                    segmentLogs.length > 0 && (
                      <React.Fragment key={segment}>
                        <tr className="bg-gray-50">
                          <td colSpan={2} className="px-2 py-1 font-medium">{segment}</td>
                          {(() => {
                            const segmentTotal = dailyTotals(segmentLogs);
                            return (
                              <>
                                <td className="px-2 py-1">{Math.round(segmentTotal.duration)}</td>
                                <td className="px-2 py-1">{Math.round(segmentTotal.calories)}</td>
                                <td></td>
                              </>
                            );
                          })()}
                        </tr>
                        {segmentLogs.map(log => (
                          <tr 
                            key={log.id} 
                            className="border-t hover:bg-gray-50 cursor-pointer"
                            onClick={() => setEditingLog(log)}
                          >
                            <td className="px-2 py-1">{log.exerciseName}</td>
                            <td className="px-2 py-1">{log.category}</td>
                            <td className="px-2 py-1">{log.duration}</td>
                            <td className="px-2 py-1">{log.calories}</td>
                            <td className="px-2 py-1">
                              <button 
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  deleteExerciseLog(log.id);
                                }} 
                                className="text-red-600"
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        ))}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Exercise Entry</h3>
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
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border rounded px-2 py-1"
                  value={editingLog.duration}
                  onChange={ev => setEditingLog({ ...editingLog, duration: parseInt(ev.target.value) || 1 })}
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
                    updateExerciseLog(editingLog.id, "timestamp", editingLog.timestamp);
                    updateExerciseLog(editingLog.id, "duration", editingLog.duration);
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
    </div>
  );
} 