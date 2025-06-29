import React from 'react';
import { Trophy, Flame, Calendar, TrendingUp } from 'lucide-react';
import { getLevelInfo } from '../../services/gamification/levelService';

// Helper to convert string to title case
function toTitleCase(str) {
  return (str || '').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Helper to format relative date
function formatRelativeDate(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return 'A week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return 'A month ago';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return 'Over a year ago';
}

export default function LevelTooltip({ levelInfo, streakInfo, levelDisplay, totalXP, userProfile, workoutLogs = [], repProgress, cardioProgress }) {
  // Determine if user is capped (basic and at or above level 5)
  const isBasicCapped = (userProfile) => {
    if (!userProfile) return false;
    const status = userProfile.subscription?.status;
    if (status !== 'basic') return false;
    const level = levelInfo.level;
    return level >= 5;
  };

  // Get last 3 strength and last 3 cardio exercises
  const strengthLogs = workoutLogs.filter(log => String(log.category).toLowerCase() !== 'cardio');
  const cardioLogs = workoutLogs.filter(log => String(log.category).toLowerCase() === 'cardio' || (log.duration && (!log.sets || log.sets.length === 0)));
  const last3Strength = strengthLogs.slice(-3).reverse();
  const last3Cardio = cardioLogs.slice(-3).reverse();

  return (
    <div className="w-64 p-2">
      <div className="font-bold text-lg mb-1 flex items-center gap-2">
        {levelDisplay.isMilestone && <Trophy className="w-5 h-5 text-yellow-600" />}
        {getLevelInfo(levelInfo.level).title}
      </div>
      <div className="text-sm text-gray-700 mb-2">
        {isBasicCapped(userProfile) ? (
          <span className="text-red-600 font-semibold">XP capped at Level 5. Upgrade to continue leveling up!</span>
        ) : levelInfo.xpToNext > 0 ? (
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
      {/* --- Tier Progress Below Next Milestone --- */}
      {repProgress && cardioProgress && (
        <div className="flex flex-col gap-1 mt-2 mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-600">Strength Tier Progress: </span>
            <span className="font-medium text-blue-600 text-xs">
              Completed: {repProgress.prestigeIndex > 0 ? 'Base, ' + Array.from({length: repProgress.prestigeIndex - 1}, (_, i) => String.fromCharCode(945 + i)).join(', ') : 'Base'} | Current: <b>{repProgress.displayTier}</b> | Progress: {Math.round(repProgress.progress)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-600">Cardio Tier Progress: </span>
            <span className="font-medium text-green-600 text-xs">
              Completed: {cardioProgress.prestigeIndex > 0 ? 'Base, ' + Array.from({length: cardioProgress.prestigeIndex - 1}, (_, i) => String.fromCharCode(945 + i)).join(', ') : 'Base'} | Current: <b>{cardioProgress.displayTier}</b> | Progress: {Math.round(cardioProgress.progress)}%
            </span>
          </div>
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500">Total XP: <b>{totalXP.toLocaleString()}</b></div>
      {/* Last 3 Strength Exercises */}
      <div className="mt-3">
        <div className="font-semibold text-xs text-gray-700 mb-1">Last 3 Strength Exercises</div>
        {last3Strength.length === 0 ? (
          <div className="text-xs text-gray-400">None logged yet</div>
        ) : (
          <ul className="text-xs text-gray-700 list-disc pl-4">
            {last3Strength.map((log, idx) => (
              <li key={idx}>
                {toTitleCase(log.name || log.exerciseName || log.exerciseId)} <span className="text-gray-400">({formatRelativeDate(log.timestamp)})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Last 3 Cardio Exercises */}
      <div className="mt-2">
        <div className="font-semibold text-xs text-gray-700 mb-1">Last 3 Cardio Exercises</div>
        {last3Cardio.length === 0 ? (
          <div className="text-xs text-gray-400">None logged yet</div>
        ) : (
          <ul className="text-xs text-gray-700 list-disc pl-4">
            {last3Cardio.map((log, idx) => (
              <li key={idx}>
                {toTitleCase(log.name || log.exerciseName || log.exerciseId)}
                {log.duration ? ` - ${parseInt(log.duration)} min` : ''}
                <span className="text-gray-400"> ({formatRelativeDate(log.timestamp)})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 