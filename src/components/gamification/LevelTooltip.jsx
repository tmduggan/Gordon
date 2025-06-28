import React from 'react';
import { Trophy, Flame, Calendar, TrendingUp } from 'lucide-react';
import { getLevelInfo } from '../../services/gamification/levelService';

export default function LevelTooltip({ levelInfo, streakInfo, levelDisplay, totalXP }) {
  return (
    <div className="w-64 p-2">
      <div className="font-bold text-lg mb-1 flex items-center gap-2">
        {levelDisplay.isMilestone && <Trophy className="w-5 h-5 text-yellow-600" />}
        {getLevelInfo(levelInfo.level).title}
      </div>
      <div className="text-sm text-gray-700 mb-2">
        {levelInfo.xpToNext > 0 ? (
          <span>{levelInfo.xpToNext} XP to next level</span>
        ) : (
          <span>Max level reached!</span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Flame className={`w-4 h-4 ${streakInfo.dailyStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
        <span className="text-xs">Daily Streak: <b>{streakInfo.dailyStreak}</b></span>
        {streakInfo.dailyBonus > 0 && (
          <span className="text-xs text-green-600 ml-2">+{streakInfo.dailyBonus} XP bonus</span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className={`w-4 h-4 ${streakInfo.weeklyStreak > 0 ? 'text-blue-500' : 'text-gray-400'}`} />
        <span className="text-xs">Weekly Streak: <b>{streakInfo.weeklyStreak}</b></span>
        {streakInfo.weeklyBonus > 0 && (
          <span className="text-xs text-green-600 ml-2">+{streakInfo.weeklyBonus} XP bonus</span>
        )}
      </div>
      {levelDisplay.nextMilestone && (
        <div className="flex items-center gap-2 mt-2 border-t pt-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-600">Next milestone: </span>
          <span className="font-medium text-purple-600 text-xs">
            Level {levelDisplay.nextMilestone} - {getLevelInfo(levelDisplay.nextMilestone).title}
          </span>
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500">Total XP: <b>{totalXP.toLocaleString()}</b></div>
    </div>
  );
} 