import React, { useState, useMemo, useEffect } from "react";
import { useExerciseLibrary } from '../hooks/useExerciseLibrary';
import { useExerciseCart } from "../hooks/useExerciseCart";
import { useExerciseLogs } from "../hooks/useExerciseLogs";
import { saveWorkoutLog } from '../firebase/firestore/logExerciseEntry';
import { calculateWorkoutScore } from '../services/scoringService';
import ExerciseCartRow from '../components/exercise/ExerciseCartRow';
import useAuthStore from "../store/useAuthStore";
import CartActionButtons from "../components/Cart/CartActionButtons";
import { getTimeSegment } from '../utils/timeUtils';

export default function ExercisePage() {
  const { user, userProfile, saveUserProfile } = useAuthStore();
  const cart = useExerciseCart();
  const {
    localExercises,
    loading: libraryLoading,
    exerciseQuery,
    setExerciseQuery,
    handleSearch,
    showDropdown,
    exerciseResults,
    handleSelectExercise,
  } = useExerciseLibrary({ onExerciseAdd: cart.addToExerciseCart });
  
  const { exerciseLogs, loading: logsLoading, deleteExerciseLog, updateExerciseLog } = useExerciseLogs();

  const [editingLog, setEditingLog] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [expectedScores, setExpectedScores] = useState({});
  const [customExercise, setCustomExercise] = useState({
    label: "",
    category: "Strength",
    muscleGroup: "",
    caloriesPerMinute: ""
  });

  // --- Data Joining and Grouping ---
  const enrichedHistory = useMemo(() => {
    if (!exerciseLogs.length || !localExercises.length) return [];
    return exerciseLogs.map(log => {
      const exerciseDetails = localExercises.find(ex => ex.id === log.exerciseId);
      return {
        ...log,
        target: exerciseDetails?.target,
      };
    });
  }, [exerciseLogs, localExercises]);

  const enrichedAndGroupedLogs = useMemo(() => {
    if (!exerciseLogs.length || !localExercises.length) return {};

    const enriched = exerciseLogs.map(log => {
      const exerciseDetails = localExercises.find(ex => ex.id === log.exerciseId);
      return {
        ...log,
        exerciseName: exerciseDetails?.name || 'Unknown Exercise',
        category: exerciseDetails?.category || 'Unknown',
      };
    });

    return enriched.reduce((acc, log) => {
      const logDate = new Date(log.timestamp.seconds * 1000);
      const dateKey = logDate.toDateString();

      if (!acc[dateKey]) {
        acc[dateKey] = { logs: [], totalDuration: 0, segments: {} };
      }
      acc[dateKey].logs.push(log);
      acc[dateKey].totalDuration += log.duration || 0;
      
      const segment = getTimeSegment(log.timestamp);
      if (!acc[dateKey].segments[segment]) {
        acc[dateKey].segments[segment] = { logs: [], totalDuration: 0 };
      }
      acc[dateKey].segments[segment].logs.push(log);
      acc[dateKey].segments[segment].totalDuration += log.duration || 0;
      
      return acc;
    }, {});
  }, [exerciseLogs, localExercises]);

  const dailyScore = useMemo(() => {
    if (!exerciseLogs || exerciseLogs.length === 0) {
      return 0;
    }

    // Find the timestamp of the most recent log entry
    const mostRecentLog = exerciseLogs.reduce((latest, current) => {
      const latestTime = latest.timestamp.seconds;
      const currentTime = current.timestamp.seconds;
      return currentTime > latestTime ? current : latest;
    });
    
    // Determine the date string for that most recent day
    const mostRecentDateString = new Date(mostRecentLog.timestamp.seconds * 1000).toDateString();

    // Find the corresponding data in the grouped logs
    const scoreData = enrichedAndGroupedLogs[mostRecentDateString];
    if (!scoreData) {
      return 0;
    }

    // Sum the scores for that day
    return scoreData.logs.reduce((total, log) => total + (log.score || 0), 0);
  }, [exerciseLogs, enrichedAndGroupedLogs]);

  useEffect(() => {
    if (!cart.exerciseCart.length || !localExercises.length) {
        setExpectedScores({});
        return;
    }

    const [year, month, day] = cart.datePart.split('-').map(Number);
    const [hour, minute] = cart.timePart.split(':').map(Number);
    const logTimestamp = new Date(year, month - 1, day, hour, minute);

    const newScores = {};

    for (const exerciseInCart of cart.exerciseCart) {
        const sets = cart.currentLogData[exerciseInCart.id] || [];

        const validSets = sets
            .map(set => ({
                weight: Number(set.weight) || null,
                reps: Number(set.reps) || null,
                duration: Number(set.duration) || null,
            }))
            .filter(set => set.weight || set.reps || set.duration);

        if (validSets.length === 0) {
            newScores[exerciseInCart.id] = 0;
            continue;
        }

        const exerciseDetails = localExercises.find(ex => ex.id === exerciseInCart.id);
        const isDurationBased = validSets.some(set => set.duration && !set.weight && !set.reps);

        const workoutToScore = {
            timestamp: logTimestamp,
            sets: !isDurationBased ? validSets.map(({ weight, reps }) => ({ weight, reps })) : null,
            duration: isDurationBased ? validSets.reduce((total, set) => total + set.duration, 0) : null,
        };
        
        const score = calculateWorkoutScore(workoutToScore, enrichedHistory, exerciseDetails);
        newScores[exerciseInCart.id] = score;
    }

    setExpectedScores(newScores);

  }, [cart.currentLogData, cart.exerciseCart, localExercises, exerciseLogs, enrichedHistory, cart.datePart, cart.timePart]);

  const handleLogCart = async () => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    const [year, month, day] = cart.datePart.split('-').map(Number);
    const [hour, minute] = cart.timePart.split(':').map(Number);
    const logTimestamp = new Date(year, month - 1, day, hour, minute);

    for (const exerciseInCart of cart.exerciseCart) {
      const sets = cart.currentLogData[exerciseInCart.id];
      if (!sets || sets.length === 0) continue;

      const validSets = sets
        .map(set => ({
          weight: Number(set.weight) || null,
          reps: Number(set.reps) || null,
          duration: Number(set.duration) || null,
        }))
        .filter(set => set.weight || set.reps || set.duration);

      if (validSets.length === 0) continue;
      
      const isDurationBased = validSets.some(set => set.duration && !set.weight && !set.reps);

      const workoutToLog = {
        userId: user.uid,
        exerciseId: exerciseInCart.id,
        timestamp: logTimestamp,
        sets: !isDurationBased ? validSets.map(({ weight, reps }) => ({ weight, reps })) : null,
        duration: isDurationBased ? validSets.reduce((total, set) => total + set.duration, 0) : null,
        distance: null,
        effortLevel: null,
        notes: "",
        modifiers: [],
        source: "user",
        score: expectedScores[exerciseInCart.id] || 0
      };

      // --- Pre-Save Validation ---
      for (const key in workoutToLog) {
        if (workoutToLog[key] === undefined) {
          console.error("Attempted to log an exercise with an undefined value.", {
            key,
            workoutToLog
          });
          // Optionally, throw an error to halt execution
          throw new Error(`Undefined value found for key: ${key}`);
        }
      }

      await saveWorkoutLog(workoutToLog);
    }
    cart.clearCart();
    // After logging, maybe show a success message
  };

  // Toggle pin exercise
  const togglePinExercise = async (exerciseId) => {
    if (!userProfile) return;
    const currentPinned = userProfile.pinnedExercises || [];
    const newPinned = currentPinned.some(id => id === exerciseId)
      ? currentPinned.filter(id => id !== exerciseId)
      : [...currentPinned, exerciseId];
    await saveUserProfile({ ...userProfile, pinnedExercises: newPinned });
  };

  if (libraryLoading || logsLoading) {
    return <div className="text-center py-8">Loading exercises...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex justify-between items-start mb-2">
          <div className="text-right">
             <div className="text-lg font-bold text-green-600">{dailyScore}</div>
             <div className="text-xs text-gray-500">Points Today</div>
          </div>
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
              const exercise = localExercises.find(e => e.id === exerciseId);
              if (!exercise) return null;
              
              const exerciseForCart = {
                id: exercise.id,
                name: exercise.name,
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
                    onClick={() => cart.addToExerciseCart(exerciseForCart)}
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
                  value={exerciseQuery}
                  onChange={e => setExerciseQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              {showDropdown && (
                <ul className="z-20 bg-white border border-gray-200 rounded w-full mt-1 max-h-56 overflow-auto shadow-lg">
                  {exerciseResults.length > 0 ? (
                    exerciseResults.map((exercise, idx) => (
                      <li
                        key={exercise.id || exercise.name + idx}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                        onClick={() => handleSelectExercise(exercise)}
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
                      {libraryLoading ? 'Loading...' : 'No exercises found'}
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">Searching local exercise library</div>
          </div>
        )}

        {/* Exercise Cart */}
        {cart.exerciseCart.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-col sm:flex-row gap-2 mb-2 items-center justify-between">
              <div>
                <label className="text-sm mr-2">Date:</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1"
                  value={cart.datePart}
                  onChange={e => cart.setDatePart(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm mr-2">Time:</label>
                <input
                  type="time"
                  className="border rounded px-2 py-1"
                  value={cart.timePart}
                  onChange={e => cart.setTimePart(e.target.value)}
                />
              </div>
            </div>
            <div className="border rounded divide-y">
              {cart.exerciseCart.map(exercise => (
                <ExerciseCartRow
                  key={exercise.id}
                  exercise={exercise}
                  logData={cart.currentLogData[exercise.id] || []}
                  onLogDataChange={(data) => cart.handleLogDataChange(exercise.id, data)}
                  onRemove={() => cart.removeFromExerciseCart(exercise.id)}
                  expectedScore={expectedScores[exercise.id] || 0}
                />
              ))}
            </div>
            <CartActionButtons
              onLog={handleLogCart}
              onClear={cart.clearCart}
            />
          </div>
        )}
      </div>

      {/* Exercise Logs Table */}
      <div className="bg-white rounded-lg shadow p-4 overflow-auto">
        <h3 className="text-lg font-semibold mb-2">Workout History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left font-medium">Exercise</th>
                <th className="p-2 text-left font-medium">Category</th>
                <th className="p-2 text-left font-medium">Duration (min)</th>
                <th className="p-2 text-left font-medium">Score</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(enrichedAndGroupedLogs).map(([date, dateGroup]) => (
                <React.Fragment key={date}>
                  <tr className="bg-gray-100">
                    <td colSpan="5" className="p-2 font-semibold">{date} (Total Duration: {dateGroup.totalDuration.toFixed(1)} min)</td>
                  </tr>
                  {Object.entries(dateGroup.segments).map(([segment, segmentGroup]) => (
                    <React.Fragment key={segment}>
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan="5" className="px-4 py-1 text-gray-700">{segment} (Duration: {segmentGroup.totalDuration.toFixed(1)} min)</td>
                      </tr>
                      {segmentGroup.logs.map(log => (
                        <tr key={log.id}>
                          <td className="p-2">{log.exerciseName}</td>
                          <td className="p-2">{log.category}</td>
                          <td className="p-2">{log.duration?.toFixed(1) ?? 'N/A'}</td>
                          <td className="p-2">{log.score}</td>
                          <td className="p-2 text-center">
                            <button onClick={() => deleteExerciseLog(log.id)} className="text-red-500 hover:text-red-700">×</button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
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