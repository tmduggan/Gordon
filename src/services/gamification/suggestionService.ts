// Workout suggestion service for Goliath
// Analyzes user's muscle reps and generates personalized workout recommendations

import { muscleMapping } from '../../utils/muscleMapping';
import { getMuscleRepsForPeriod } from './exerciseScoringService';
import type { 
  Exercise, 
  WorkoutLog, 
  LaggingMuscle, 
  WorkoutSuggestion,
  MuscleReps,
  UserProfile
} from '../../types';

const SUGGESTION_CONFIG = {
  // Bonus XP for working lagging muscle groups
  laggingMuscleBonus: {
    neverTrained: 100, // +100 XP for muscles never trained
    underTrained: 50, // +50 XP for muscles with low reps
    neglected: 25, // +25 XP for muscles not trained recently
  },

  // Thresholds for determining lagging muscles (in reps)
  thresholds: {
    neverTrained: 0, // No reps in this muscle
    underTrained: 100, // Less than 100 reps
    neglected: 500, // Less than 500 reps
  },

  // How many days without training to consider "neglected"
  neglectedDays: 14,

  // Maximum suggestions to show
  maxSuggestions: 3,
} as const;

type LaggingType = 'neverTrained' | 'underTrained' | 'neglected';
type ExerciseCategory = 'bodyweight' | 'gym' | 'cardio';

/**
 * Analyze user's muscle reps to find lagging muscle groups
 */
export function analyzeLaggingMuscles(
  muscleReps: MuscleReps = {},
  workoutLogs: WorkoutLog[] = [],
  exerciseLibrary: Exercise[] = []
): LaggingMuscle[] {
  const laggingMuscles: LaggingMuscle[] = [];

  // Get all possible muscle groups from the library
  const allMuscles = new Set<string>();
  exerciseLibrary.forEach((exercise) => {
    if (exercise.target) {
      allMuscles.add(exercise.target.toLowerCase().trim());
    }
    if (exercise.secondaryMuscles) {
      if (Array.isArray(exercise.secondaryMuscles)) {
        exercise.secondaryMuscles.forEach((muscle) =>
          allMuscles.add(muscle.toLowerCase().trim())
        );
      } else {
        allMuscles.add(exercise.secondaryMuscles.toLowerCase().trim());
      }
    }
  });

  // Analyze each muscle group using time-based reps
  allMuscles.forEach((muscle) => {
    const lifetimeReps = getMuscleRepsForPeriod(
      workoutLogs,
      exerciseLibrary,
      muscle,
      'lifetime'
    );
    const hasWorkedToday =
      getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, 'today') > 0;
    const hasWorkedThisWeek =
      getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, '7day') > 0;
    const hasWorkedRecently =
      getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, '14day') > 0;

    let laggingType: LaggingType | null = null;
    let bonus = 0;

    if (lifetimeReps === 0) {
      laggingType = 'neverTrained';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.neverTrained;
    } else if (lifetimeReps < SUGGESTION_CONFIG.thresholds.underTrained) {
      laggingType = 'underTrained';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.underTrained;
    } else if (!hasWorkedRecently) {
      laggingType = 'neglected';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.neglected;
    }

    if (laggingType) {
      laggingMuscles.push({
        muscle,
        reps: lifetimeReps,
        laggingType,
        bonus,
        daysSinceTrained: hasWorkedRecently ? 0 : 14, // Simplified for now
        priority: getPriorityScore(
          laggingType,
          lifetimeReps,
          hasWorkedRecently ? 0 : 14
        ),
      });
    }
  });

  // Sort by priority (never trained first, then by days since trained)
  return laggingMuscles.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate priority score for sorting lagging muscles
 */
function getPriorityScore(laggingType: LaggingType, reps: number, daysSinceTrained: number): number {
  const baseScores: Record<LaggingType, number> = {
    neverTrained: 1000,
    underTrained: 500,
    neglected: 100,
  };

  return baseScores[laggingType] + daysSinceTrained;
}

/**
 * Generate workout suggestions based on lagging muscles, available equipment, and selected category
 */
export function generateWorkoutSuggestions(
  userProfile: UserProfile,
  exerciseLibrary: Exercise[],
  count: number = 3
): WorkoutSuggestion[] {
  // Placeholder: Just return the first N exercises as suggestions
  return exerciseLibrary.slice(0, count).map((exercise) => ({
    id: exercise.id,
    exercise,
    bonus: 0,
    laggingMuscle: null,
  }));
}

/**
 * Get a human-readable reason for the suggestion
 */
function getSuggestionReason(laggingMuscle: LaggingMuscle): string {
  const muscleName = laggingMuscle.muscle
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  switch (laggingMuscle.laggingType) {
    case 'neverTrained':
      return `You haven't trained ${muscleName} yet!`;
    case 'underTrained':
      return `${muscleName} needs more attention`;
    case 'neglected':
      return `It's been ${laggingMuscle.daysSinceTrained} days since you trained ${muscleName}`;
    default:
      return `Focus on ${muscleName}`;
  }
}

/**
 * Check if a workout targets lagging muscles for bonus XP
 */
export function calculateLaggingMuscleBonus(
  workoutData: any,
  exerciseDetails: Exercise,
  laggingMuscles: LaggingMuscle[]
): number {
  if (!laggingMuscles || laggingMuscles.length === 0) return 0;

  const targets = [
    exerciseDetails.target,
    ...(Array.isArray(exerciseDetails.secondaryMuscles)
      ? exerciseDetails.secondaryMuscles
      : [exerciseDetails.secondaryMuscles]),
  ];

  let totalBonus = 0;
  laggingMuscles.forEach((laggingMuscle) => {
    const targetsMuscle = targets.some(
      (target) => target && target.toLowerCase().trim() === laggingMuscle.muscle
    );
    if (targetsMuscle) {
      totalBonus += laggingMuscle.bonus;
    }
  });

  return totalBonus;
}

/**
 * Get available equipment options from exercise library
 */
export function getAvailableEquipmentOptions(exerciseLibrary: Exercise[]): string[] {
  const equipmentSet = new Set<string>();

  exerciseLibrary.forEach((exercise) => {
    if (exercise.equipment) {
      equipmentSet.add(exercise.equipment);
    }
  });

  return Array.from(equipmentSet).sort();
} 