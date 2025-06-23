import { useState, useMemo, useEffect } from 'react';
import { calculateWorkoutScore } from '../services/scoringService';

export default function useScoreProgress(logs, exercises, cartData = {}, userProfile = null) {
  const [expectedScores, setExpectedScores] = useState({});

  // Calculate daily score from logs
  const dailyScore = useMemo(() => {
    if (!logs || logs.length === 0) {
      return 0;
    }

    // Find the timestamp of the most recent log entry
    const mostRecentLog = logs.reduce((latest, current) => {
      const latestTime = latest.timestamp.seconds || latest.timestamp.getTime();
      const currentTime = current.timestamp.seconds || current.timestamp.getTime();
      return currentTime > latestTime ? current : latest;
    });
    
    // Determine the date string for that most recent day
    const mostRecentDateString = new Date(
      mostRecentLog.timestamp.seconds ? mostRecentLog.timestamp.seconds * 1000 : mostRecentLog.timestamp
    ).toDateString();

    // Sum the scores for that day
    return logs
      .filter(log => {
        const logDate = new Date(
          log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp
        ).toDateString();
        return logDate === mostRecentDateString;
      })
      .reduce((total, log) => total + (log.score || 0), 0);
  }, [logs]);

  // Calculate expected scores for cart items
  useEffect(() => {
    if (!cartData.exerciseCart?.length || !exercises?.length) {
      setExpectedScores({});
      return;
    }

    const [year, month, day] = cartData.datePart?.split('-').map(Number) || [];
    const [hour, minute] = cartData.timePart?.split(':').map(Number) || [];
    
    if (!year || !month || !day) {
      setExpectedScores({});
      return;
    }

    const logTimestamp = new Date(year, month - 1, day, hour, minute);
    const newScores = {};

    for (const exerciseInCart of cartData.exerciseCart) {
      const setData = cartData.currentLogData?.[exerciseInCart.id] || {};

      const validSet = {
        weight: Number(setData.weight) || null,
        reps: Number(setData.reps) || null,
        duration: Number(setData.duration) || null,
      };

      if (!validSet.weight && !validSet.reps && !validSet.duration) {
        newScores[exerciseInCart.id] = 0;
        continue;
      }

      const exerciseDetails = exercises.find(ex => ex.id === exerciseInCart.id);
      const isDurationBased = validSet.duration && !validSet.weight && !validSet.reps;

      const workoutToScore = {
        timestamp: logTimestamp,
        sets: !isDurationBased ? [{ weight: validSet.weight, reps: validSet.reps }] : null,
        duration: isDurationBased ? validSet.duration : null,
      };
      
      const score = calculateWorkoutScore(workoutToScore, logs, exerciseDetails, userProfile);
      newScores[exerciseInCart.id] = score;
    }

    setExpectedScores(newScores);
  }, [cartData.currentLogData, cartData.exerciseCart, exercises, logs, cartData.datePart, cartData.timePart, userProfile]);

  return {
    dailyScore,
    expectedScores,
    setExpectedScores,
  };
} 