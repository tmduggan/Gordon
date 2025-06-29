// Simplified Exercise Scoring Service
// Handles muscle rep tracking and basic personal best bonuses

/**
 * Process muscle string and add reps to muscle tracking
 * @param {string} muscleString - Comma-separated muscle names
 * @param {number} reps - Reps to add
 * @param {object} muscleReps - Current muscle reps object
 */
const processMuscleString = (muscleString, reps, muscleReps) => {
  if (!muscleString) return;
  
  muscleString.split(',').forEach(muscle => {
    const name = muscle.trim().toLowerCase();
    if (!name) return;
    
    if (!muscleReps[name]) {
      muscleReps[name] = 0;
    }
    
    muscleReps[name] += reps;
  });
};

/**
 * Add workout reps to muscle tracking
 * @param {object} workoutData - Workout data with sets
 * @param {object} exerciseDetails - Exercise details with target/secondary muscles
 * @param {object} existingMuscleReps - Current muscle reps object
 * @returns {object} Updated muscle reps
 */
export function addWorkoutToMuscleReps(workoutData, exerciseDetails, existingMuscleReps = {}) {
  const muscleReps = { ...existingMuscleReps };
  
  // Calculate total reps from all sets
  let totalReps = 0;
  if (workoutData.sets && workoutData.sets.length > 0) {
    totalReps = workoutData.sets.reduce((sum, set) => sum + (parseInt(set.reps) || 0), 0);
  } else if (workoutData.reps) {
    totalReps = parseInt(workoutData.reps) || 0;
  }
  
  // Process target muscle(s)
  processMuscleString(exerciseDetails.target, totalReps, muscleReps);
  
  // Process secondary muscles
  if (Array.isArray(exerciseDetails.secondaryMuscles)) {
    exerciseDetails.secondaryMuscles.forEach(sec => processMuscleString(sec, totalReps, muscleReps));
  } else if (typeof exerciseDetails.secondaryMuscles === 'string') {
    processMuscleString(exerciseDetails.secondaryMuscles, totalReps, muscleReps);
  }
  
  return muscleReps;
}

/**
 * Get muscle reps for a specific time period by filtering workout history
 * @param {Array} workoutHistory - Array of workout logs
 * @param {Array} exerciseLibrary - Exercise library for muscle mapping
 * @param {string} muscle - Muscle name
 * @param {string} timePeriod - Time period ('today', '3day', '7day', '14day', '30day', 'lifetime')
 * @param {Date} referenceDate - Reference date for calculations
 * @returns {number} Reps for that time period
 */
export function getMuscleRepsForPeriod(workoutHistory = [], exerciseLibrary = [], muscle, timePeriod = 'lifetime', referenceDate = new Date()) {
  const muscleName = muscle.toLowerCase().trim();
  let totalReps = 0;
  
  // Calculate cutoff date based on time period
  let cutoffDate = new Date(0); // Beginning of time for lifetime
  if (timePeriod !== 'lifetime') {
    const days = {
      'today': 0,
      '3day': 3,
      '7day': 7,
      '14day': 14,
      '30day': 30
    };
    if (days[timePeriod] !== undefined) {
      cutoffDate = new Date(referenceDate.getTime() - (days[timePeriod] * 24 * 60 * 60 * 1000));
    }
  }
  
  // Filter and sum reps
  workoutHistory.forEach(log => {
    const logDate = new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp);
    if (logDate >= cutoffDate) {
      const exercise = exerciseLibrary.find(e => e.id === log.exerciseId);
      if (!exercise) return;
      
      // Calculate total reps from all sets
      let totalReps = 0;
      if (log.sets && log.sets.length > 0) {
        totalReps = log.sets.reduce((sum, set) => sum + (parseInt(set.reps) || 0), 0);
      } else if (log.reps) {
        totalReps = parseInt(log.reps) || 0;
      }
      
      // Check if this exercise targets the muscle
      const targetMuscles = exercise.target ? exercise.target.split(',').map(m => m.trim().toLowerCase()) : [];
      const secondaryMuscles = exercise.secondaryMuscles ? 
        (Array.isArray(exercise.secondaryMuscles) ? 
          exercise.secondaryMuscles.flatMap(m => m.split(',').map(s => s.trim().toLowerCase())) :
          exercise.secondaryMuscles.split(',').map(m => m.trim().toLowerCase())
        ) : [];
      
      const allMuscles = [...targetMuscles, ...secondaryMuscles];
      if (allMuscles.includes(muscleName)) {
        totalReps += totalReps;
      }
    }
  });
  
  return totalReps;
}

/**
 * Calculate a simple personal best bonus for muscle volume
 * @param {object} workoutData - Current workout data
 * @param {object} exerciseDetails - Exercise details
 * @param {object} userProfile - User profile with personal bests
 * @returns {number} Bonus points (0-4)
 */
export function calculatePersonalBestBonus(workoutData, exerciseDetails, userProfile) {
  if (!userProfile?.personalBests || !workoutData.sets || workoutData.sets.length === 0) {
    return 0;
  }
  
  // Find the best set in this workout
  const bestSet = workoutData.sets.reduce((best, set) => {
    const setReps = parseInt(set.reps) || 0;
    const bestReps = parseInt(best.reps) || 0;
    return setReps > bestReps ? set : best;
  }, workoutData.sets[0]);
  
  const exerciseId = exerciseDetails.id;
  const personalBests = userProfile.personalBests[exerciseId];
  
  if (!personalBests) return 0;
  
  const currentReps = parseInt(bestSet.reps) || 0;
  const currentWeight = parseFloat(bestSet.weight) || 0;
  
  // Check against different best categories
  if (personalBests.allTime && currentReps > personalBests.allTime.reps) return 4;
  if (personalBests.year && currentReps > personalBests.year.reps) return 3;
  if (personalBests.month && currentReps > personalBests.month.reps) return 2;
  if (personalBests.week && currentReps > personalBests.week.reps) return 1;
  
  return 0;
} 