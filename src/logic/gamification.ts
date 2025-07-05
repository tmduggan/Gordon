// Gamification Logic Configuration
// Centralized location for all XP, leveling, and scoring algorithms

import type { 
  Exercise, 
  Food, 
  WorkoutData, 
  NutritionGoals,
  DailyTotals,
  UserProfile 
} from '../types';

// ============================================================================
// EXERCISE XP ALGORITHM
// ============================================================================

export const EXERCISE_XP_CONFIG = {
  // Base XP calculation
  baseMultiplier: 2, // XP = calories * baseMultiplier
  
  // Personal best bonuses
  personalBestBonuses: {
    allTime: 4,    // +4 XP for all-time best
    year: 3,       // +3 XP for year best
    month: 2,      // +2 XP for month best
    week: 1,       // +1 XP for week best
  },
  
  // Lagging muscle bonuses
  laggingMuscleBonuses: {
    neverTrained: 100,  // +100 XP for muscles never trained
    underTrained: 50,   // +50 XP for muscles with low reps
    neglected: 25,      // +25 XP for muscles not trained recently
  },
  
  // Streak bonuses
  streakBonuses: {
    daily: 10,     // +10 XP per day in streak
    weekly: 50,    // +50 XP for 7-day streak
    monthly: 200,  // +200 XP for 30-day streak
  },
  
  // Exercise type multipliers
  exerciseTypeMultipliers: {
    compound: 1.2,     // Compound movements get 20% bonus
    isolation: 1.0,    // Isolation exercises standard
    cardio: 0.8,       // Cardio gets 20% reduction
    bodyweight: 1.1,   // Bodyweight exercises get 10% bonus
  },
  
  // Difficulty multipliers
  difficultyMultipliers: {
    beginner: 0.8,
    intermediate: 1.0,
    advanced: 1.3,
    expert: 1.5,
  }
} as const;

/**
 * Calculate total XP for an exercise
 */
export function calculateExerciseXP(
  workoutData: WorkoutData,
  exercise: Exercise,
  userProfile: UserProfile,
  laggingMuscles: any[] = []
): number {
  let totalXP = 0;
  
  // Base XP from calories burned
  const baseXP = calculateBaseExerciseXP(workoutData, exercise);
  totalXP += baseXP;
  
  // Personal best bonus
  const personalBestBonus = calculatePersonalBestBonus(workoutData, exercise, userProfile);
  totalXP += personalBestBonus;
  
  // Lagging muscle bonus
  const laggingMuscleBonus = calculateLaggingMuscleBonus(exercise, laggingMuscles);
  totalXP += laggingMuscleBonus;
  
  // Exercise type multiplier
  const typeMultiplier = getExerciseTypeMultiplier(exercise);
  totalXP = Math.round(totalXP * typeMultiplier);
  
  // Difficulty multiplier
  const difficultyMultiplier = getDifficultyMultiplier(exercise);
  totalXP = Math.round(totalXP * difficultyMultiplier);
  
  return totalXP;
}

function calculateBaseExerciseXP(workoutData: WorkoutData, exercise: Exercise): number {
  // Calculate calories burned (simplified)
  const totalReps = workoutData.sets?.reduce((sum, set) => sum + (parseInt(set.reps) || 0), 0) || 0;
  const estimatedCalories = totalReps * 0.5; // Rough estimate
  return Math.round(estimatedCalories * EXERCISE_XP_CONFIG.baseMultiplier);
}

function calculatePersonalBestBonus(workoutData: WorkoutData, exercise: Exercise, userProfile: UserProfile): number {
  // Implementation from exerciseScoringService
  return 0; // Placeholder
}

function calculateLaggingMuscleBonus(exercise: Exercise, laggingMuscles: any[]): number {
  // Implementation from suggestionService
  return 0; // Placeholder
}

