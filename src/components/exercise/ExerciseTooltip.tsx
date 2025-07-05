import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getLastTrainedDate } from '@/utils/dataUtils';
import { formatSmartDate } from '@/utils/timeUtils';
import React, { useMemo, useState, ReactNode } from 'react';
import useExerciseLogStore from '../../store/useExerciseLogStore';
import type { Exercise, UserProfile } from '../../types';

function useIsMobile(): boolean {
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

interface ExerciseTooltipContentProps {
  exercise: Exercise;
  bonusXP?: number;
  laggingType?: string;
  userProfile?: UserProfile;
}

export function ExerciseTooltipContent({
  exercise,
  bonusXP,
  laggingType,
  userProfile,
}: ExerciseTooltipContentProps) {
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
      }, null as any)
    : null;

  // Best duration (cardio)
  const bestDuration = logs.reduce(
    (max, l) => (l.duration && (!max || l.duration > max.duration) ? l : max),
    null as any
  );
  // Best 1RM (strength)
  const best1RM = logs.reduce(
    (max, l) =>
      l.oneRepMax && (!max || l.oneRepMax > max.oneRepMax) ? l : max,
    null as any
  );

  // Format time ago
  const timeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
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
  const formatAgo = (date: any) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date.seconds ? date.seconds * 1000 : date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };
  const formatDate = (date: any) => {
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
        }, null as any)
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
          <div className="text-xs text-blue-700">
            Best: {bestCardio}
          </div>
        )}
        {lastLoggedStrength && (
          <div className="text-xs text-green-700 font-medium">
            Last Logged: {lastLoggedStrength}
          </div>
        )}
        {bestStrength && (
          <div className="text-xs text-green-700">
            Best: {bestStrength}
          </div>
        )}
        {statusText && (
          <div className="text-xs text-red-600 font-semibold">
            {statusText}
          </div>
        )}
      </div>
      {/* Personal Bests Section */}
      {bests && (
        <div className="mb-2 text-xs text-gray-700">
          <div>Personal Bests:</div>
          {bests.current && (
            <div>
              <span className="font-semibold">Current:</span> {bests.current.value} {bests.current.unit} ({formatDate(bests.current.date)})
            </div>
          )}
          {bests.allTime && (
            <div>
              <span className="font-semibold">All Time:</span> {bests.allTime.value} {bests.allTime.unit} ({formatDate(bests.allTime.date)})
            </div>
          )}
        </div>
      )}
      {/* Last Workout Date */}
      {lastWorkoutDate && (
        <div className="text-xs text-gray-500">
          Last workout: {formatSmartDate(lastWorkoutDate)}
        </div>
      )}
      {/* Bonus XP */}
      {bonusXP !== undefined && (
        <div className="text-xs text-green-700 font-semibold mt-2">
          +{bonusXP} XP bonus
        </div>
      )}
    </div>
  );
}

interface ExerciseTooltipProps {
  exercise: Exercise;
  children?: ReactNode;
  bonusXP?: number;
  laggingType?: string;
  userProfile?: UserProfile;
}

export default function ExerciseTooltip({
  exercise,
  children,
  bonusXP,
  laggingType,
  userProfile,
}: ExerciseTooltipProps) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-xs">
          <ExerciseTooltipContent
            exercise={exercise}
            bonusXP={bonusXP}
            laggingType={laggingType}
            userProfile={userProfile}
          />
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
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