const SCORING_CONFIG = {
    version: "v2",
    effortMultipliers: {
      core: 1.0,
      isolation: 1.0,
      compound: 1.5,
      cardio: 1.2
    },
    noveltyBonus: {
        firstOfDay: 40,
        firstOfWeek: 75,
    }
};

// --- Date Helper Functions ---
const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const isSameWeek = (d1, d2) => {
    const startOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(date.setDate(diff));
    };
    const start1 = startOfWeek(d1);
    const start2 = startOfWeek(d2);
    return start1.getTime() === start2.getTime();
};

// Based on gameifyReadme.md
// This service will contain all logic related to calculating scores for workouts.

const multipliers = {
  // A simple multiplier for strength exercises.
  // We can later differentiate between compound, isolation, bodyweight, etc.
  strength: 1, 
  // Points per minute for cardio sessions.
  cardio: 1.5   
};

/**
 * Calculates a score for a single workout log.
 * @param {object} logData - The data for this specific log.
 * @param {number} [logData.weight] - Weight used for the set.
 * @param {number} [logData.reps] - Reps performed for the set.
 * @param {number} [logData.duration] - Duration of the cardio in minutes.
 * @returns {number} The calculated score, rounded to the nearest integer.
 */
export const calculateEffortScore = (logData) => {
  const { weight, reps, duration } = logData;

  // A workout is considered "strength" if it has reps.
  const isStrength = !!reps;

  if (isStrength) {
    // Basic score: weight * reps. Using 1 for bodyweight exercises (weight=0 or null).
    const baseScore = (weight || 1) * reps;
    return Math.round(baseScore * multipliers.strength);
  }

  if (duration) {
    // Score for cardio is based on duration.
    return Math.round(duration * multipliers.cardio);
  }

  // Return 0 if the log is invalid.
  return 0;
};

/**
 * Calculates a numerical score for a given workout log.
 * @param {object} workoutToScore - The workout object being logged.
 *param {array} userWorkoutHistory - An array of all the user's past workout logs, each enriched with exerciseDetails.
 * @param {object} exerciseDetails - The details of the exercise from the exercise library.
 * @returns {number} The calculated score.
 */
export function calculateWorkoutScore(workoutToScore, userWorkoutHistory = [], exerciseDetails = {}) {
    let score = 0;
    
    // 1. Calculate Base Score from sets
    if (workoutToScore.sets && workoutToScore.sets.length > 0) {
        const setTotal = workoutToScore.sets.reduce((total, set) => {
            const weightScore = (set.weight || 0) / 10;
            const repScore = set.reps || 0;
            return total + weightScore + repScore;
        }, 0);
        score += setTotal;
    }

    // For duration-based, score = duration in minutes * 10 (placeholder logic)
    if (workoutToScore.duration) {
        score += workoutToScore.duration * 10;
    }
    
    // 2. Apply Effort Multiplier
    const category = exerciseDetails.category?.toLowerCase();
    const multiplier = SCORING_CONFIG.effortMultipliers[category] || 1.0;
    score *= multiplier;

    // 3. Add Novelty Bonuses
    const today = workoutToScore.timestamp;
    const targetMuscle = exerciseDetails.target;

    const todaysLogs = userWorkoutHistory.filter(log => isSameDay(new Date(log.timestamp.seconds * 1000), today));
    const thisWeeksLogs = userWorkoutHistory.filter(log => isSameWeek(new Date(log.timestamp.seconds * 1000), today));

    const hasWorkedMuscleToday = todaysLogs.some(log => log.target === targetMuscle);
    const hasWorkedMuscleThisWeek = thisWeeksLogs.some(log => log.target === targetMuscle);

    if (!hasWorkedMuscleThisWeek) {
        score += SCORING_CONFIG.noveltyBonus.firstOfWeek;
    } else if (!hasWorkedMuscleToday) {
        score += SCORING_CONFIG.noveltyBonus.firstOfDay;
    }

    return Math.round(score);
} 