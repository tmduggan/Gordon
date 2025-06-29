import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState, useMemo } from 'react';

export function ExerciseTooltipContent({ exercise, bonusXP, laggingType, userProfile, workoutLog = [] }) {
  const [gifError, setGifError] = useState(false);
  if (!exercise) return null;

  // Find logs for this exercise (coerce both to string for comparison)
  const logs = useMemo(() => workoutLog.filter(l => String(l.exerciseId) === String(exercise.id)), [workoutLog, exercise.id]);
  const hasLogs = logs.length > 0;

  // Find the most recent log (by timestamp)
  const lastLog = hasLogs ? logs.reduce((latest, l) => {
    if (!latest) return l;
    const latestTime = latest.timestamp?.seconds ? latest.timestamp.seconds : new Date(latest.timestamp).getTime() / 1000;
    const lTime = l.timestamp?.seconds ? l.timestamp.seconds : new Date(l.timestamp).getTime() / 1000;
    return lTime > latestTime ? l : latest;
  }, null) : null;

  // Best duration (cardio)
  const bestDuration = logs.reduce((max, l) => (l.duration && (!max || l.duration > max.duration)) ? l : max, null);
  // Best 1RM (strength)
  const best1RM = logs.reduce((max, l) => (l.oneRepMax && (!max || l.oneRepMax > max.oneRepMax)) ? l : max, null);

  // Format time ago
  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  // Tooltip text logic
  let statusText = '';
  if (!hasLogs) {
    statusText = 'Never Trained';
  } else if (laggingType) {
    statusText = 'Neglected Muscle Group';
  }

  // Personal bests from profile
  const bests = userProfile?.personalBests?.[exercise.id];

  // Format helpers
  const formatAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date.seconds ? date.seconds * 1000 : date);
    const diffMs = now - then;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString();
  };

  // Cardio: Last Logged & Best Duration
  let lastLoggedCardio = null, bestCardio = null;
  if (exercise.category && exercise.category.toLowerCase() === 'cardio') {
    if (lastLog && lastLog.duration) {
      lastLoggedCardio = `${lastLog.duration} minutes ${formatAgo(lastLog.timestamp)}`;
    }
    if (bestDuration) {
      bestCardio = `${bestDuration.duration} minutes ${formatAgo(bestDuration.timestamp)}`;
    }
  }
  // Strength: Last Logged & Best 1RM
  let lastLoggedStrength = null, bestStrength = null;
  if (!exercise.category || exercise.category.toLowerCase() !== 'cardio') {
    if (lastLog && lastLog.sets && lastLog.sets.length > 0) {
      const s = lastLog.sets[lastLog.sets.length - 1];
      lastLoggedStrength = `${s.weight} lbs x ${s.reps} reps ${formatAgo(lastLog.timestamp)}`;
    }
    if (best1RM) {
      bestStrength = `1RM: ${Math.round(best1RM.oneRepMax)} lbs (${best1RM.weight} x ${best1RM.reps}) ${formatAgo(best1RM.timestamp)}`;
    }
  }

  return (
    <div className="max-w-xs">
      {/* GIF at the top */}
      {exercise.gifUrl && !gifError && (
        <img
          src={exercise.gifUrl}
          alt={exercise.name + ' demo'}
          className="w-full h-36 object-contain rounded mb-2 border border-gray-200 bg-gray-50"
          onError={() => setGifError(true)}
        />
      )}
      {/* Fallback if GIF fails */}
      {exercise.gifUrl && gifError && (
        <div className="w-full h-36 flex items-center justify-center bg-gray-100 text-xs text-gray-500 rounded mb-2 border border-gray-200">
          GIF unavailable
        </div>
      )}
      <div className="font-semibold text-base mb-2">{exercise.name}</div>
      {/* Stats Section */}
      <div className="mb-2">
        {lastLoggedCardio && <div className="text-xs text-blue-700 font-medium">Last Logged: {lastLoggedCardio}</div>}
        {bestCardio && <div className="text-xs text-purple-700 font-medium">Best Duration: {bestCardio}</div>}
        {lastLoggedStrength && <div className="text-xs text-blue-700 font-medium">Last Logged: {lastLoggedStrength}</div>}
        {bestStrength && <div className="text-xs text-purple-700 font-medium">{bestStrength}</div>}
      </div>
      {exercise.instructions && Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
        <div className="mb-3">
          <div className="font-medium text-sm mb-1 text-green-600">Instructions:</div>
          <ol className="text-sm text-gray-700 space-y-1">
            {exercise.instructions.map((instruction, index) => (
              <li key={index} className="leading-relaxed">{index + 1}. {instruction}</li>
            ))}
          </ol>
        </div>
      )}
      {/* Show full personal bests object */}
      {bests && (
        <div className="mb-2">
          <div className="font-medium text-sm text-purple-700">Personal Best:</div>
          {bests.allTime && (
            <div className="text-xs text-gray-700 mb-1">
              <strong>All Time:</strong> {bests.allTime.value} {bests.allTime.unit} ({bests.allTime.type}) on {bests.allTime.date ? (bests.allTime.date.seconds ? new Date(bests.allTime.date.seconds * 1000).toLocaleDateString() : new Date(bests.allTime.date).toLocaleDateString()) : ''}
            </div>
          )}
          {bests.current && (
            <div className="text-xs text-gray-700 mb-1">
              <strong>Current:</strong> {bests.current.value} {bests.current.unit} ({bests.current.type}) on {bests.current.date ? (bests.current.date.seconds ? new Date(bests.current.date.seconds * 1000).toLocaleDateString() : new Date(bests.current.date).toLocaleDateString()) : ''}
            </div>
          )}
          {bests.quarter && (
            <div className="text-xs text-gray-700 mb-1">
              <strong>Quarter:</strong> {bests.quarter.value} {bests.quarter.unit} ({bests.quarter.type}) on {bests.quarter.date ? (bests.quarter.date.seconds ? new Date(bests.quarter.date.seconds * 1000).toLocaleDateString() : new Date(bests.quarter.date).toLocaleDateString()) : ''}
            </div>
          )}
          {bests.year && (
            <div className="text-xs text-gray-700 mb-1">
              <strong>Year:</strong> {bests.year.value} {bests.year.unit} ({bests.year.type}) on {bests.year.date ? (bests.year.date.seconds ? new Date(bests.year.date.seconds * 1000).toLocaleDateString() : new Date(bests.year.date).toLocaleDateString()) : ''}
            </div>
          )}
        </div>
      )}
      {/* Show full last log object */}
      {lastLog && (
        <div className="mb-2">
          <div className="font-medium text-sm text-blue-700">Last Worked (raw):</div>
          <pre className="text-xs bg-gray-100 rounded p-2 border">{JSON.stringify(lastLog, null, 2)}</pre>
        </div>
      )}
      {exercise.laggingMessage && (
        <div className="mb-2 text-sm text-purple-700">{exercise.laggingMessage}</div>
      )}
      {/* XP and Lagging Type */}
      {(bonusXP !== undefined || laggingType) && (
        <div className="mb-2 flex items-center gap-3">
          {bonusXP !== undefined && (
            <span className="flex items-center text-green-700 font-semibold text-sm">
              <span className="mr-1">⚡</span>+{bonusXP} XP
            </span>
          )}
          {laggingType && (
            <span className="flex items-center text-red-600 font-semibold text-sm">
              <span className="mr-1">🌀</span>
              {laggingType === 'neverTrained' ? 'Never Trained' : laggingType.replace(/([A-Z])/g, ' $1')}
            </span>
          )}
        </div>
      )}
      {statusText && (
        <div className="text-xs text-yellow-600 font-semibold mb-1">{statusText}</div>
      )}
      {hasLogs && lastLog && (
        <div className="text-xs text-gray-700 mb-1">
          <strong>Last Logged:</strong>{' '}
          {lastLog.duration ? `${lastLog.duration} minutes` : lastLog.sets && lastLog.sets[0] ? `${lastLog.sets[0].weight} lbs x ${lastLog.sets[0].reps} reps` : ''}
          {' '}{timeAgo(lastLog.timestamp)}
        </div>
      )}
      {bestDuration && bestDuration.duration && (
        <div className="text-xs text-gray-700 mb-1">
          <strong>Best Duration:</strong> {bestDuration.duration} minutes {timeAgo(bestDuration.timestamp)}
        </div>
      )}
      {best1RM && best1RM.oneRepMax && (
        <div className="text-xs text-gray-700 mb-1">
          <strong>1RM:</strong> {best1RM.oneRepMax} lbs {timeAgo(best1RM.timestamp)}
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2 mt-2">
        <span>Target: {exercise.target}</span>
        {exercise.equipment && <span>Equipment: {exercise.equipment}</span>}
        {exercise.category && <span>Type: {exercise.category}</span>}
      </div>
    </div>
  );
}

export default function ExerciseTooltip({ exercise, children, bonusXP, laggingType, userProfile, workoutLog }) {
  if (!exercise) return children;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <ExerciseTooltipContent exercise={exercise} bonusXP={bonusXP} laggingType={laggingType} userProfile={userProfile} workoutLog={workoutLog} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 