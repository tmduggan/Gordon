import { beforeEach, describe, expect, it } from 'vitest';
import {
  addWorkoutToMuscleReps,
  calculatePersonalBestBonus,
  getMuscleRepsForPeriod,
} from '../gamification/exerciseScoringService';

describe('Exercise Scoring Service', () => {
  let mockMuscleReps;
  let mockExerciseDetails;
  let mockWorkoutData;

  beforeEach(() => {
    mockMuscleReps = {
      chest: 50,
      triceps: 30,
    };

    mockExerciseDetails = {
      id: 'bench-press',
      target: 'chest',
      secondaryMuscles: ['triceps', 'shoulders'],
    };

    mockWorkoutData = {
      sets: [
        { weight: 135, reps: 10 },
        { weight: 155, reps: 8 },
        { weight: 175, reps: 6 },
      ],
    };
  });

  describe('addWorkoutToMuscleReps', () => {
    it('should add reps to target muscle', () => {
      const result = addWorkoutToMuscleReps(
        mockWorkoutData,
        mockExerciseDetails,
        mockMuscleReps
      );

      expect(result.chest).toBe(74); // 50 + 24 (10+8+6)
      expect(result.triceps).toBe(54); // 30 + 24
      expect(result.shoulders).toBe(24); // 0 + 24
    });

    it('should handle single rep value', () => {
      const workoutWithReps = { reps: 15 };
      const result = addWorkoutToMuscleReps(
        workoutWithReps,
        mockExerciseDetails,
        mockMuscleReps
      );

      expect(result.chest).toBe(65); // 50 + 15
      expect(result.triceps).toBe(45); // 30 + 15
    });

    it('should handle empty muscle reps', () => {
      const result = addWorkoutToMuscleReps(
        mockWorkoutData,
        mockExerciseDetails,
        {}
      );

      expect(result.chest).toBe(24);
      expect(result.triceps).toBe(24);
      expect(result.shoulders).toBe(24);
    });

    it('should handle array of secondary muscles', () => {
      const exerciseWithArray = {
        ...mockExerciseDetails,
        secondaryMuscles: ['triceps', 'shoulders'],
      };

      const result = addWorkoutToMuscleReps(
        mockWorkoutData,
        exerciseWithArray,
        mockMuscleReps
      );

      expect(result.triceps).toBe(54);
      expect(result.shoulders).toBe(24);
    });

    it('should handle no sets or reps', () => {
      const emptyWorkout = {};
      const result = addWorkoutToMuscleReps(
        emptyWorkout,
        mockExerciseDetails,
        mockMuscleReps
      );

      expect(result.chest).toBe(50); // unchanged
      expect(result.triceps).toBe(30); // unchanged
    });
  });

  describe('getMuscleRepsForPeriod', () => {
    const mockWorkoutHistory = [
      {
        exerciseId: 'bench-press',
        timestamp: new Date('2024-01-15'),
        sets: [{ weight: 135, reps: 10 }],
      },
      {
        exerciseId: 'bench-press',
        timestamp: new Date('2024-01-10'),
        sets: [{ weight: 125, reps: 12 }],
      },
    ];

    const mockExerciseLibrary = [
      {
        id: 'bench-press',
        target: 'chest',
        secondaryMuscles: ['triceps'],
      },
    ];

    it('should calculate reps for specific time period', () => {
      const result = getMuscleRepsForPeriod(
        mockWorkoutHistory,
        mockExerciseLibrary,
        'chest',
        '7day',
        new Date('2024-01-15')
      );

      expect(result).toBe(22); // 10 + 12
    });

    it('should filter by time period correctly', () => {
      const result = getMuscleRepsForPeriod(
        mockWorkoutHistory,
        mockExerciseLibrary,
        'chest',
        '3day',
        new Date('2024-01-15')
      );

      expect(result).toBe(10); // only the most recent workout
    });

    it('should handle lifetime period', () => {
      const result = getMuscleRepsForPeriod(
        mockWorkoutHistory,
        mockExerciseLibrary,
        'chest',
        'lifetime',
        new Date('2024-01-15')
      );

      expect(result).toBe(22); // all workouts
    });

    it('should handle missing exercise in library', () => {
      const result = getMuscleRepsForPeriod(
        mockWorkoutHistory,
        [],
        'chest',
        '7day',
        new Date('2024-01-15')
      );

      expect(result).toBe(0);
    });
  });

  describe('calculatePersonalBestBonus', () => {
    const mockUserProfile = {
      personalBests: {
        'bench-press': {
          allTime: { reps: 12, weight: 155 },
          year: { reps: 10, weight: 145 },
          month: { reps: 8, weight: 135 },
          week: { reps: 6, weight: 125 },
        },
      },
    };

    it('should return 4 for all-time best', () => {
      const workoutWithRecord = {
        sets: [{ weight: 155, reps: 15 }],
      };

      const result = calculatePersonalBestBonus(
        workoutWithRecord,
        mockExerciseDetails,
        mockUserProfile
      );
      expect(result).toBe(4);
    });

    it('should return 3 for year best', () => {
      const workoutWithRecord = {
        sets: [{ weight: 145, reps: 12 }],
      };

      const result = calculatePersonalBestBonus(
        workoutWithRecord,
        mockExerciseDetails,
        mockUserProfile
      );
      expect(result).toBe(3);
    });

    it('should return 1 for week best improvement', () => {
      const workoutNoRecord = {
        sets: [{ weight: 135, reps: 8 }],
      };

      const result = calculatePersonalBestBonus(
        workoutNoRecord,
        mockExerciseDetails,
        mockUserProfile
      );
      expect(result).toBe(1);
    });

    it('should handle missing personal bests', () => {
      const result = calculatePersonalBestBonus(
        mockWorkoutData,
        mockExerciseDetails,
        {}
      );
      expect(result).toBe(0);
    });

    it('should handle workout without sets', () => {
      const workoutNoSets = { duration: 30 };
      const result = calculatePersonalBestBonus(
        workoutNoSets,
        mockExerciseDetails,
        mockUserProfile
      );
      expect(result).toBe(0);
    });
  });
});
