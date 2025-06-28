// Workout suggestion service for Goliath
// Analyzes user's muscle reps and generates personalized workout recommendations

import { muscleMapping } from '../../utils/muscleMapping';
import { getMuscleRepsForPeriod } from './exerciseScoringService';

const SUGGESTION_CONFIG = {
  // Bonus XP for working lagging muscle groups
  laggingMuscleBonus: {
    neverTrained: 100,    // +100 XP for muscles never trained
    underTrained: 50,     // +50 XP for muscles with low reps
    neglected: 25         // +25 XP for muscles not trained recently
  },
  
  // Thresholds for determining lagging muscles (in reps)
  thresholds: {
    neverTrained: 0,      // No reps in this muscle
    underTrained: 100,    // Less than 100 reps
    neglected: 500        // Less than 500 reps
  },
  
  // How many days without training to consider "neglected"
  neglectedDays: 14,
  
  // Maximum suggestions to show
  maxSuggestions: 3
};

/**
 * Analyze user's muscle reps to find lagging muscle groups
 * @param {object} muscleReps - User's current muscle reps
 * @param {Array} workoutLogs - User's workout history
 * @param {Array} exerciseLibrary - Available exercises
 * @returns {Array} Array of lagging muscle objects
 */
export function analyzeLaggingMuscles(muscleReps = {}, workoutLogs = [], exerciseLibrary = []) {
  const laggingMuscles = [];
  
  // Get all possible muscle groups from the library
  const allMuscles = new Set();
  exerciseLibrary.forEach(exercise => {
    if (exercise.target) {
      allMuscles.add(exercise.target.toLowerCase().trim());
    }
    if (exercise.secondaryMuscles) {
      if (Array.isArray(exercise.secondaryMuscles)) {
        exercise.secondaryMuscles.forEach(muscle => allMuscles.add(muscle.toLowerCase().trim()));
      } else {
        allMuscles.add(exercise.secondaryMuscles.toLowerCase().trim());
      }
    }
  });
  
  // Analyze each muscle group using time-based reps
  allMuscles.forEach(muscle => {
    const lifetimeReps = getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, 'lifetime');
    const hasWorkedToday = getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, 'today') > 0;
    const hasWorkedThisWeek = getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, '7day') > 0;
    const hasWorkedRecently = getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, '14day') > 0;
    
    let laggingType = null;
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
        priority: getPriorityScore(laggingType, lifetimeReps, hasWorkedRecently ? 0 : 14)
      });
    }
  });
  
  // Sort by priority (never trained first, then by days since trained)
  return laggingMuscles.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate priority score for sorting lagging muscles
 * @param {string} laggingType - Type of lagging (neverTrained, underTrained, neglected)
 * @param {number} reps - Current muscle reps
 * @param {number} daysSinceTrained - Days since last trained
 * @returns {number} Priority score
 */
function getPriorityScore(laggingType, reps, daysSinceTrained) {
  const baseScores = {
    neverTrained: 1000,
    underTrained: 500,
    neglected: 100
  };
  
  return baseScores[laggingType] + daysSinceTrained;
}

/**
 * Generate workout suggestions based on lagging muscles, available equipment, and selected category
 * @param {Array} laggingMuscles - Array of lagging muscle objects
 * @param {Array} exerciseLibrary - Available exercises
 * @param {Array} availableEquipment - User's available equipment (legacy, not used in new logic)
 * @param {Array} hiddenSuggestions - Previously hidden suggestion IDs
 * @param {string} exerciseCategory - 'bodyweight', 'gym', or 'cardio'
 * @param {Array} selectedBodyweight - Selected equipment for bodyweight
 * @param {Array} selectedGym - Selected equipment for gym
 * @param {Array} selectedCardio - Selected equipment for cardio
 * @param {Array} pinnedExercises - Array of pinned exercise IDs
 * @param {Array} favoriteExercises - Array of favorite exercise IDs
 * @returns {Array} Array of workout suggestions
 */
