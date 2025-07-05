import AnimatedProgressBar from '@/components/ui/AnimatedProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip as ShadTooltip,
  TooltipContent as ShadTooltipContent,
  TooltipProvider as ShadTooltipProvider,
  TooltipTrigger as ShadTooltipTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, Flame, TrendingUp, Trophy } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  calculateLevelFromXP,
  calculateStreakBonuses,
  getLevelInfo,
} from '../../services/gamification/levelService';
import useExerciseLogStore from '../../store/useExerciseLogStore';
import {
  CARDIO_MIN_MILESTONES,
  getMilestoneProgress,
  getPrestigeMilestoneProgress,
  getWeeklyCardioMinutes,
  getWeeklyStrengthReps,
  STRENGTH_REP_MILESTONES,
} from '../../utils/dataUtils';
import LevelTooltip from './LevelTooltip';

// Helper for tier tooltip content
function TierTooltip({ repProgress, cardioProgress }) {
  // Helper to build tier progress string
  const buildTierString = (progress, label) => {
    let completed = [];
    if (progress.prestigeIndex > 0) {
      completed.push('Base');
      for (let i = 0; i < progress.prestigeIndex - 1; i++) {
        completed.push(String.fromCharCode(945 + i)); // α, β, γ, ...
      }
    }
    return (
      <div className="flex flex-col gap-1 mt-2">
        <div className="font-semibold text-xs text-gray-700 mb-1">
          {label} Tier Progress
        </div>
        <div className="text-xs text-gray-600">
          Completed: {completed.length > 0 ? completed.join(', ') : 'Base'}
          <br />
          Current: <b>{progress.displayTier}</b>
          <br />
          Progress to next: {Math.round(progress.progress)}%
        </div>
      </div>
    );
  };
  return (
    <div className="mt-2">
      {buildTierString(repProgress, 'Strength')}
      {buildTierString(cardioProgress, 'Cardio')}
    </div>
  );
}

