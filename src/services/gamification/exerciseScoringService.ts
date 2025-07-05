// Simplified Exercise Scoring Service
// Handles muscle rep tracking and basic personal best bonuses

import type { 
  WorkoutData, 
  ExerciseDetails, 
  UserProfile, 
  WorkoutLog, 
  ExerciseLibraryItem,
  MuscleReps,
  PersonalBests,
  TimePeriod,
  Exercise,
  ExerciseLog
} from '../../types';

/**
 * Process muscle string and add reps to muscle tracking
 */
const processMuscleString = (
  muscleString: string | undefined, 
  reps: number, 
  muscleReps: MuscleReps
): void => {
  if (!muscleString) return;

  muscleString.split(',').forEach((muscle) => {
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
 */
export function addWorkoutToMuscleReps(
  workoutData: WorkoutData,
  exerciseDetails: ExerciseDetails,
  existingMuscleReps: MuscleReps = {}
): MuscleReps {
  const muscleReps = { ...existingMuscleReps };

  // Calculate total reps from all sets
  let totalReps = 0;
  if (workoutData.sets && workoutData.sets.length > 0) {
    totalReps = workoutData.sets.reduce(
      (sum, set) => sum + (parseInt(set.reps) || 0),
      0
    );
  } else if (workoutData.reps) {
    totalReps = parseInt(workoutData.reps) || 0;
  }

  // Process target muscle(s)
  processMuscleString(exerciseDetails.target, totalReps, muscleReps);

  // Process secondary muscles
  if (Array.isArray(exerciseDetails.secondaryMuscles)) {
    exerciseDetails.secondaryMuscles.forEach((sec) =>
      processMuscleString(sec, totalReps, muscleReps)
    );
  } else if (typeof exerciseDetails.secondaryMuscles === 'string') {
    processMuscleString(
      exerciseDetails.secondaryMuscles,
      totalReps,
      muscleReps
    );
  }

  return muscleReps;
}

/**
 * Get muscle reps for a specific time period by filtering workout history
 */
export function getMuscleRepsForPeriod(
  workoutHistory: WorkoutLog[] = [],
  exerciseLibrary: ExerciseLibraryItem[] = [],
  muscle: string,
  timePeriod: TimePeriod = 'lifetime',
  referenceDate: Date = new Date()
): number {
  const muscleName = muscle.toLowerCase().trim();
  let totalReps = 0;

  // Calculate cutoff date based on time period
  let cutoffDate = new Date(0); // Beginning of time for lifetime
  if (timePeriod !== 'lifetime') {
    const days: Record<string, number> = {
      today: 0,
      '3day': 3,
      '7day': 7,
      '14day': 14,
      '30day': 30,
    };
    if (days[timePeriod] !== undefined) {
      cutoffDate = new Date(
        referenceDate.getTime() - days[timePeriod] * 24 * 60 * 60 * 1000
      );
    }
  }

  // Filter and sum reps
  workoutHistory.forEach((log) => {
    const logDate = new Date(
      log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp
    );
    if (logDate >= cutoffDate) {
      const exercise = exerciseLibrary.find((e) => e.id === log.exerciseId);
      if (!exercise) return;

      // Calculate total reps from all sets
      let exerciseReps = 0;
      if (log.sets && log.sets.length > 0) {
        exerciseReps = log.sets.reduce(
          (sum, set) => sum + (parseInt(set.reps) || 0),
          0
        );
      } else if (log.reps) {
        exerciseReps = parseInt(log.reps) || 0;
      }

      // Check if this exercise targets the muscle
      const targetMuscles = exercise.target
        ? exercise.target.split(',').map((m) => m.trim().toLowerCase())
        : [];
      const secondaryMuscles = exercise.secondaryMuscles
        ? Array.isArray(exercise.secondaryMuscles)
          ? exercise.secondaryMuscles.flatMap((m) =>
              m.split(',').map((s) => s.trim().toLowerCase())
            )
          : exercise.secondaryMuscles
              .split(',')
              .map((m) => m.trim().toLowerCase())
        : [];

      const allMuscles = [...targetMuscles, ...secondaryMuscles];
      if (allMuscles.includes(muscleName)) {
        totalReps += exerciseReps;
      }
    }
  });

  return totalReps;
}

/**
 * Calculate a simple personal best bonus for muscle volume
 */
export function calculatePersonalBestBonus(
  workoutData: WorkoutData,
  exerciseDetails: ExerciseDetails,
  userProfile: UserProfile
): number {
  if (
    !userProfile?.personalBests ||
    !workoutData.sets ||
    workoutData.sets.length === 0
  ) {
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
  if (personalBests.allTime && currentReps > personalBests.allTime.reps)
    return 4;
  if (personalBests.year && currentReps > personalBests.year.reps) return 3;
  if (personalBests.month && currentReps > personalBests.month.reps) return 2;
  if (personalBests.week && currentReps > personalBests.week.reps) return 1;

  return 0;
}

// Example: Calculate XP for a single exercise log
export function calculateExerciseXP(
  log: ExerciseLog,
  exercise: Exercise,
  userProfile: UserProfile
): number {
  // XP calculation logic (placeholder)
  let baseXP = 100;
  if (exercise.difficulty === 'advanced') baseXP += 50;
  if (log.reps) baseXP += log.reps * 2;
  if (userProfile.isPremium) baseXP *= 1.1;
  return Math.round(baseXP);
}

// Example: Calculate total XP for a workout
export function calculateWorkoutXP(
  logs: ExerciseLog[],
  exercises: Exercise[],
  userProfile: UserProfile
): number {
  return logs.reduce((total, log) => {
    const exercise = exercises.find((ex) => ex.id === log.exerciseId);
    if (!exercise) return total;
    return total + calculateExerciseXP(log, exercise, userProfile);
  }, 0);
} 