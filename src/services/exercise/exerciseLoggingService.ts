import type { 
  WorkoutData, 
  ExerciseDetails, 
  UserProfile, 
  ExerciseLog,
  ExerciseSet
} from '../../types';
import { calculateExerciseScore } from './exerciseService';
import { updatePersonalBests } from '../gamification/exerciseBestsService';

/**
 * Calculate weighted score from muscleScores using the formula:
 * (today * 1.0) + (3day * 0.5) + (7day * 0.1)
 */
export function getMuscleWeightedScore(
  muscleScores: Record<string, { today: number; '3day': number; '7day': number; lastUpdated: Date }> | undefined,
  muscleName: string
): number {
  if (!muscleScores || !muscleScores[muscleName]) return 0;
  
  const muscle = muscleScores[muscleName];
  return Math.round(
    (muscle.today * 1.0) + 
    (muscle['3day'] * 0.5) + 
    (muscle['7day'] * 0.1)
  );
}

/**
 * Decay muscle scores based on calendar days since last update
 * Uses local timezone for "today" calculations
 */
export function decayMuscleScores(
  muscleScores: Record<string, { today: number; '3day': number; '7day': number; lastUpdated: Date }> | undefined
): Record<string, { today: number; '3day': number; '7day': number; lastUpdated: Date }> {
  if (!muscleScores) return {};
  
  const today = new Date();
  const updatedScores = { ...muscleScores };
  
  Object.keys(updatedScores).forEach(muscle => {
    const lastUpdated = new Date(updatedScores[muscle].lastUpdated);
    
    // Calculate calendar days difference (not 24-hour periods)
    const lastUpdatedDate = new Date(lastUpdated.getFullYear(), lastUpdated.getMonth(), lastUpdated.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysDiff = Math.floor((todayDate.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 1) updatedScores[muscle].today = 0;
    if (daysDiff >= 3) updatedScores[muscle]['3day'] = 0;
    if (daysDiff >= 7) updatedScores[muscle]['7day'] = 0;
  });
  
  return updatedScores;
}

/**
 * Update muscleScores with new workout data
 * Adds reps to today, 3day, and 7day values and updates timestamp
 */
export function updateMuscleScores(
  workoutData: WorkoutData,
  exerciseDetails: ExerciseDetails,
  existingMuscleScores: Record<string, { today: number; '3day': number; '7day': number; lastUpdated: Date }> = {}
): Record<string, { today: number; '3day': number; '7day': number; lastUpdated: Date }> {
  const muscleScores = { ...existingMuscleScores };

  // Calculate total reps from all sets
  let totalReps = 0;
  if (workoutData.sets && workoutData.sets.length > 0) {
    totalReps = workoutData.sets.reduce(
      (sum, set) => sum + (parseInt(String(set.reps)) || 0),
      0
    );
  }

  // Helper function to process muscle string
  const processMuscleString = (muscleString: string | undefined) => {
    if (!muscleString) return;

    muscleString.split(',').forEach((muscle) => {
      const name = muscle.trim().toLowerCase();
      if (!name) return;

      if (!muscleScores[name]) {
        muscleScores[name] = { today: 0, '3day': 0, '7day': 0, lastUpdated: new Date() };
      }

      // Add reps to all time periods
      muscleScores[name].today += totalReps;
      muscleScores[name]['3day'] += totalReps;
      muscleScores[name]['7day'] += totalReps;
      muscleScores[name].lastUpdated = new Date();
    });
  };

  // Process target muscle(s)
  processMuscleString(exerciseDetails.target);

  // Process secondary muscles
  if (Array.isArray(exerciseDetails.secondaryMuscles)) {
    exerciseDetails.secondaryMuscles.forEach((sec) =>
      processMuscleString(sec)
    );
  } else if (typeof exerciseDetails.secondaryMuscles === 'string') {
    processMuscleString(exerciseDetails.secondaryMuscles);
  }

  return muscleScores;
}

/**
 * Centralized function to log an exercise
 * Handles all aspects of exercise logging in one place
 */
export async function logExercise(
  workoutData: WorkoutData,
  exerciseDetails: ExerciseDetails,
  userProfile: UserProfile,
  userId: string,
  timestamp: Date
): Promise<{
  exerciseLog: ExerciseLog;
  updatedProfile: UserProfile;
  totalXP: number;
}> {
  // Calculate XP
  const score = calculateExerciseScore(workoutData, exerciseDetails);
  
  // Update muscle scores
  const updatedMuscleScores = updateMuscleScores(
    workoutData,
    exerciseDetails,
    userProfile.muscleScores
  );
  
  // Update personal bests if this workout has sets
  let updatedProfile: UserProfile = { ...userProfile, muscleScores: updatedMuscleScores };
  if (workoutData.sets && workoutData.sets.length > 0) {
    const bestSet = workoutData.sets.reduce((best, set) => {
      const setValue = (Number(set.weight) || 0) * (1 + (Number(set.reps) || 0) / 30); // 1RM calculation
      const bestValue = (Number(best.weight) || 0) * (1 + (Number(best.reps) || 0) / 30);
      return setValue > bestValue ? set : best;
    }, workoutData.sets[0]);

    updatedProfile = updatePersonalBests(
      exerciseDetails.id,
      { weight: Number(bestSet.weight), reps: Number(bestSet.reps) },
      exerciseDetails,
      updatedProfile
    );
  }

  // Create exercise log
  const exerciseLog: ExerciseLog = {
    userId,
    exerciseId: exerciseDetails.id,
    timestamp,
    sets: workoutData.sets,
    duration: workoutData.duration,
    score,
  };

  return {
    exerciseLog,
    updatedProfile,
    totalXP: score,
  };
}

/**
 * Check if muscle scores need to be decayed based on lastUpdated timestamp
 */
export function needsMuscleScoreDecay(
  muscleScores: Record<string, { today: number; '3day': number; '7day': number; lastUpdated: Date }> | undefined
): boolean {
  if (!muscleScores) return false;
  
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Check if any muscle has a lastUpdated date from a different calendar day
  return Object.values(muscleScores).some(muscle => {
    const lastUpdated = new Date(muscle.lastUpdated);
    const lastUpdatedDate = new Date(lastUpdated.getFullYear(), lastUpdated.getMonth(), lastUpdated.getDate());
    return lastUpdatedDate.getTime() !== todayDate.getTime();
  });
} 