function getExerciseTypeMultiplier(exercise: Exercise): number {
  const category = exercise.category?.toLowerCase() || '';
  if (category.includes('compound')) return EXERCISE_XP_CONFIG.exerciseTypeMultipliers.compound;
  if (category.includes('cardio')) return EXERCISE_XP_CONFIG.exerciseTypeMultipliers.cardio;
  if (category.includes('bodyweight')) return EXERCISE_XP_CONFIG.exerciseTypeMultipliers.bodyweight;
  return EXERCISE_XP_CONFIG.exerciseTypeMultipliers.isolation;
}

function getDifficultyMultiplier(exercise: Exercise): number {
  const difficulty = exercise.difficulty?.toLowerCase() || 'intermediate';
  return EXERCISE_XP_CONFIG.difficultyMultipliers[difficulty as keyof typeof EXERCISE_XP_CONFIG.difficultyMultipliers] || 1.0;
}

// ============================================================================
// FOOD XP ALGORITHM
// ============================================================================

export const FOOD_XP_CONFIG = {
  // Base XP calculation
  baseMultiplier: 2, // XP = calories * baseMultiplier
  
  // Food group multipliers
  foodGroupMultipliers: {
    3: 1.5, // Fruits - high value
    4: 1.5, // Vegetables - high value
    7: 1.5, // Legumes & Nuts/Seeds - high value
    1: 1.0, // Dairy - standard
    2: 1.0, // Animal products - standard
    5: 1.0, // Grains - standard
    6: 1.0, // Fats & Oils - standard
    8: 1.0, // Prepared/Composite foods - standard
    9: 1.0, // Catch-all/Misc/Spices/Other - standard
    0: 1.0, // Catch-all/Other/Unclassified - standard
  },
  
  // Macro goal bonuses
  macroGoalBonuses: {
    inRange: 50,        // +50 XP for hitting 80-120% of macro goal
    perfect: 50,        // +50 XP for hitting exactly 100%
    allMacros: 500,     // +500 XP for hitting all macros in range
  },
  
  // Micronutrient bonuses
  micronutrientBonuses: {
    perNutrient: 10,    // +10 XP per micronutrient hitting 100% RDA
    multipleBonus: 100, // +100 XP for hitting 5+ micronutrients
  },
  
  // Unique food bonus
  uniqueFoodBonus: 5,   // +5 XP per unique food in a day
} as const;

/**
 * Calculate total XP for a food item
 */
export function calculateFoodXP(
  food: Food,
  serving: number = 1,
  units?: string,
  dailyTotals?: DailyTotals,
  goals?: NutritionGoals
): number {
  let totalXP = 0;
  
  // Base XP from calories
  const baseXP = calculateBaseFoodXP(food, serving, units);
  totalXP += baseXP;
  
  // Food group multiplier
  const foodGroupMultiplier = getFoodGroupMultiplier(food);
  totalXP = Math.round(totalXP * foodGroupMultiplier);
  
  // Macro goal bonus (if daily totals provided)
  if (dailyTotals && goals) {
    const macroBonus = calculateMacroGoalBonus(dailyTotals, goals);
    totalXP += macroBonus;
  }
  
  return totalXP;
}

function calculateBaseFoodXP(food: Food, serving: number, units?: string): number {
  const calories = (food as any).calories || 0;
  return Math.round(calories * FOOD_XP_CONFIG.baseMultiplier);
}

function getFoodGroupMultiplier(food: Food): number {
  const foodGroup = (food as any).tags?.food_group || 0;
  return FOOD_XP_CONFIG.foodGroupMultipliers[foodGroup] || 1.0;
}

function calculateMacroGoalBonus(dailyTotals: DailyTotals, goals: NutritionGoals): number {
  // Implementation from foodScoringService
  return 0; // Placeholder
}

// ============================================================================
// LEVEL PROGRESSION ALGORITHM
// ============================================================================

