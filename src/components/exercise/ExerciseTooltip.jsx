import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getLastTrainedDate } from '@/utils/dataUtils';
import { formatSmartDate } from '@/utils/timeUtils';
import React, { useMemo, useState } from 'react';
import useExerciseLogStore from '../../store/useExerciseLogStore';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

export function ExerciseTooltipContent({
  exercise,
  bonusXP,
  laggingType,
  userProfile,
}) {
  const [gifError, setGifError] = useState(false);
  const { logs: workoutLog } = useExerciseLogStore();
  if (!exercise) return null;

  // Debug logging
  const logs = useMemo(
    () =>
      workoutLog.filter((l) => String(l.exerciseId) === String(exercise.id)),
    [workoutLog, exercise.id]
  );
  const hasLogs = logs.length > 0;
  const lastTrainedTimestamp = getLastTrainedDate(workoutLog, exercise.id);
  const lastTrainedDate = lastTrainedTimestamp
    ? lastTrainedTimestamp.seconds
      ? new Date(lastTrainedTimestamp.seconds * 1000)
      : new Date(lastTrainedTimestamp)
    : null;
  console.log('[ExerciseTooltipContent]', {
    workoutLog,
    logs,
    lastTrainedDate,
    laggingType,
    hasLogs,
  });

  // Find the most recent log (by timestamp)
  const lastLog = hasLogs
    ? logs.reduce((latest, l) => {
        if (!latest) return l;
        const latestTime = latest.timestamp?.seconds
          ? latest.timestamp.seconds
          : new Date(latest.timestamp).getTime() / 1000;
        const lTime = l.timestamp?.seconds
          ? l.timestamp.seconds
          : new Date(l.timestamp).getTime() / 1000;
        return lTime > latestTime ? l : latest;
      }, null)
    : null;

  // Best duration (cardio)
  const bestDuration = logs.reduce(
    (max, l) => (l.duration && (!max || l.duration > max.duration) ? l : max),
    null
  );
  // Best 1RM (strength)
  const best1RM = logs.reduce(
    (max, l) =>
      l.oneRepMax && (!max || l.oneRepMax > max.oneRepMax) ? l : max,
    null
  );

  // Format time ago
  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0)
      return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
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
  let lastLoggedCardio = null,
    bestCardio = null;
  if (exercise.category && exercise.category.toLowerCase() === 'cardio') {
    if (lastLog && lastLog.duration) {
      lastLoggedCardio = `${lastLog.duration} minutes ${formatAgo(lastLog.timestamp)}`;
    }
    if (bestDuration) {
      bestCardio = `${bestDuration.duration} minutes ${formatAgo(bestDuration.timestamp)}`;
    }
  }
  // Strength: Last Logged & Best 1RM
  let lastLoggedStrength = null,
    bestStrength = null;
  if (!exercise.category || exercise.category.toLowerCase() !== 'cardio') {
    if (lastLog && lastLog.sets && lastLog.sets.length > 0) {
      const s = lastLog.sets[lastLog.sets.length - 1];
      lastLoggedStrength = `${s.weight} lbs x ${s.reps} reps ${formatAgo(lastLog.timestamp)}`;
    }
    if (best1RM) {
      bestStrength = `1RM: ${Math.round(best1RM.oneRepMax)} lbs (${best1RM.weight} x ${best1RM.reps}) ${formatAgo(best1RM.timestamp)}`;
    }
  }

  // Find the most recent log for any exercise
  const lastWorkoutLog =
    workoutLog.length > 0
      ? workoutLog.reduce((latest, l) => {
          const lTime = l.timestamp?.seconds
            ? l.timestamp.seconds
            : new Date(l.timestamp).getTime() / 1000;
          if (!latest) return l;
          const latestTime = latest.timestamp?.seconds
            ? latest.timestamp.seconds
            : new Date(latest.timestamp).getTime() / 1000;
          return lTime > latestTime ? l : latest;
        }, null)
      : null;
  const lastWorkoutDate = lastWorkoutLog
    ? lastWorkoutLog.timestamp?.seconds
      ? new Date(lastWorkoutLog.timestamp.seconds * 1000)
      : new Date(lastWorkoutLog.timestamp)
    : null;

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
        {lastLoggedCardio && (
          <div className="text-xs text-blue-700 font-medium">
            Last Logged: {lastLoggedCardio}
          </div>
        )}
        {bestCardio && (
          <div className="text-xs text-purple-700 font-medium">
            Best Duration: {bestCardio}
          </div>
        )}
        {lastLoggedStrength && (
          <div className="text-xs text-blue-700 font-medium">
            Last Logged: {lastLoggedStrength}
          </div>
        )}
        {bestStrength && (
          <div className="text-xs text-purple-700 font-medium">
            {bestStrength}
          </div>
        )}
      </div>
      {exercise.instructions &&
        Array.isArray(exercise.instructions) &&
        exercise.instructions.length > 0 && (
          <div className="mb-3">
            <div className="font-medium text-sm mb-1 text-green-600">
              Instructions:
            </div>
            <ol className="text-sm text-gray-700 space-y-1">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="leading-relaxed">
                  {index + 1}. {instruction}
                </li>
              ))}
            </ol>
          </div>
        )}
      {/* Show full personal bests object */}
      {bests && (
        <div className="mb-2">
          <div className="font-medium text-sm text-purple-700">
            Personal Best:
          </div>
          {bests.allTime && (
            <div className="text-xs text-gray-700 mb-1">
              <strong>All Time:</strong>{' '}
              {bests.allTime.value !== undefined
                ? Number(bests.allTime.value).toFixed(1)
                : ''}{' '}
              {bests.allTime.unit} ({bests.allTime.type}) on{' '}
              {bests.allTime.date
                ? bests.allTime.date.seconds
                  ? new Date(
                      bests.allTime.date.seconds * 1000
                    ).toLocaleDateString()
                  : new Date(bests.allTime.date).toLocaleDateString()
                : ''}
            </div>
          )}
          {bests.current && (
            <div className="text-xs text-gray-700 mb-1">
              <strong>Current:</strong>{' '}
              {bests.current.value !== undefined
                ? Number(bests.current.value).toFixed(1)
                : ''}{' '}
              {bests.current.unit} ({bests.current.type}) on{' '}
              {bests.current.date
                ? bests.current.date.seconds
                  ? new Date(
                      bests.current.date.seconds * 1000
                    ).toLocaleDateString()
                  : new Date(bests.current.date).toLocaleDateString()
                : ''}
            </div>
          )}
          {bests.quarter && (
            <div className="text-xs text-gray-700 mb-1">
              <strong>Quarter:</strong>{' '}
              {bests.quarter.value !== undefined
                ? Number(bests.quarter.value).toFixed(1)
                : ''}{' '}
              {bests.quarter.unit} ({bests.quarter.type}) on{' '}
              {bests.quarter.date
                ? bests.quarter.date.seconds
                  ? new Date(
                      bests.quarter.date.seconds * 1000
                    ).toLocaleDateString()
                  : new Date(bests.quarter.date).toLocaleDateString()
                : ''}
            </div>
          )}
          {bests.year && (
            <div className="text-xs text-gray-700 mb-1">
              <strong>Year:</strong>{' '}
              {bests.year.value !== undefined
                ? Number(bests.year.value).toFixed(1)
                : ''}{' '}
              {bests.year.unit} ({bests.year.type}) on{' '}
              {bests.year.date
                ? bests.year.date.seconds
                  ? new Date(
                      bests.year.date.seconds * 1000
                    ).toLocaleDateString()
                  : new Date(bests.year.date).toLocaleDateString()
                : ''}
            </div>
          )}
        </div>
      )}
      {/* Show full last log object */}
      {lastLog && (
        <div className="mb-2">
          <div className="font-medium text-sm text-blue-700">
            Last Worked (raw):
          </div>
          <pre className="text-xs bg-gray-100 rounded p-2 border">
            {JSON.stringify(lastLog, null, 2)}
          </pre>
        </div>
      )}
      {exercise.laggingMessage && (
        <div className="mb-2 text-sm text-purple-700">
          {exercise.laggingMessage}
        </div>
      )}
      {/* XP and Lagging Type */}
      {(bonusXP !== undefined ||
        (laggingType && laggingType !== 'neverTrained')) && (
        <div className="mb-2 flex items-center gap-3">
          {bonusXP !== undefined && (
            <span className="flex items-center text-green-700 font-semibold text-sm">
              <span className="mr-1">⚡</span>+{bonusXP} XP
            </span>
          )}
          {laggingType && laggingType !== 'neverTrained' && (
            <span className="flex items-center text-red-600 font-semibold text-sm">
              <span className="mr-1">🌀</span>
              {laggingType.replace(/([A-Z])/g, ' $1')}
            </span>
          )}
        </div>
      )}
      {/* Only show Never Trained if truly never trained and not already shown by laggingType */}
      {!hasLogs && statusText && laggingType !== 'neverTrained' && (
        <div className="flex items-center text-red-600 font-semibold text-sm mb-1">
          <span className="mr-1">🌀</span>
          {statusText}
        </div>
      )}
      {hasLogs && lastTrainedDate && (
        <div className="text-xs text-gray-700 mb-1">
          <strong>Last Trained:</strong> {formatSmartDate(lastTrainedDate)} at{' '}
          {lastTrainedDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
      {hasLogs && lastLog && (
        <div className="text-xs text-gray-700 mb-1">
          <strong>Last Logged:</strong>{' '}
          {lastLog.duration
            ? `${lastLog.duration} minutes`
            : lastLog.sets && lastLog.sets[0]
              ? `${lastLog.sets[0].weight} lbs x ${lastLog.sets[0].reps} reps`
              : ''}{' '}
          {timeAgo(lastLog.timestamp)}
        </div>
      )}
      {bestDuration && bestDuration.duration && (
        <div className="text-xs text-gray-700 mb-1">
          <strong>Best Duration:</strong> {bestDuration.duration} minutes{' '}
          {timeAgo(bestDuration.timestamp)}
        </div>
      )}
      {best1RM && best1RM.oneRepMax && (
        <div className="text-xs text-gray-700 mb-1">
          <strong>1RM:</strong> {best1RM.oneRepMax} lbs{' '}
          {timeAgo(best1RM.timestamp)}
        </div>
      )}
      {/* Show last workout date for any exercise */}
      {lastWorkoutDate && (
        <div className="text-xs text-gray-700 mb-1">
          <strong>Last Workout:</strong> {formatSmartDate(lastWorkoutDate)} at{' '}
          {lastWorkoutDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
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

export default function ExerciseTooltip({
  exercise,
  children,
  bonusXP,
  laggingType,
  userProfile,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  if (!exercise) return children;

  if (isMobile) {
    return (
      <>
        <span
          onClick={() => setOpen(true)}
          style={{ display: 'inline-block', width: '100%' }}
        >
          {children}
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xs w-full p-0 bg-white rounded-lg shadow-lg">
            <DialogTitle className="sr-only">
              {exercise?.name || 'Exercise Details'}
            </DialogTitle>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 z-10 bg-gray-100 rounded-full p-1 hover:bg-gray-200"
              aria-label="Close"
              type="button"
            >
              ×
            </button>
            <div className="p-4 pt-6">
              <ExerciseTooltipContent
                exercise={exercise}
                bonusXP={bonusXP}
                laggingType={laggingType}
                userProfile={userProfile}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: Tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom">
          <ExerciseTooltipContent
            exercise={exercise}
            bonusXP={bonusXP}
            laggingType={laggingType}
            userProfile={userProfile}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
