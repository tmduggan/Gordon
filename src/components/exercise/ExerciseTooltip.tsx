import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
import { getEquipmentIcon, getMuscleIcon } from '../../utils/iconMappings';
import { toTitleCase } from '@/utils/dataUtils';
import { Zap, Target } from 'lucide-react';

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
  const isMobile = useIsMobile();
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
    ? (typeof lastTrainedTimestamp === 'object' && 'seconds' in lastTrainedTimestamp)
      ? new Date((lastTrainedTimestamp as any).seconds * 1000)
      : new Date(lastTrainedTimestamp as any)
    : null;

  // Find the most recent log (by timestamp)
  type LogType = typeof logs extends (infer U)[] ? U : never;
  const lastLog = hasLogs
    ? logs.reduce<LogType | null>((latest, l) => {
        if (!latest) return l;
        const latestTime = (latest.timestamp && typeof latest.timestamp === 'object' && 'seconds' in latest.timestamp)
          ? (latest.timestamp as any).seconds
          : new Date(latest.timestamp as any).getTime() / 1000;
        const lTime = (l.timestamp && typeof l.timestamp === 'object' && 'seconds' in l.timestamp)
          ? (l.timestamp as any).seconds
          : new Date(l.timestamp as any).getTime() / 1000;
        return lTime > latestTime ? l : latest;
      }, null)
    : null;

  // Best duration (cardio)
  const bestDuration = logs.reduce<LogType | null>(
    (max, l) => (l.duration && (!max || (max && max.duration === undefined) || l.duration > (max.duration ?? 0)) ? l : max),
    null
  );
  // Best 1RM (strength)
  const best1RM = logs.reduce<LogType | null>(
    (max, l) =>
      (l as any).oneRepMax && (!max || (l as any).oneRepMax > (max as any).oneRepMax) ? l : max,
    null
  );

  // Format time ago
  const timeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp)
      ? new Date((timestamp as any).seconds * 1000)
      : new Date(timestamp as any);
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
    const then = (date && typeof date === 'object' && 'seconds' in date)
      ? new Date((date as any).seconds * 1000)
      : new Date(date as any);
    const now = new Date();
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = (date && typeof date === 'object' && 'seconds' in date)
      ? new Date((date as any).seconds * 1000)
      : new Date(date);
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
    if (best1RM && (best1RM as any).oneRepMax) {
      bestStrength = `1RM: ${Math.round((best1RM as any).oneRepMax)} lbs (${(best1RM as any).weight} x ${(best1RM as any).reps}) ${formatAgo((best1RM as any).timestamp)}`;
    }
  }

  // Find the most recent log for any exercise
  const lastWorkoutLog =
    workoutLog.length > 0
      ? workoutLog.reduce<LogType | null>((latest, l) => {
          const lTime = (l.timestamp && typeof l.timestamp === 'object' && 'seconds' in l.timestamp)
            ? (l.timestamp as any).seconds
            : new Date(l.timestamp as any).getTime() / 1000;
          if (!latest) return l;
          const latestTime = (latest.timestamp && typeof latest.timestamp === 'object' && 'seconds' in latest.timestamp)
            ? (latest.timestamp as any).seconds
            : new Date(latest.timestamp as any).getTime() / 1000;
          return lTime > latestTime ? l : latest;
        }, null)
      : null;
  const lastWorkoutDate = lastWorkoutLog
    ? (lastWorkoutLog.timestamp && typeof lastWorkoutLog.timestamp === 'object' && 'seconds' in lastWorkoutLog.timestamp)
      ? new Date((lastWorkoutLog.timestamp as any).seconds * 1000)
      : new Date(lastWorkoutLog.timestamp as any)
    : null;

  return (
    <div className="max-w-xs">
      {/* GIF at the top */}
      {((isMobile && exercise.gifUrl_360) || (!isMobile && exercise.gifUrl_1080)) && !gifError && (
        <img
          src={`https://us-central1-food-tracker-19c9d.cloudfunctions.net/exerciseGif?exerciseId=${exercise.id}&resolution=${isMobile ? '360' : '1080'}`}
          alt={exercise.name + ' demo'}
          className="w-full h-36 object-contain rounded mb-2 border border-gray-200 bg-gray-50"
          onError={() => setGifError(true)}
        />
      )}
      {/* Fallback if GIF fails */}
      {((isMobile && exercise.gifUrl_360) || (!isMobile && exercise.gifUrl_1080)) && gifError && (
        <div className="w-full h-36 flex items-center justify-center bg-gray-100 text-xs text-gray-500 rounded mb-2 border border-gray-200">
          GIF unavailable
        </div>
      )}
      {/* Exercise Name and Icons */}
      <div className="flex items-center gap-2 mb-2">
        <div className="font-semibold text-base">{toTitleCase(exercise.name)}</div>
        {exercise.target && (
          <img
            src={getMuscleIcon(exercise.target) ?? undefined}
            alt={exercise.target}
            className="h-6 w-6 rounded-md border border-black"
          />
        )}
        {exercise.equipment && (
          <img
            src={getEquipmentIcon(exercise.equipment) ?? undefined}
            alt={exercise.equipment}
            className="h-6 w-6 p-0.5 bg-equipment rounded-md"
          />
        )}
        {/* XP Lightning Icon */}
        {bonusXP !== undefined && (
          <Zap className="h-5 w-5 text-green-600" aria-label="XP Bonus" />
        )}
        {/* Never Trained Target Icon */}
        {statusText === 'Never Trained' && (
          <Target className="h-5 w-5 text-red-600" aria-label="Never Trained" />
        )}
      </div>
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
          {(bests.current && (typeof bests.current.value === 'string' || typeof bests.current.value === 'number') && (typeof bests.current.unit === 'string' || typeof bests.current.unit === 'number')) && (
            <div>
              <span className="font-semibold">Current:</span> {String(bests.current.value)} {typeof bests.current.unit === 'string' || typeof bests.current.unit === 'number' ? String(bests.current.unit) : ''} {bests.current.date ? `(${formatDate(bests.current.date)})` : ''}
            </div>
          )}
          {(bests.allTime && (typeof bests.allTime.value === 'string' || typeof bests.allTime.value === 'number') && (typeof bests.allTime.unit === 'string' || typeof bests.allTime.unit === 'number')) && (
            <div>
              <span className="font-semibold">All Time:</span> {String(bests.allTime.value)} {typeof bests.allTime.unit === 'string' || typeof bests.allTime.unit === 'number' ? String(bests.allTime.unit) : ''} {bests.allTime.date ? `(${formatDate(bests.allTime.date)})` : ''}
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
          <DialogTitle>{toTitleCase(exercise.name)}</DialogTitle>
          {exercise.description && (
            <DialogDescription>{exercise.description}</DialogDescription>
          )}
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