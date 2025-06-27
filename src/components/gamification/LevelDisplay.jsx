import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Flame, Calendar, TrendingUp } from 'lucide-react';
import { calculateLevelFromXP, calculateStreakBonuses, getLevelInfo } from '../../services/gamification/levelService';
import LevelTooltip from './LevelTooltip';

export default function LevelDisplay({ totalXP, workoutLogs, accountCreationDate, className = "" }) {
  const levelInfo = calculateLevelFromXP(totalXP, accountCreationDate);
  const streakInfo = calculateStreakBonuses(workoutLogs);
  const levelDisplay = getLevelInfo(levelInfo.level);
  
  return (
    <Card className={`w-64 h-20 flex items-center p-3 shadow-lg rounded-xl bg-white ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center w-full h-full cursor-pointer">
              {/* Yellow Circle with Level */}
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow">
                  {levelInfo.level}
                </div>
              </div>
              {/* Right Side: XP and Progress */}
              <div className="flex flex-col flex-grow justify-center">
                <div className="flex items-center mb-1 w-full">
                  <span className="font-semibold text-base">Level {levelInfo.level}</span>
                  <span className="flex-grow" />
                  <span className="text-green-600 font-bold text-lg text-right">{totalXP.toLocaleString()}</span>
                </div>
                <Progress value={levelInfo.progress} className="h-1.5" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} XP to next level` : 'Max level reached!'}</span>
                  <span>{levelInfo.progress}%</span>
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
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>
  );
} 