import type { UserProfile, PersonalBests, PersonalBest, Exercise } from '../../types';

interface TimeRange {
  start: Date;
  end: Date;
}

interface TimeRanges {
  current: TimeRange;
  quarter: TimeRange;
  year: TimeRange;
  allTime: TimeRange;
}

interface ExerciseValue {
  value: number;
  type: '1rm' | 'reps' | 'duration' | 'pace' | 'unknown';
  unit: string;
}

interface ExerciseData {
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
}

const getTimeRanges = (): TimeRanges => {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  return {
    current: { start: oneMonthAgo, end: now },
    quarter: { start: threeMonthsAgo, end: now },
    year: { start: oneYearAgo, end: now },
    allTime: { start: new Date(0), end: now },
  };
};

const calculateExerciseValue = (
  exerciseData: ExerciseData, 
  exerciseDetails: Exercise
): ExerciseValue => {
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

const updatePersonalBests = (
  exerciseId: string,
  exerciseData: ExerciseData,
  exerciseDetails: Exercise,
  userProfile: UserProfile
): UserProfile => {
  const newValue = calculateExerciseValue(exerciseData, exerciseDetails);
  if (newValue.value === 0) return userProfile;

  const personalBests: PersonalBests = userProfile.personalBests || {};
  const exerciseBests: PersonalBests = personalBests[exerciseId] || {};

  const timeRanges = getTimeRanges();
  const now = new Date();
  let updated = false;

  // Update all-time best if this is better
  if (!exerciseBests.allTime || newValue.value > exerciseBests.allTime.value) {
    exerciseBests.allTime = { ...newValue, date: now } as PersonalBest;
    updated = true;
  }

  // Update year best if this is better
  if (!exerciseBests.year || newValue.value > exerciseBests.year.value) {
    exerciseBests.year = { ...newValue, date: now } as PersonalBest;
    updated = true;
  }

  // Update quarter best if this is better
  if (!exerciseBests.quarter || newValue.value > exerciseBests.quarter.value) {
    exerciseBests.quarter = { ...newValue, date: now } as PersonalBest;
    updated = true;
  }

  // Update current (month) best if this is better
  if (!exerciseBests.current || newValue.value > exerciseBests.current.value) {
    exerciseBests.current = { ...newValue, date: now } as PersonalBest;
    updated = true;
  }

  if (updated) {
    return {
      ...userProfile,
      personalBests: {
        ...personalBests,
        [exerciseId]: exerciseBests,
      },
    };
  }

  return userProfile;
};

const calculatePersonalBestBonus = (
  exerciseId: string,
  exerciseData: ExerciseData,
  exerciseDetails: Exercise,
  userProfile: UserProfile
): number => {
  const newValue = calculateExerciseValue(exerciseData, exerciseDetails);
  if (newValue.value === 0) return 0;

  const personalBests: PersonalBests = userProfile.personalBests || {};
  const exerciseBests: PersonalBests = personalBests[exerciseId] || {};

  let bonus = 0;

  // Check if this beats current best
  if (exerciseBests.current && newValue.value > exerciseBests.current.value) {
    bonus += 50; // beatsCurrentBest
  }

  // Check if this beats quarter best
  if (exerciseBests.quarter && newValue.value > exerciseBests.quarter.value) {
    bonus += 150; // beatsQuarterBest
  }

  // Check if this beats year best
  if (exerciseBests.year && newValue.value > exerciseBests.year.value) {
    bonus += 200; // beatsYearBest
  }

  // Check if this beats all-time best
  if (exerciseBests.allTime && newValue.value > exerciseBests.allTime.value) {
    bonus += 300; // beatsAllTimeBest
  }

  return bonus;
};

// Export all functions
export {
  calculateExerciseValue,
  calculatePersonalBestBonus,
  getTimeRanges,
  updatePersonalBests,
}; 