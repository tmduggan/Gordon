// Import level service for streak bonuses
import { calculateStreakBonuses } from './levelService.js';
// Import suggestion service for lagging muscle bonuses
import { calculateLaggingMuscleBonus, analyzeLaggingMuscles } from './suggestionService.js';

const SCORING_CONFIG = {
    version: "v4",
    diminishingReturns: {
        startSet: 4,
        multiplier: 0.5
    },
    effortMultipliers: {
      core: 1.0,
      isolation: 1.0,
      compound: 1.5,
      cardio: 1.2
    },
    noveltyBonus: {
        firstOfDay: 40,
        firstOfWeek: 75,
    },
    // Reduced weight multiplier to make weight less dominant
    weightMultiplier: 0.1, // Previously was effectively 1.0
    // Personal best bonuses
    personalBestBonuses: {
        beatsCurrentBest: 50,
        beatsMonthBest: 100,
        beatsQuarterBest: 150,
        beatsYearBest: 200,
        beatsAllTimeBest: 300
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

// Personal Bests Helper Functions
const getTimeRanges = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    return {
        current: { start: oneMonthAgo, end: now },
        quarter: { start: threeMonthsAgo, end: now },
        year: { start: oneYearAgo, end: now },
        allTime: { start: new Date(0), end: now }
    };
};

const calculateExerciseValue = (exerciseData, exerciseDetails) => {
    const { weight, reps, duration, distance } = exerciseData;
    const { category, target } = exerciseDetails;
    
    // For cardio exercises with distance (like running)
    if (distance && duration) {
        const pace = duration / distance; // minutes per unit distance
        return { value: pace, type: 'pace', unit: 'min/unit' };
    }
    
    // For duration-only exercises (like planks)
    if (duration && !weight && !reps) {
        return { value: duration, type: 'duration', unit: 'minutes' };
    }
    
    // For reps-only exercises (like push-ups)
    if (reps && !weight) {
        return { value: reps, type: 'reps', unit: 'reps' };
    }
    
    // For weight + reps exercises (like bench press)
    if (weight && reps) {
        // Calculate 1RM using Epley formula: 1RM = weight * (1 + reps/30)
        const oneRM = weight * (1 + reps / 30);
        return { value: oneRM, type: '1rm', unit: 'lbs' };
    }
    
    // For single rep max
    if (weight && reps === 1) {
        return { value: weight, type: '1rm', unit: 'lbs' };
    }
    
    return { value: 0, type: 'unknown', unit: 'unknown' };
};

const updatePersonalBests = (exerciseId, exerciseData, exerciseDetails, userProfile) => {
    const newValue = calculateExerciseValue(exerciseData, exerciseDetails);
    if (newValue.value === 0) return userProfile;
    
    const personalBests = userProfile.personalBests || {};
    const exerciseBests = personalBests[exerciseId] || {};
    
    const timeRanges = getTimeRanges();
    const now = new Date();
    let updated = false;
    
    // Update all-time best if this is better
    if (!exerciseBests.allTime || newValue.value > exerciseBests.allTime.value) {
        exerciseBests.allTime = { ...newValue, date: now };
        updated = true;
    }
    
    // Update year best if this is better
    if (!exerciseBests.year || newValue.value > exerciseBests.year.value) {
        exerciseBests.year = { ...newValue, date: now };
        updated = true;
    }
    
    // Update quarter best if this is better
    if (!exerciseBests.quarter || newValue.value > exerciseBests.quarter.value) {
        exerciseBests.quarter = { ...newValue, date: now };
        updated = true;
    }
    
    // Update current (month) best if this is better
    if (!exerciseBests.current || newValue.value > exerciseBests.current.value) {
        exerciseBests.current = { ...newValue, date: now };
        updated = true;
    }
    
    if (updated) {
        return {
            ...userProfile,
            personalBests: {
                ...personalBests,
                [exerciseId]: exerciseBests
            }
        };
    }
    
    return userProfile;
};

const calculatePersonalBestBonus = (exerciseId, exerciseData, exerciseDetails, userProfile) => {
    const newValue = calculateExerciseValue(exerciseData, exerciseDetails);
    if (newValue.value === 0) return 0;
    
    const personalBests = userProfile.personalBests || {};
    const exerciseBests = personalBests[exerciseId] || {};
    
    let bonus = 0;
    
    // Check if this beats current best
    if (exerciseBests.current && newValue.value > exerciseBests.current.value) {
        bonus += SCORING_CONFIG.personalBestBonuses.beatsCurrentBest;
    }
    
    // Check if this beats quarter best
    if (exerciseBests.quarter && newValue.value > exerciseBests.quarter.value) {
        bonus += SCORING_CONFIG.personalBestBonuses.beatsQuarterBest;
    }
    
    // Check if this beats year best
    if (exerciseBests.year && newValue.value > exerciseBests.year.value) {
        bonus += SCORING_CONFIG.personalBestBonuses.beatsYearBest;
    }
    
    // Check if this beats all-time best
    if (exerciseBests.allTime && newValue.value > exerciseBests.allTime.value) {
        bonus += SCORING_CONFIG.personalBestBonuses.beatsAllTimeBest;
    }
    
    return bonus;
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
    // Basic score: (weight * 0.1) + reps. Using 1 for bodyweight exercises (weight=0 or null).
    const weightScore = ((weight || 1) * SCORING_CONFIG.weightMultiplier);
    const repScore = reps;
    const baseScore = weightScore + repScore;
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
 * @param {array} userWorkoutHistory - An array of all the user's past workout logs, each enriched with exerciseDetails.
 * @param {object} exerciseDetails - The details of the exercise from the exercise library.
 * @param {object} userProfile - The user's profile containing personal bests.
 * @returns {number} The calculated score.
 */
export function calculateWorkoutScore(workoutToScore, userWorkoutHistory = [], exerciseDetails = {}, userProfile = null) {
    let score = 0;
    
    // 1. Calculate Base Score from sets
    if (workoutToScore.sets && workoutToScore.sets.length > 0) {
        const setTotal = workoutToScore.sets.reduce((total, set, index) => {
            const setNumber = index + 1;
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps, 10) || 0;

            const weightScore = (weight * SCORING_CONFIG.weightMultiplier);
            const repScore = reps;
            let setScore = weightScore + repScore;

            if (setNumber >= SCORING_CONFIG.diminishingReturns.startSet) {
                setScore *= SCORING_CONFIG.diminishingReturns.multiplier;
            }

            return total + setScore;
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

    // 3. Add Personal Best Bonuses
    if (userProfile && workoutToScore.sets && workoutToScore.sets.length > 0) {
        // Filter out incomplete sets before finding the best one
        const completeSets = workoutToScore.sets.filter(s => (s.weight || s.reps));
        if (completeSets.length === 0) return Math.round(score);

        // Calculate bonus for the best set in this workout
        const bestSet = completeSets.reduce((best, set) => {
            const setValue = calculateExerciseValue(set, exerciseDetails);
            const bestValue = calculateExerciseValue(best, exerciseDetails);
            return setValue.value > bestValue.value ? set : best;
        }, completeSets[0]);
        
        const personalBestBonus = calculatePersonalBestBonus(
            exerciseDetails.id, 
            bestSet, 
            exerciseDetails, 
            userProfile
        );
        score += personalBestBonus;
    }

    // 4. Add Novelty Bonuses
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

    // 5. Add Streak Bonuses (only for the first workout of the day)
    const todaysWorkouts = userWorkoutHistory.filter(log => 
        isSameDay(new Date(log.timestamp.seconds * 1000), today)
    );
    
    // Only apply streak bonus if this is the first workout of the day
    if (todaysWorkouts.length === 0) {
        try {
            const streakInfo = calculateStreakBonuses(userWorkoutHistory);
            score += streakInfo.dailyBonus + streakInfo.weeklyBonus;
        } catch (error) {
            console.warn('Error calculating streak bonuses:', error);
        }
    }

    // 6. Add Lagging Muscle Bonuses
    if (userProfile?.muscleScores) {
        try {
            const laggingMuscles = analyzeLaggingMuscles(userProfile.muscleScores, userWorkoutHistory, [exerciseDetails]);
            const laggingMuscleBonus = calculateLaggingMuscleBonus(
                workoutToScore,
                exerciseDetails,
                laggingMuscles
            );
            score += laggingMuscleBonus;
        } catch (error) {
            console.warn('Error calculating lagging muscle bonus:', error);
        }
    }

    return Math.round(score);
}

/**
 * Recalculates the scores for a list of historical workout logs.
 * This is useful when scoring logic changes and past scores need to be updated.
 * @param {Array<object>} historicalLogs - The user's workout history.
 * @param {object} exerciseLibrary - A map of exercise details, keyed by exercise ID.
 * @returns {Array<object>} The logs with their `score` property updated.
 */
export function recalculateScoresForHistory(historicalLogs, exerciseLibrary) {
    console.log("Recalculating scores for historical logs with new logic...", {scoringVersion: SCORING_CONFIG.version});

    if (!historicalLogs || historicalLogs.length === 0) {
        return [];
    }

    if (!exerciseLibrary || Object.keys(exerciseLibrary).length === 0) {
        console.warn("Exercise library is not available. Scores will be based on log data only.");
        // Return logs as-is if library is missing, or handle as needed
        return historicalLogs;
    }

    return historicalLogs.map(log => {
        const exerciseDetails = exerciseLibrary[log.exerciseId] || {};
        const newScore = calculateWorkoutScore(log, [], exerciseDetails, null);
        return {
            ...log,
            score: newScore
        };
    });
}

// Export helper functions for use in other components
export { 
    updatePersonalBests, 
    calculatePersonalBestBonus, 
    calculateExerciseValue,
    getTimeRanges 
}; 