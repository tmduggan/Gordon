import type { Exercise, WorkoutData, ExerciseSet } from '../../types';

/**
 * Exercise service for handling exercise-related business logic
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Calculate exercise score based on workout data and exercise details
 * @param workoutData - Workout data with sets and duration
 * @param exerciseDetails - Exercise details from library
 * @returns Calculated score
 *
 * See ARCHITECTURE.md for the XP algorithm.
 */
export function calculateExerciseScore(
  workoutData: WorkoutData,
  _exerciseDetails: Exercise
): number {
  let score = 0;
  
  // Sets-based scoring
  if (workoutData.sets && workoutData.sets.length > 0) {
    score = workoutData.sets.reduce((total: number, set: ExerciseSet) => {
      const reps = parseInt(String(set.reps)) || 0;
      const weight = parseFloat(String(set.weight)) || 0;
      
      if (weight > 0) {
        return total + reps * weight * 0.1;
      } else if (reps > 0) {
        return total + reps * 1; // 1 XP per rep for bodyweight/rep-only
      } else {
        return total;
      }
    }, 0);
  }
  
  // Duration-based scoring
  if (workoutData.duration) {
    score += parseInt(String(workoutData.duration)) * 2; // 2 points per minute
  }
  
  return Math.round(score);
}

/**
 * Get exercise name by ID
 * @param exerciseId - Exercise ID
 * @param exerciseLibrary - Exercise library array
 * @returns Exercise name or 'Unknown Exercise'
 */
export function getExerciseName(
  exerciseId: string,
  exerciseLibrary: Exercise[]
): string {
  const exercise = exerciseLibrary.find((e) => e.id === exerciseId);
  return exercise ? exercise.name : 'Unknown Exercise';
}

/**
 * Validate exercise data before logging
 * @param exerciseData - Exercise data to validate
 * @returns Validation result with isValid and message
 */
export function validateExerciseData(exerciseData: {
  sets?: ExerciseSet[];
  duration?: number | null;
}): ValidationResult {
  if (!exerciseData.sets && !exerciseData.duration) {
    return {
      isValid: false,
      message: 'Please provide either sets/reps or duration',
    };
  }

  if (exerciseData.sets && exerciseData.sets.length > 0) {
    for (const set of exerciseData.sets) {
      if (!set.reps || !set.weight) {
        return {
          isValid: false,
          message: 'Please fill in all set data (reps and weight)',
        };
      }
    }
  }

  return { isValid: true, message: 'Valid exercise data' };
} 