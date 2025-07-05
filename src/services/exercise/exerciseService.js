/**
 * Exercise service for handling exercise-related business logic
 */

/**
 * Calculate exercise score based on workout data and exercise details
 * @param {Object} workoutData - Workout data with sets and duration
 * @param {Object} exerciseDetails - Exercise details from library
 * @returns {number} Calculated score
 *
 * See ARCHITECTURE.md for the XP algorithm.
 */
export function calculateExerciseScore(workoutData, exerciseDetails) {
  let score = 0;
  // Sets-based scoring
  if (workoutData.sets && workoutData.sets.length > 0) {
    score = workoutData.sets.reduce((total, set) => {
      const reps = parseInt(set.reps) || 0;
      const weight = parseFloat(set.weight) || 0;
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
    score += parseInt(workoutData.duration) * 2; // 2 points per minute
  }
  return Math.round(score);
}

/**
 * Get exercise name by ID
 * @param {string} exerciseId - Exercise ID
 * @param {Array} exerciseLibrary - Exercise library array
 * @returns {string} Exercise name or 'Unknown Exercise'
 */
export function getExerciseName(exerciseId, exerciseLibrary) {
  const exercise = exerciseLibrary.find((e) => e.id === exerciseId);
  return exercise ? exercise.name : 'Unknown Exercise';
}

/**
 * Validate exercise data before logging
 * @param {Object} exerciseData - Exercise data to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateExerciseData(exerciseData) {
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
