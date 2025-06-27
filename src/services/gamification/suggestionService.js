// Workout suggestion service for Goliath
// Analyzes user's muscle scores and generates personalized workout recommendations

import { muscleMapping } from '../../utils/muscleMapping';
import { getMuscleScore, hasWorkedMuscle } from './muscleScoreService';

const SUGGESTION_CONFIG = {
  // Bonus XP for working lagging muscle groups
  laggingMuscleBonus: {
    neverTrained: 100,    // +100 XP for muscles never trained
    underTrained: 50,     // +50 XP for muscles with low scores
    neglected: 25         // +25 XP for muscles not trained recently
  },
  
  // Thresholds for determining lagging muscles
  thresholds: {
    neverTrained: 0,      // No XP in this muscle
    underTrained: 100,    // Less than 100 XP
    neglected: 500        // Less than 500 XP
  },
  
  // How many days without training to consider "neglected"
  neglectedDays: 14,
  
  // Maximum suggestions to show
  maxSuggestions: 3
};

/**
 * Analyze user's muscle scores to find lagging muscle groups
 * @param {object} muscleScores - User's current muscle scores
 * @param {Array} workoutLogs - User's workout history (deprecated, kept for compatibility)
 * @param {Array} exerciseLibrary - Available exercises
 * @returns {Array} Array of lagging muscle objects
 */
export function analyzeLaggingMuscles(muscleScores = {}, workoutLogs = [], exerciseLibrary = []) {
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
  
  // Analyze each muscle group using time-based scores
  allMuscles.forEach(muscle => {
    const lifetimeScore = getMuscleScore(muscleScores, muscle, 'lifetime');
    const hasWorkedToday = hasWorkedMuscle(muscleScores, muscle, 'today');
    const hasWorkedThisWeek = hasWorkedMuscle(muscleScores, muscle, '7day');
    const hasWorkedRecently = hasWorkedMuscle(muscleScores, muscle, '14day');
    
    let laggingType = null;
    let bonus = 0;
    
    if (lifetimeScore === 0) {
      laggingType = 'neverTrained';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.neverTrained;
    } else if (lifetimeScore < SUGGESTION_CONFIG.thresholds.underTrained) {
      laggingType = 'underTrained';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.underTrained;
    } else if (!hasWorkedRecently) {
      laggingType = 'neglected';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.neglected;
    }
    
    if (laggingType) {
      laggingMuscles.push({
        muscle,
        score: lifetimeScore,
        laggingType,
        bonus,
        daysSinceTrained: hasWorkedRecently ? 0 : 14, // Simplified for now
        priority: getPriorityScore(laggingType, lifetimeScore, hasWorkedRecently ? 0 : 14)
      });
    }
  });
  
  // Sort by priority (never trained first, then by days since trained)
  return laggingMuscles.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate priority score for sorting lagging muscles
 * @param {string} laggingType - Type of lagging (neverTrained, underTrained, neglected)
 * @param {number} score - Current muscle score
 * @param {number} daysSinceTrained - Days since last trained
 * @returns {number} Priority score
 */
function getPriorityScore(laggingType, score, daysSinceTrained) {
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
 * @returns {Array} Array of workout suggestions
 */
export function generateWorkoutSuggestions(laggingMuscles, exerciseLibrary, availableEquipment = [], hiddenSuggestions = [], exerciseCategory = 'bodyweight', selectedBodyweight = [], selectedGym = [], selectedCardio = []) {
  const suggestions = [];
  const usedExerciseIds = new Set();
  const usedEquipment = new Set();

  // Helper to get a random element from an array
  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Helper to check if all required equipment is present
  function hasAllEquipment(exerciseEquipment, selectedEquipment) {
    if (!exerciseEquipment) return true;
    const required = exerciseEquipment.split(',').map(e => e.trim().toLowerCase());
    return required.every(req => selectedEquipment.map(e => e.toLowerCase()).includes(req));
  }

  laggingMuscles.forEach(laggingMuscle => {
    // Find exercises that target this muscle and use available equipment/category
    let matchingExercises = exerciseLibrary.filter(exercise => {
      // Check if exercise targets the lagging muscle
      const targets = [exercise.target, ...(Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : [exercise.secondaryMuscles])];
      const targetsMuscle = targets.some(target => target && target.toLowerCase().trim() === laggingMuscle.muscle);
      if (!targetsMuscle) return false;
      // Category-based filtering
      if (exerciseCategory === 'cardio') {
        return (exercise.category && exercise.category.toLowerCase() === 'cardio') || (exercise.target && exercise.target.toLowerCase() === 'cardiovascular');
      } else if (exerciseCategory === 'bodyweight') {
        return hasAllEquipment(exercise.equipment, selectedBodyweight);
      } else if (exerciseCategory === 'gym') {
        return hasAllEquipment(exercise.equipment, selectedGym);
      }
      return true;
    });

    // Remove exercises already suggested
    matchingExercises = matchingExercises.filter(ex => !usedExerciseIds.has(ex.id));

    // Prefer exercises with equipment not already used in this batch
    let preferredExercises = matchingExercises.filter(ex => {
      if (!ex.equipment) return true;
      return !usedEquipment.has(ex.equipment);
    });
    // If not enough variety, fall back to all matching
    if (preferredExercises.length === 0) preferredExercises = matchingExercises;

    // Randomly pick one exercise from preferred list
    if (preferredExercises.length > 0) {
      const exercise = getRandom(preferredExercises);
      const suggestionId = `${exercise.id}-${laggingMuscle.muscle}`;
      // Skip if this suggestion was hidden
      if (hiddenSuggestions.includes(suggestionId)) return;
      suggestions.push({
        id: suggestionId,
        exercise,
        laggingMuscle,
        reason: getSuggestionReason(laggingMuscle),
        bonus: laggingMuscle.bonus
      });
      usedExerciseIds.add(exercise.id);
      if (exercise.equipment) usedEquipment.add(exercise.equipment);
    }
  });

  // Limit to max suggestions
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