export default function LevelDisplay({
  totalXP,
  workoutLogs,
  accountCreationDate,
  className = '',
  userProfile,
}) {
  const levelInfo = calculateLevelFromXP(totalXP, accountCreationDate);
  const streakInfo = calculateStreakBonuses(workoutLogs);
  const levelDisplay = getLevelInfo(levelInfo.level);

  // Determine if user is capped (basic and at or above level 5)
  const isBasicCapped = (userProfile) => {
    if (!userProfile) return false;
    const status = userProfile.subscription?.status;
    if (status !== 'basic') return false;
    const level = levelInfo.level;
    return level >= 5;
  };

  // Get weekly progress from global logs
  const { logs: workoutLogsGlobal } = useExerciseLogStore();
  const logs =
    workoutLogs && workoutLogs.length > 0 ? workoutLogs : workoutLogsGlobal;

  // --- DEBUG OUTPUT FOR STRENGTH REPS ---
  const strengthLogs = logs.filter(
    (l) => Array.isArray(l.sets) && l.sets.length > 0
  );
  const strengthSummary = strengthLogs.map((l) => {
    const name = l.name || l.exerciseName || l.exerciseId;
    const reps = l.sets.reduce((sum, set) => {
      const r = parseInt(set.reps);
      return sum + (isNaN(r) ? 0 : r);
    }, 0);
    return { name, reps };
  });
  const totalStrengthReps = strengthSummary.reduce(
    (sum, s) => sum + (isNaN(s.reps) ? 0 : s.reps),
    0
  );

  // --- DEBUG OUTPUT FOR CARDIO MINUTES ---
  const cardioLogs = logs.filter(
    (l) => l.duration && (!l.sets || l.sets.length === 0)
  );
  const cardioSummary = cardioLogs.map((l) => {
    const name = l.name || l.exerciseName || l.exerciseId;
    const mins = parseInt(l.duration);
    return { name, mins: isNaN(mins) ? 0 : mins };
  });
  const totalCardioMins = cardioSummary.reduce(
    (sum, c) => sum + (isNaN(c.mins) ? 0 : c.mins),
    0
  );

  const weeklyReps = getWeeklyStrengthReps(logs);
  const weeklyCardio = getWeeklyCardioMinutes(logs);
  const repProgress = getPrestigeMilestoneProgress(
    weeklyReps,
    STRENGTH_REP_MILESTONES,
    30
  );
  const cardioProgress = getPrestigeMilestoneProgress(
    weeklyCardio,
    CARDIO_MIN_MILESTONES,
    20
  );

  // Cap and round numbers for display
  const safeInt = (n) => Math.min(999, Math.round(n || 0));
  const displayReps = safeInt(weeklyReps);
  const displayCardio = safeInt(weeklyCardio);
  const displayRepNext = safeInt(repProgress.next);
  const displayCardioNext = safeInt(cardioProgress.next);

  // Cosmetic animation state for progress bars
  const [prevXP, setPrevXP] = useState(levelInfo.progress);
  const [prevStrength, setPrevStrength] = useState(repProgress.progress);
  const [prevCardio, setPrevCardio] = useState(cardioProgress.progress);

  // Animate XP bar when value changes
  useEffect(() => {
    if (levelInfo.progress !== prevXP) {
      setPrevXP((prev) => prev); // keep old value for animation
      const timeout = setTimeout(() => setPrevXP(levelInfo.progress), 1600); // 1s anim + buffer
      return () => clearTimeout(timeout);
    }
  }, [levelInfo.progress]);

  // Animate Strength bar when value changes
  useEffect(() => {
    if (repProgress.progress !== prevStrength) {
      setPrevStrength((prev) => prev);
      const timeout = setTimeout(
        () => setPrevStrength(repProgress.progress),
        1600
      );
      return () => clearTimeout(timeout);
    }
  }, [repProgress.progress]);

  // Animate Cardio bar when value changes
  useEffect(() => {
    if (cardioProgress.progress !== prevCardio) {
      setPrevCardio((prev) => prev);
      const timeout = setTimeout(
        () => setPrevCardio(cardioProgress.progress),
        1600
      );
      return () => clearTimeout(timeout);
    }
  }, [cardioProgress.progress]);

  return (
    <div
      className={`w-full bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center justify-center ${className}`}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col w-full items-center cursor-pointer">
              <div className="flex items-center w-full mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow mr-4">
                  {levelInfo.level}
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center w-full">
                    <span className="font-semibold text-xl">
                      Level {levelInfo.level}
                    </span>
                    <span className="flex-grow" />
                    <span className="text-green-600 font-bold text-2xl text-right">
                      {totalXP.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    {isBasicCapped(userProfile) ? (
                      <span className="text-red-600 font-semibold">
                        XP capped at Level 5. Upgrade to continue leveling up!
                      </span>
                    ) : (
                      <span>
                        {levelInfo.xpToNext > 0
                          ? `${levelInfo.xpToNext} XP to next level`
                          : 'Max level reached!'}
                      </span>
                    )}
                    <span>{levelInfo.progress}%</span>
                  </div>
                </div>
              </div>
              <AnimatedProgressBar
                value={levelInfo.progress}
                previousValue={prevXP}
                className="h-3 w-full"
              />
              {/* Weekly Progress Bars */}
              <div className="w-full mt-4 flex flex-col gap-2">
                {/* Strength Progress Bar with Tooltip */}
                <ShadTooltipProvider>
                  <ShadTooltip>
                    <ShadTooltipTrigger asChild>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Strength Reps This Week</span>
                          <span>
                            Tier {repProgress.displayTier}: {displayReps} /{' '}
                            {displayRepNext} reps
                          </span>
                        </div>
                        <AnimatedProgressBar
                          value={repProgress.progress}
                          previousValue={prevStrength}
                          className="h-2 w-full bg-gray-200"
                        />
                      </div>
                    </ShadTooltipTrigger>
                    <ShadTooltipContent side="top" align="center">
                      <LevelTooltip
                        levelInfo={levelInfo}
                        streakInfo={streakInfo}
                        levelDisplay={levelDisplay}
                        totalXP={totalXP}
                        userProfile={userProfile}
                        workoutLogs={workoutLogs}
                        repProgress={repProgress}
                        cardioProgress={cardioProgress}
                      />
                    </ShadTooltipContent>
                  </ShadTooltip>
                </ShadTooltipProvider>
                {/* Cardio Progress Bar with Tooltip */}
                <ShadTooltipProvider>
                  <ShadTooltip>
                    <ShadTooltipTrigger asChild>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Cardio Minutes This Week</span>
                          <span>
                            Tier {cardioProgress.displayTier}: {displayCardio} /{' '}
                            {displayCardioNext} min
                          </span>
                        </div>
                        <AnimatedProgressBar
                          value={cardioProgress.progress}
                          previousValue={prevCardio}
                          className="h-2 w-full bg-gray-200"
                        />
                      </div>
                    </ShadTooltipTrigger>
                    <ShadTooltipContent side="top" align="center">
                      <LevelTooltip
                        levelInfo={levelInfo}
                        streakInfo={streakInfo}
                        levelDisplay={levelDisplay}
                        totalXP={totalXP}
                        userProfile={userProfile}
                        workoutLogs={workoutLogs}
                        repProgress={repProgress}
                        cardioProgress={cardioProgress}
                      />
                    </ShadTooltipContent>
                  </ShadTooltip>
                </ShadTooltipProvider>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center">
            <LevelTooltip
              levelInfo={levelInfo}
              streakInfo={streakInfo}
              levelDisplay={levelDisplay}
              totalXP={totalXP}
              userProfile={userProfile}
              workoutLogs={workoutLogs}
              repProgress={repProgress}
              cardioProgress={cardioProgress}
            />
            {/* --- Tier Structure Tooltip --- */}
            <TierTooltip
              repProgress={repProgress}
              cardioProgress={cardioProgress}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
