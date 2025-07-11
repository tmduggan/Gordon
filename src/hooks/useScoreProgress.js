import { useState, useMemo, useEffect } from 'react';

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

    // TODO: Implement XP scoring separately from muscle scores
    const newScores = {};
    for (const exerciseInCart of cartData.exerciseCart) {
      newScores[exerciseInCart.id] = 0; // Placeholder until XP scoring is implemented
    }

    setExpectedScores(newScores);
  }, [cartData.currentLogData, cartData.exerciseCart, exercises, logs, cartData.datePart, cartData.timePart, userProfile]);

  return {
    dailyScore,
    expectedScores,
    setExpectedScores,
  };
} 