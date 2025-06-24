import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Flame, Calendar, TrendingUp } from 'lucide-react';
import { calculateLevelFromXP, calculateStreakBonuses, getLevelInfo } from '../services/levelService';

export default function LevelDisplay({ totalXP, workoutLogs, accountCreationDate, className = "" }) {
  const levelInfo = calculateLevelFromXP(totalXP, accountCreationDate);
  const streakInfo = calculateStreakBonuses(workoutLogs);
  const levelDisplay = getLevelInfo(levelInfo.level);
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Level and Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {levelInfo.level}
                </div>
                {levelDisplay.isMilestone && (
                  <Trophy className="absolute -top-1 -right-1 w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div>
                <div className="font-bold text-lg">{levelDisplay.title}</div>
                <div className="text-sm text-gray-500">
                  {levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} XP to next level` : 'Max level reached!'}
                </div>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-right cursor-help">
                    <div className="text-2xl font-bold text-green-600">{totalXP.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total XP</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <div className="font-semibold">XP Breakdown:</div>
                    <div className="text-xs">
                      <div>Current Level: {levelInfo.level}</div>
                      <div>Progress: {levelInfo.progress}%</div>
                      <div>XP in Level: {(totalXP - levelInfo.currentLevelXP).toLocaleString()}</div>
                      {levelInfo.xpToNext > 0 && (
                        <div>XP to Next: {levelInfo.xpToNext.toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Progress Bar */}
          {levelInfo.xpToNext > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {levelInfo.level + 1}</span>
                <span>{levelInfo.progress}%</span>
              </div>
              <Progress value={levelInfo.progress} className="h-2" />
            </div>
          )}
          
          {/* Streak Information */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${streakInfo.dailyStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              <div>
                <div className="text-sm font-medium">
                  {streakInfo.dailyStreak} Day{streakInfo.dailyStreak !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">Daily Streak</div>
                {streakInfo.dailyBonus > 0 && (
                  <div className="text-xs text-green-600">+{streakInfo.dailyBonus} XP bonus</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${streakInfo.weeklyStreak > 0 ? 'text-blue-500' : 'text-gray-400'}`} />
              <div>
                <div className="text-sm font-medium">
                  {streakInfo.weeklyStreak} Week{streakInfo.weeklyStreak !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">Weekly Streak</div>
                {streakInfo.weeklyBonus > 0 && (
                  <div className="text-xs text-green-600">+{streakInfo.weeklyBonus} XP bonus</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Next Milestone */}
          {levelDisplay.nextMilestone && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <div className="text-sm">
                <span className="text-gray-600">Next milestone: </span>
                <span className="font-medium text-purple-600">
                  Level {levelDisplay.nextMilestone} - {getLevelInfo(levelDisplay.nextMilestone).title}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 