export function generateWorkoutSuggestions(
  laggingMuscles,
  exerciseLibrary,
  availableEquipment = [],
  hiddenSuggestions = [],
  exerciseCategory = 'bodyweight',
  selectedBodyweight = [],
  selectedGym = [],
  selectedCardio = [],
  pinnedExercises = [],
  favoriteExercises = []
) {
  const suggestions = [];
  const usedExerciseIds = new Set();
  const usedEquipment = new Set();

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function hasAllEquipment(exerciseEquipment, selectedEquipment) {
    if (!exerciseEquipment) return true;
    const required = exerciseEquipment.split(',').map(e => e.trim().toLowerCase());
    return required.every(req => selectedEquipment.map(e => e.toLowerCase()).includes(req));
  }

  for (const laggingMuscle of laggingMuscles) {
    // Find all exercises for this muscle and category
    let matchingExercises = exerciseLibrary.filter(exercise => {
      const targets = [exercise.target, ...(Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : [exercise.secondaryMuscles])];
      const targetsMuscle = targets.some(target => target && target.toLowerCase().trim() === laggingMuscle.muscle);
      if (!targetsMuscle) return false;
      if (exerciseCategory === 'cardio') {
        return (exercise.category && exercise.category.toLowerCase() === 'cardio') || (exercise.target && exercise.target.toLowerCase() === 'cardiovascular');
      } else if (exerciseCategory === 'bodyweight') {
        return hasAllEquipment(exercise.equipment, selectedBodyweight);
      } else if (exerciseCategory === 'gym') {
        return hasAllEquipment(exercise.equipment, selectedGym);
      }
      return true;
    });
    // Remove already suggested
    matchingExercises = matchingExercises.filter(ex => !usedExerciseIds.has(ex.id));
    // 1. Pinned
    const pinned = matchingExercises.filter(ex => pinnedExercises.includes(ex.id));
    for (const ex of pinned) {
      const suggestionId = `${ex.id}-${laggingMuscle.muscle}`;
      if (hiddenSuggestions.includes(suggestionId)) continue;
      suggestions.push({
        id: suggestionId,
        exercise: ex,
        laggingMuscle,
        reason: getSuggestionReason(laggingMuscle),
        bonus: laggingMuscle.bonus
      });
      usedExerciseIds.add(ex.id);
      if (ex.equipment) usedEquipment.add(ex.equipment);
      if (suggestions.length >= SUGGESTION_CONFIG.maxSuggestions) return suggestions;
    }
    // 2. Favorite (not pinned)
    const favorite = matchingExercises.filter(ex => favoriteExercises.includes(ex.id) && !pinnedExercises.includes(ex.id));
    for (const ex of favorite) {
      const suggestionId = `${ex.id}-${laggingMuscle.muscle}`;
      if (hiddenSuggestions.includes(suggestionId)) continue;
      suggestions.push({
        id: suggestionId,
        exercise: ex,
        laggingMuscle,
        reason: getSuggestionReason(laggingMuscle),
        bonus: laggingMuscle.bonus
      });
      usedExerciseIds.add(ex.id);
      if (ex.equipment) usedEquipment.add(ex.equipment);
      if (suggestions.length >= SUGGESTION_CONFIG.maxSuggestions) return suggestions;
    }
    // 3. Random (not pinned or favorite)
    const regular = matchingExercises.filter(ex => !pinnedExercises.includes(ex.id) && !favoriteExercises.includes(ex.id));
    if (regular.length > 0) {
      const ex = getRandom(regular);
      const suggestionId = `${ex.id}-${laggingMuscle.muscle}`;
      if (!hiddenSuggestions.includes(suggestionId)) {
        suggestions.push({
          id: suggestionId,
          exercise: ex,
          laggingMuscle,
          reason: getSuggestionReason(laggingMuscle),
          bonus: laggingMuscle.bonus
        });
        usedExerciseIds.add(ex.id);
        if (ex.equipment) usedEquipment.add(ex.equipment);
        if (suggestions.length >= SUGGESTION_CONFIG.maxSuggestions) return suggestions;
      }
    }
    // Only move to next lagging muscle if we still need more suggestions
    if (suggestions.length >= SUGGESTION_CONFIG.maxSuggestions) break;
  }
  return suggestions.slice(0, SUGGESTION_CONFIG.maxSuggestions);
}

/**
 * Get a human-readable reason for the suggestion
 * @param {object} laggingMuscle - Lagging muscle object
 * @returns {string} Reason for suggestion
 */
function getSuggestionReason(laggingMuscle) {
  const muscleName = laggingMuscle.muscle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
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
 * @param {object} workoutData - Workout data
 * @param {object} exerciseDetails - Exercise details
 * @param {Array} laggingMuscles - Array of lagging muscle objects
 * @returns {number} Bonus XP for targeting lagging muscles
 */
export function calculateLaggingMuscleBonus(workoutData, exerciseDetails, laggingMuscles) {
  if (!laggingMuscles || laggingMuscles.length === 0) return 0;
  
  const targets = [exerciseDetails.target, ...(Array.isArray(exerciseDetails.secondaryMuscles) ? exerciseDetails.secondaryMuscles : [exerciseDetails.secondaryMuscles])];
  
  let totalBonus = 0;
  laggingMuscles.forEach(laggingMuscle => {
    const targetsMuscle = targets.some(target => target && target.toLowerCase().trim() === laggingMuscle.muscle);
    if (targetsMuscle) {
      totalBonus += laggingMuscle.bonus;
    }
  });
  
  return totalBonus;
}

/**
 * Get available equipment options from exercise library
 * @param {Array} exerciseLibrary - Available exercises
 * @returns {Array} Array of unique equipment types
 */
export function getAvailableEquipmentOptions(exerciseLibrary) {
  const equipmentSet = new Set();
  
  exerciseLibrary.forEach(exercise => {
    if (exercise.equipment) {
      equipmentSet.add(exercise.equipment);
    }
  });
  
  return Array.from(equipmentSet).sort();
} 