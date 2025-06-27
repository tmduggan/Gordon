// Muscle Score Service for time-based muscle tracking
// Handles calculation, migration, and optimization of muscle scores

const TIME_PERIODS = {
  today: 0,
  '3day': 3,
  '7day': 7,
  '14day': 14,
  '30day': 30,
  lifetime: Infinity
};

/**
 * Calculate time-based muscle scores from workout history
 * @param {Array} workoutLogs - Array of workout logs
 * @param {Array} exerciseLibrary - Exercise library for muscle mapping
 * @param {Date} referenceDate - Date to calculate from (defaults to now)
 * @returns {object} Time-based muscle scores
 */
export function calculateTimeBasedMuscleScores(workoutLogs = [], exerciseLibrary = [], referenceDate = new Date()) {
  const muscleScores = {};
  
  // Helper to process muscle strings
  const processMuscleString = (muscleString, score, logDate) => {
    if (!muscleString) return;
    muscleString.split(',').forEach(muscle => {
      const name = muscle.trim().toLowerCase();
      if (!name) return;
      
      if (!muscleScores[name]) {
        muscleScores[name] = {
          today: 0,
          '3day': 0,
          '7day': 0,
          '14day': 0,
          '30day': 0,
          lifetime: 0,
          lastCalculated: referenceDate.toISOString(),
          oldestRelevantLog: null
        };
      }
      
      // Add to lifetime (always)
      muscleScores[name].lifetime += score;
      
      // Calculate days since this log
      const daysSinceLog = Math.floor((referenceDate - logDate) / (1000 * 60 * 60 * 24));
      
      // Add to appropriate time periods
      if (daysSinceLog === 0) {
        muscleScores[name].today += score;
      }
      if (daysSinceLog <= 3) {
        muscleScores[name]['3day'] += score;
      }
      if (daysSinceLog <= 7) {
        muscleScores[name]['7day'] += score;
      }
      if (daysSinceLog <= 14) {
        muscleScores[name]['14day'] += score;
      }
      if (daysSinceLog <= 30) {
        muscleScores[name]['30day'] += score;
      }
      
      // Track oldest relevant log
      if (!muscleScores[name].oldestRelevantLog || logDate < muscleScores[name].oldestRelevantLog) {
        muscleScores[name].oldestRelevantLog = logDate;
      }
    });
  };
  
  // Process each workout log
  workoutLogs.forEach(log => {
    const exercise = exerciseLibrary.find(e => e.id === log.exerciseId);
    if (!exercise) return;
    
    const logDate = new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp);
    const score = log.score || 0;
    
    // Process target muscle(s)
    processMuscleString(exercise.target, score, logDate);
    
    // Process secondary muscles
    if (Array.isArray(exercise.secondaryMuscles)) {
      exercise.secondaryMuscles.forEach(sec => processMuscleString(sec, score, logDate));
    } else if (typeof exercise.secondaryMuscles === 'string') {
      processMuscleString(exercise.secondaryMuscles, score, logDate);
    }
  });
  
  return muscleScores;
}

/**
 * Add a new workout score to existing muscle scores
 * @param {object} existingScores - Current muscle scores
 * @param {object} exerciseDetails - Exercise details with target/secondary muscles
 * @param {number} score - Workout score
 * @param {Date} workoutDate - Date of the workout
 * @returns {object} Updated muscle scores
 */
export function addWorkoutToMuscleScores(existingScores = {}, exerciseDetails, score, workoutDate = new Date()) {
  const updatedScores = { ...existingScores };
  
  const processMuscleString = (muscleString) => {
    if (!muscleString) return;
    muscleString.split(',').forEach(muscle => {
      const name = muscle.trim().toLowerCase();
      if (!name) return;
      
      if (!updatedScores[name]) {
        updatedScores[name] = {
          today: 0,
          '3day': 0,
          '7day': 0,
          '14day': 0,
          '30day': 0,
          lifetime: 0,
          lastCalculated: workoutDate.toISOString(),
          oldestRelevantLog: workoutDate
        };
      }
      
      // Add to all time periods
      updatedScores[name].today += score;
      updatedScores[name]['3day'] += score;
      updatedScores[name]['7day'] += score;
      updatedScores[name]['14day'] += score;
      updatedScores[name]['30day'] += score;
      updatedScores[name].lifetime += score;
      
      // Update metadata
      updatedScores[name].lastCalculated = workoutDate.toISOString();
      if (!updatedScores[name].oldestRelevantLog || workoutDate < updatedScores[name].oldestRelevantLog) {
        updatedScores[name].oldestRelevantLog = workoutDate;
      }
    });
  };
  
  // Process target muscle(s)
  processMuscleString(exerciseDetails.target);
  
  // Process secondary muscles
  if (Array.isArray(exerciseDetails.secondaryMuscles)) {
    exerciseDetails.secondaryMuscles.forEach(sec => processMuscleString(sec));
  } else if (typeof exerciseDetails.secondaryMuscles === 'string') {
    processMuscleString(exerciseDetails.secondaryMuscles);
  }
  
  return updatedScores;
}

/**
 * Migrate existing single-value muscle scores to time-based structure
 * @param {object} oldMuscleScores - Old single-value muscle scores
 * @returns {object} New time-based muscle scores
 */
export function migrateMuscleScores(oldMuscleScores = {}) {
  const migratedScores = {};
  const now = new Date();
  
  Object.entries(oldMuscleScores).forEach(([muscle, score]) => {
    migratedScores[muscle] = {
      today: 0,
      '3day': 0,
      '7day': 0,
      '14day': 0,
      '30day': 0,
      lifetime: score || 0,
      lastCalculated: now.toISOString(),
      oldestRelevantLog: null
    };
  });
  
  return migratedScores;
}

/**
 * Clean up expired scores from time periods
 * @param {object} muscleScores - Current muscle scores
 * @param {Date} referenceDate - Date to calculate from
 * @returns {object} Cleaned muscle scores
 */
export function cleanupExpiredScores(muscleScores = {}, referenceDate = new Date()) {
  const cleanedScores = { ...muscleScores };
  
  Object.keys(cleanedScores).forEach(muscle => {
    const scores = cleanedScores[muscle];
    
    // Reset today score (will be recalculated on next workout)
    scores.today = 0;
    
    // Note: Other time periods will be recalculated when needed
    // This is a lightweight cleanup that just resets today
    scores.lastCalculated = referenceDate.toISOString();
  });
  
  return cleanedScores;
}

/**
 * Get muscle score for a specific time period
 * @param {object} muscleScores - Muscle scores object
 * @param {string} muscle - Muscle name
 * @param {string} timePeriod - Time period to get
 * @returns {number} Score for that time period
 */
export function getMuscleScore(muscleScores = {}, muscle, timePeriod = 'lifetime') {
  const muscleName = muscle.toLowerCase().trim();
  return muscleScores[muscleName]?.[timePeriod] || 0;
}

/**
 * Check if a muscle has been worked recently
 * @param {object} muscleScores - Muscle scores object
 * @param {string} muscle - Muscle name
 * @param {string} timePeriod - Time period to check
 * @returns {boolean} Whether muscle has been worked in that period
 */
export function hasWorkedMuscle(muscleScores = {}, muscle, timePeriod = 'today') {
  return getMuscleScore(muscleScores, muscle, timePeriod) > 0;
}

export { TIME_PERIODS }; 