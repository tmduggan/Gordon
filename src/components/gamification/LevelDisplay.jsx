import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Flame, Calendar, TrendingUp } from 'lucide-react';
import { calculateLevelFromXP, calculateStreakBonuses, getLevelInfo } from '../../services/gamification/levelService';
import LevelTooltip from './LevelTooltip';

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
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center">
            <LevelTooltip
              levelInfo={levelInfo}
              streakInfo={streakInfo}
              levelDisplay={levelDisplay}
              totalXP={totalXP}
              userProfile={userProfile}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 