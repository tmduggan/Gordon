import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Flame, Calendar, TrendingUp } from 'lucide-react';
import { calculateLevelFromXP, calculateStreakBonuses, getLevelInfo } from '../../services/gamification/levelService';
import LevelTooltip from './LevelTooltip';
import {
  getWeeklyStrengthReps,
  getWeeklyCardioMinutes,
  getDynamicMilestoneProgress,
  getRepMilestone,
  getCardioMilestone,
  getPrestigeTierLabel,
  STRENGTH_REP_MILESTONES,
  CARDIO_MIN_MILESTONES
} from '../../utils/dataUtils';
import useExerciseLogStore from '../../store/useExerciseLogStore';

export default function LevelDisplay({ totalXP, workoutLogs, accountCreationDate, className = "", userProfile }) {
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
  const logs = workoutLogs && workoutLogs.length > 0 ? workoutLogs : workoutLogsGlobal;
  const weeklyReps = getWeeklyStrengthReps(logs);
  const weeklyCardio = getWeeklyCardioMinutes(logs);
  const repProgress = getDynamicMilestoneProgress(weeklyReps, getRepMilestone);
  const cardioProgress = getDynamicMilestoneProgress(weeklyCardio, getCardioMilestone);
  const repTierLabel = getPrestigeTierLabel(repProgress.tier);
  const cardioTierLabel = getPrestigeTierLabel(cardioProgress.tier);

  // Cap and round numbers for display
  const safeInt = (n) => Math.min(999, Math.round(n || 0));
  const displayReps = safeInt(weeklyReps);
  const displayCardio = safeInt(weeklyCardio);
  const displayRepNext = safeInt(repProgress.next);
  const displayCardioNext = safeInt(cardioProgress.next);

  return (
    <div className={`w-full bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center justify-center ${className}`}>
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
                    <span className="font-semibold text-xl">Level {levelInfo.level}</span>
                    <span className="flex-grow" />
                    <span className="text-green-600 font-bold text-2xl text-right">{totalXP.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    {isBasicCapped(userProfile) ? (
                      <span className="text-red-600 font-semibold">XP capped at Level 5. Upgrade to continue leveling up!</span>
                    ) : (
                      <span>{levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} XP to next level` : 'Max level reached!'}</span>
                    )}
                    <span>{levelInfo.progress}%</span>
                  </div>
                </div>
              </div>
              <Progress value={levelInfo.progress} className="h-3 w-full" />
              {/* Weekly Progress Bars */}
              <div className="w-full mt-4 flex flex-col gap-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Strength Reps This Week</span>
                    <span>{repTierLabel}: {displayReps} reps</span>
                  </div>
                  <Progress value={repProgress.progress} className="h-2 w-full bg-gray-200" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Cardio Minutes This Week</span>
                    <span>{cardioTierLabel}: {displayCardio} min</span>
                  </div>
                  <Progress value={cardioProgress.progress} className="h-2 w-full bg-gray-200" />
                </div>
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
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 