export const LEVEL_CONFIG = {
  // Base XP required for each level
  baseXPPerLevel: 1000,
  
  // XP scaling factor (each level requires more XP)
  scalingFactor: 1.2,
  
  // Milestone levels (special rewards/features)
  milestones: [5, 10, 20, 30, 50, 100],
  
  // Level titles
  levelTitles: {
    1: 'Beginner',
    5: 'Fitness Enthusiast',
    10: 'Dedicated Athlete',
    20: 'Fitness Warrior',
    30: 'Elite Trainee',
    50: 'Fitness Master',
    100: 'Legendary Athlete',
  },
  
  // Streak bonuses
  streakBonuses: {
    daily: 10,
    weekly: 50,
    monthly: 200,
  },
  
  // Achievement bonuses
  achievementBonuses: {
    firstWorkout: 100,
    firstWeek: 500,
    firstMonth: 1000,
    perfectDay: 200,
    personalBest: 150,
  }
} as const;

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  let xpRequired = LEVEL_CONFIG.baseXPPerLevel;
  let xpRemaining = totalXP;
  
  while (xpRemaining >= xpRequired) {
    xpRemaining -= xpRequired;
    level++;
    xpRequired = Math.round(xpRequired * LEVEL_CONFIG.scalingFactor);
  }
  
  return level;
}

/**
 * Calculate XP required for next level
 */
export function calculateXPForNextLevel(currentLevel: number): number {
  let xpRequired = LEVEL_CONFIG.baseXPPerLevel;
  
  for (let i = 1; i < currentLevel; i++) {
    xpRequired = Math.round(xpRequired * LEVEL_CONFIG.scalingFactor);
  }
  
  return xpRequired;
}

/**
 * Calculate progress to next level
 */
export function calculateLevelProgress(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  xpToNext: number;
} {
  const level = calculateLevel(totalXP);
  const xpForNextLevel = calculateXPForNextLevel(level);
  
  // Calculate XP earned in current level
  let xpInCurrentLevel = totalXP;
  let xpRequired = LEVEL_CONFIG.baseXPPerLevel;
  
  for (let i = 1; i < level; i++) {
    xpInCurrentLevel -= xpRequired;
    xpRequired = Math.round(xpRequired * LEVEL_CONFIG.scalingFactor);
  }
  
  const progress = (xpInCurrentLevel / xpForNextLevel) * 100;
  const xpToNext = xpForNextLevel - xpInCurrentLevel;
  
  return {
    level,
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpForNextLevel,
    progress: Math.min(progress, 100),
    xpToNext: Math.max(xpToNext, 0),
  };
}

/**
 * Get level title
 */
export function getLevelTitle(level: number): string {
  // Find the highest milestone level that the user has reached
  const milestone = LEVEL_CONFIG.milestones
    .filter(m => m <= level)
    .sort((a, b) => b - a)[0];
  
  return LEVEL_CONFIG.levelTitles[milestone] || `Level ${level}`;
}

// ============================================================================
// STREAK CALCULATION
// ============================================================================

export const STREAK_CONFIG = {
  // Streak types
  types: {
    daily: { name: 'Daily', threshold: 1 },
    weekly: { name: 'Weekly', threshold: 7 },
    monthly: { name: 'Monthly', threshold: 30 },
  },
  
  // Streak bonuses
  bonuses: {
    daily: 10,
    weekly: 50,
    monthly: 200,
  }
} as const;

/**
 * Calculate streak bonuses
 */
export function calculateStreakBonus(
  dailyStreak: number,
  weeklyStreak: number,
  monthlyStreak: number
): number {
  let bonus = 0;
  
  if (dailyStreak >= STREAK_CONFIG.types.daily.threshold) {
    bonus += STREAK_CONFIG.bonuses.daily;
  }
  
  if (weeklyStreak >= STREAK_CONFIG.types.weekly.threshold) {
    bonus += STREAK_CONFIG.bonuses.weekly;
  }
  
  if (monthlyStreak >= STREAK_CONFIG.types.monthly.threshold) {
    bonus += STREAK_CONFIG.bonuses.monthly;
  }
  
  return bonus;
} 