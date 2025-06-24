// Workout suggestion service for Goliath
// Analyzes user's muscle scores and generates personalized workout recommendations

import { muscleMapping } from '../utils/muscleMapping';

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
 * @param {Array} workoutLogs - User's workout history
 * @param {Array} exerciseLibrary - Available exercises
 * @returns {Array} Array of lagging muscle objects
 */
export function analyzeLaggingMuscles(muscleScores = {}, workoutLogs = [], exerciseLibrary = []) {
  const laggingMuscles = [];
  const now = new Date();
  
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
  
  // Analyze each muscle group
  allMuscles.forEach(muscle => {
    const score = muscleScores[muscle] || 0;
    const lastTrained = getLastTrainedDate(muscle, workoutLogs, exerciseLibrary);
    const daysSinceTrained = lastTrained ? Math.floor((now - lastTrained) / (1000 * 60 * 60 * 24)) : Infinity;
    
    let laggingType = null;
    let bonus = 0;
    
    if (score === 0) {
      laggingType = 'neverTrained';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.neverTrained;
    } else if (score < SUGGESTION_CONFIG.thresholds.underTrained) {
      laggingType = 'underTrained';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.underTrained;
    } else if (daysSinceTrained > SUGGESTION_CONFIG.neglectedDays) {
      laggingType = 'neglected';
      bonus = SUGGESTION_CONFIG.laggingMuscleBonus.neglected;
    }
    
    if (laggingType) {
      laggingMuscles.push({
        muscle,
        score,
        laggingType,
        bonus,
        daysSinceTrained,
        priority: getPriorityScore(laggingType, score, daysSinceTrained)
      });
    }
  });
  
  // Sort by priority (never trained first, then by days since trained)
  return laggingMuscles.sort((a, b) => b.priority - a.priority);
}

/**
 * Get the last date a specific muscle was trained
 * @param {string} muscle - Muscle name to check
 * @param {Array} workoutLogs - User's workout history
 * @param {Array} exerciseLibrary - Available exercises
 * @returns {Date|null} Last training date or null if never trained
 */
function getLastTrainedDate(muscle, workoutLogs, exerciseLibrary) {
  let lastDate = null;
  
  workoutLogs.forEach(log => {
    const exercise = exerciseLibrary.find(e => e.id === log.exerciseId);
    if (!exercise) return;
    
    const targets = [exercise.target, ...(Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : [exercise.secondaryMuscles])];
    const hasMuscle = targets.some(target => target && target.toLowerCase().trim() === muscle);
    
    if (hasMuscle) {
      const logDate = new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp);
      if (!lastDate || logDate > lastDate) {
        lastDate = logDate;
      }
    }
  });
  
  return lastDate;
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
 * Generate workout suggestions based on lagging muscles and available equipment
 * @param {Array} laggingMuscles - Array of lagging muscle objects
 * @param {Array} exerciseLibrary - Available exercises
 * @param {Array} availableEquipment - User's available equipment
 * @param {Array} hiddenSuggestions - Previously hidden suggestion IDs
 * @returns {Array} Array of workout suggestions
 */
export function generateWorkoutSuggestions(laggingMuscles, exerciseLibrary, availableEquipment = [], hiddenSuggestions = []) {
  const suggestions = [];
  
  laggingMuscles.forEach(laggingMuscle => {
    // Find exercises that target this muscle and use available equipment
    const matchingExercises = exerciseLibrary.filter(exercise => {
      // Check if exercise targets the lagging muscle
      const targets = [exercise.target, ...(Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : [exercise.secondaryMuscles])];
      const targetsMuscle = targets.some(target => target && target.toLowerCase().trim() === laggingMuscle.muscle);
      
      if (!targetsMuscle) return false;
      
      // Check if exercise uses available equipment
      if (availableEquipment.length > 0) {
        const exerciseEquipment = exercise.equipment?.toLowerCase() || '';
        return availableEquipment.some(equipment => 
          exerciseEquipment.includes(equipment.toLowerCase())
        );
      }
      
      return true; // If no equipment specified, include all exercises
    });
    
    // Sort exercises by effectiveness (compound exercises first, then isolation)
    const sortedExercises = matchingExercises.sort((a, b) => {
      const aIsCompound = a.category?.toLowerCase() === 'compound';
      const bIsCompound = b.category?.toLowerCase() === 'compound';
      
      if (aIsCompound && !bIsCompound) return -1;
      if (!aIsCompound && bIsCompound) return 1;
      return 0;
    });
    
    // Take the best exercise for this muscle
    if (sortedExercises.length > 0) {
      const exercise = sortedExercises[0];
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