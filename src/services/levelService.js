// Level-up system for Goliath
// Implements a hybrid approach with time-based decay to encourage long-term engagement

const LEVEL_CONFIG = {
  // Base XP required for level 1 (starting point)
  baseXP: 1000,
  
  // Scaling factor for each level (exponential growth)
  scalingFactor: 1.15,
  
  // Time decay settings (XP requirements increase over time)
  timeDecay: {
    // Days since account creation when decay starts
    decayStartDays: 30,
    // Maximum multiplier for time decay (2x = double XP requirements)
    maxDecayMultiplier: 2.0,
    // How quickly decay increases (per day after decay starts)
    decayRate: 0.01, // 1% increase per day
  },
  
  // Bonus XP for streaks and consistency
  streakBonuses: {
    // Daily workout streak bonuses
    dailyStreak: {
      7: 50,    // 7-day streak: +50 XP
      14: 100,  // 14-day streak: +100 XP
      30: 200,  // 30-day streak: +200 XP
      60: 500,  // 60-day streak: +500 XP
      90: 1000, // 90-day streak: +1000 XP
    },
    // Weekly workout streak bonuses
    weeklyStreak: {
      4: 100,   // 4-week streak: +100 XP
      8: 250,   // 8-week streak: +250 XP
      12: 500,  // 12-week streak: +500 XP
    }
  },
  
  // Level titles/achievements
  levelTitles: {
    1: "Novice Lifter",
    5: "Dedicated Trainee",
    10: "Fitness Enthusiast",
    15: "Strength Seeker",
    20: "Muscle Builder",
    25: "Power Lifter",
    30: "Elite Athlete",
    35: "Fitness Master",
    40: "Strength Legend",
    50: "Goliath Champion",
    75: "Titan of Fitness",
    100: "Immortal Warrior"
  }
};

/**
 * Calculate XP required for a specific level
 * @param {number} level - The target level
 * @param {Date} accountCreationDate - When the user's account was created
 * @returns {number} XP required for that level
 */
export function calculateXPForLevel(level, accountCreationDate = new Date()) {
  if (level <= 1) return 0;
  
  // Base XP calculation using exponential growth
  const baseXP = LEVEL_CONFIG.baseXP * Math.pow(LEVEL_CONFIG.scalingFactor, level - 1);
  
  // Apply time decay if applicable
  const daysSinceCreation = Math.floor((new Date() - accountCreationDate) / (1000 * 60 * 60 * 24));
  const decayMultiplier = calculateTimeDecayMultiplier(daysSinceCreation);
  
  return Math.round(baseXP * decayMultiplier);
}

/**
 * Calculate time decay multiplier based on account age
 * @param {number} daysSinceCreation - Days since account creation
 * @returns {number} Multiplier for XP requirements
 */
function calculateTimeDecayMultiplier(daysSinceCreation) {
  if (daysSinceCreation < LEVEL_CONFIG.timeDecay.decayStartDays) {
    return 1.0; // No decay for new accounts
  }
  
  const decayDays = daysSinceCreation - LEVEL_CONFIG.timeDecay.decayStartDays;
  const decayAmount = decayDays * LEVEL_CONFIG.timeDecay.decayRate;
  
  return Math.min(
    1.0 + decayAmount,
    LEVEL_CONFIG.timeDecay.maxDecayMultiplier
  );
}

/**
 * Calculate current level and progress from total XP
 * @param {number} totalXP - User's total accumulated XP
 * @param {Date} accountCreationDate - When the user's account was created
 * @returns {object} { level, currentLevelXP, nextLevelXP, progress, xpToNext }
 */
export function calculateLevelFromXP(totalXP, accountCreationDate = new Date()) {
  let level = 1;
  let currentLevelXP = 0;
  
  // Find current level
  while (true) {
    const nextLevelXP = calculateXPForLevel(level + 1, accountCreationDate);
    if (totalXP < nextLevelXP) {
      break;
    }
    level++;
  }
  
  // Calculate progress within current level
  const levelStartXP = calculateXPForLevel(level, accountCreationDate);
  const nextLevelXP = calculateXPForLevel(level + 1, accountCreationDate);
  const xpInCurrentLevel = totalXP - levelStartXP;
  const xpNeededForLevel = nextLevelXP - levelStartXP;
  const progress = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0;
  const xpToNext = nextLevelXP - totalXP;
  
  return {
    level,
    currentLevelXP: levelStartXP,
    nextLevelXP,
    progress: Math.round(progress * 100) / 100,
    xpToNext,
    levelTitle: LEVEL_CONFIG.levelTitles[level] || `Level ${level}`
  };
}

/**
 * Calculate streak bonuses for daily and weekly consistency
 * @param {Array} workoutLogs - Array of workout logs with timestamps
 * @returns {object} { dailyStreak, weeklyStreak, dailyBonus, weeklyBonus }
 */
export function calculateStreakBonuses(workoutLogs) {
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
    const hasWorkoutToday = workoutLogs.some(log => {
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
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
    
    const hasWorkoutThisWeek = workoutLogs.some(log => {
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
  
  // Find highest applicable daily streak bonus
  const dailyStreakKeys = Object.keys(LEVEL_CONFIG.streakBonuses.dailyStreak)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending
    
  for (const streak of dailyStreakKeys) {
    if (dailyStreak >= streak) {
      dailyBonus = LEVEL_CONFIG.streakBonuses.dailyStreak[streak];
      break;
    }
  }
  
  // Find highest applicable weekly streak bonus
  const weeklyStreakKeys = Object.keys(LEVEL_CONFIG.streakBonuses.weeklyStreak)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending
    
  for (const streak of weeklyStreakKeys) {
    if (weeklyStreak >= streak) {
      weeklyBonus = LEVEL_CONFIG.streakBonuses.weeklyStreak[streak];
      break;
    }
  }
  
  return { dailyStreak, weeklyStreak, dailyBonus, weeklyBonus };
}

/**
 * Get level information for display
 * @param {number} level - Current level
 * @returns {object} Level display information
 */
export function getLevelInfo(level) {
  return {
    title: LEVEL_CONFIG.levelTitles[level] || `Level ${level}`,
    isMilestone: Object.keys(LEVEL_CONFIG.levelTitles).includes(level.toString()),
    nextMilestone: getNextMilestone(level)
  };
}

/**
 * Get the next milestone level
 * @param {number} currentLevel - Current level
 * @returns {number|null} Next milestone level or null if none
 */
function getNextMilestone(currentLevel) {
  const milestones = Object.keys(LEVEL_CONFIG.levelTitles).map(Number).sort((a, b) => a - b);
  const nextMilestone = milestones.find(milestone => milestone > currentLevel);
  return nextMilestone || null;
}

/**
 * Calculate total XP needed for a specific level (cumulative)
 * @param {number} level - Target level
 * @param {Date} accountCreationDate - Account creation date
 * @returns {number} Total XP needed from level 1 to target level
 */
export function calculateTotalXPForLevel(level, accountCreationDate = new Date()) {
  let totalXP = 0;
  for (let i = 1; i <= level; i++) {
    totalXP += calculateXPForLevel(i, accountCreationDate);
  }
  return totalXP;
} 