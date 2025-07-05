// Streak calculation and bonus logic

export const STREAK_CONFIG = {
  dailyStreak: { 7: 50, 14: 100, 30: 200, 60: 500, 90: 1000 },
  weeklyStreak: { 4: 100, 8: 250, 12: 500 },
} as const;

export function calculateStreakBonuses(workoutLogs: any[]): { dailyStreak: number; weeklyStreak: number; dailyBonus: number; weeklyBonus: number } {
  if (!workoutLogs || workoutLogs.length === 0) {
    return { dailyStreak: 0, weeklyStreak: 0, dailyBonus: 0, weeklyBonus: 0 };
  }
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  // Calculate daily streak
  let dailyStreak = 0;
  let currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);
  while (true) {
    const hasWorkoutToday = workoutLogs.some((log) => {
      const logDate = new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp);
      const logDay = new Date(logDate);
      logDay.setHours(0, 0, 0, 0);
      return logDay.getTime() === currentDate.getTime();
    });
    if (!hasWorkoutToday) break;
    dailyStreak++;
    currentDate.setTime(currentDate.getTime() - oneDay);
  }
  // Calculate weekly streak
  let weeklyStreak = 0;
  currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);
  while (true) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const hasWorkoutThisWeek = workoutLogs.some((log) => {
      const logDate = new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    if (!hasWorkoutThisWeek) break;
    weeklyStreak++;
    currentDate.setTime(currentDate.getTime() - oneWeek);
  }
  // Calculate bonuses
  let dailyBonus = 0;
  let weeklyBonus = 0;
  const dailyStreakKeys = Object.keys(STREAK_CONFIG.dailyStreak).map(Number).sort((a, b) => b - a);
  for (const streak of dailyStreakKeys) {
    if (dailyStreak >= streak) {
      dailyBonus = STREAK_CONFIG.dailyStreak[streak];
      break;
    }
  }
  const weeklyStreakKeys = Object.keys(STREAK_CONFIG.weeklyStreak).map(Number).sort((a, b) => b - a);
  for (const streak of weeklyStreakKeys) {
    if (weeklyStreak >= streak) {
      weeklyBonus = STREAK_CONFIG.weeklyStreak[streak];
      break;
    }
  }
  return { dailyStreak, weeklyStreak, dailyBonus, weeklyBonus };
} 