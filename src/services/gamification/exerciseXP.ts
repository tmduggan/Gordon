// Exercise XP, bonus XP, lagging muscle, and suggestion logic

// TODO: Replace with actual types
export type Exercise = any;
export type UserProfile = any;

export const EXERCISE_XP_CONFIG = {
  baseMultiplier: 2,
  laggingMuscleBonuses: {
    neverTrained: 100,
    underTrained: 50,
    neglected: 25,
  },
  // ...other config
} as const;

/**
 * Calculate XP for an exercise
 */
export function calculateExerciseXP(workoutData: any, exercise: Exercise, userProfile: UserProfile, laggingMuscles: any[] = []): number {
  let totalXP = 0;
  // Base XP from calories burned (simplified: reps * 0.5 * baseMultiplier)
  const totalReps = workoutData.sets?.reduce((sum: number, set: any) => sum + (parseInt(set.reps) || 0), 0) || 0;
  const estimatedCalories = totalReps * 0.5;
  totalXP += Math.round(estimatedCalories * EXERCISE_XP_CONFIG.baseMultiplier);
  // Personal best bonus
  totalXP += calculatePersonalBestBonus(workoutData, exercise, userProfile);
  // Lagging muscle bonus
  totalXP += calculateLaggingMuscleBonus(workoutData, exercise, laggingMuscles);
  return totalXP;
}

/**
 * Calculate a simple personal best bonus for muscle volume
 */
export function calculatePersonalBestBonus(workoutData: any, exercise: Exercise, userProfile: UserProfile): number {
  if (!userProfile?.personalBests || !workoutData.sets || workoutData.sets.length === 0) return 0;
  const bestSet = workoutData.sets.reduce((best: any, set: any) => (parseInt(set.reps) > parseInt(best.reps) ? set : best), workoutData.sets[0]);
  const exerciseId = exercise.id;
  const personalBests = userProfile.personalBests[exerciseId];
  if (!personalBests) return 0;
  const currentReps = parseInt(bestSet.reps) || 0;
  if (personalBests.allTime && currentReps > personalBests.allTime.reps) return 4;
  if (personalBests.year && currentReps > personalBests.year.reps) return 3;
  if (personalBests.month && currentReps > personalBests.month.reps) return 2;
  if (personalBests.week && currentReps > personalBests.week.reps) return 1;
  return 0;
}

/**
 * Calculate lagging muscle bonus for a workout
 */
export function calculateLaggingMuscleBonus(workoutData: any, exercise: Exercise, laggingMuscles: any[]): number {
  if (!laggingMuscles || laggingMuscles.length === 0) return 0;
  const targets = [exercise.target, ...(Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : [exercise.secondaryMuscles])];
  let totalBonus = 0;
  laggingMuscles.forEach((laggingMuscle) => {
    const targetsMuscle = targets.some((target) => target && target.toLowerCase().trim() === laggingMuscle.muscle);
    if (targetsMuscle) {
      totalBonus += laggingMuscle.bonus;
    }
  });
  return totalBonus;
}

/**
 * Suggest an exercise for lowest muscle scores (with randomization)
 */
export function suggestExerciseForLaggingMuscle({ muscleScores, exerciseLibrary, hiddenExercises = [] }: { muscleScores: Record<string, number>; exerciseLibrary: Exercise[]; hiddenExercises?: string[]; }): Exercise | null {
  const minScore = Math.min(...Object.values(muscleScores));
  const laggingMuscles = Object.keys(muscleScores).filter((muscle) => muscleScores[muscle] === minScore);
  const candidates = exerciseLibrary.filter((ex) => ex.primaryMuscles && ex.primaryMuscles.some((m: string) => laggingMuscles.includes(m)) && !hiddenExercises.includes(ex.id));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Get lagging muscle bonus
export function getLaggingMuscleBonus(type: 'neverTrained' | 'underTrained' | 'neglected'): number {
  return EXERCISE_XP_CONFIG.laggingMuscleBonuses[type] || 0;
} 