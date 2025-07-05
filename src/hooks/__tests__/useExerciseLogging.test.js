import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useExerciseLogging from '../useExerciseLogging';

// Mock dependencies
vi.mock('../../store/useAuthStore', () => ({
  default: vi.fn(() => ({
    user: { uid: 'test-user-id' },
    userProfile: { totalXP: 100, muscleReps: {} },
    saveUserProfile: vi.fn(),
    addXP: vi.fn(),
  })),
}));

vi.mock('../../firebase/firestore/logExerciseEntry', () => ({
  saveWorkoutLog: vi.fn().mockResolvedValue('test-log-id'),
}));

vi.mock('../../services/gamification/exerciseScoringService', () => ({
  addWorkoutToMuscleReps: vi.fn().mockReturnValue({ chest: 50, triceps: 30 }),
}));

vi.mock('../../services/gamification/exerciseBestsService', () => ({
  updatePersonalBests: vi.fn().mockReturnValue({}),
}));

vi.mock('../../services/exercise/exerciseService', () => ({
  calculateExerciseScore: vi.fn().mockReturnValue(25),
}));

vi.mock('../useToast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('useExerciseLogging', () => {
  let mockExerciseLibrary;
  let mockExerciseHistory;
  let mockCart;
  let mockSearch;
  let mockDateTimePicker;

  beforeEach(() => {
    vi.clearAllMocks();

    mockExerciseLibrary = {
      items: [
        {
          id: 'bench-press',
          name: 'Bench Press',
          target: 'chest',
          secondaryMuscles: ['triceps'],
        },
      ],
    };

    mockExerciseHistory = {
      logs: [],
    };

    mockCart = {
      cart: [
        {
          id: 'bench-press',
          name: 'Bench Press',
        },
      ],
      addToCart: vi.fn(),
      clearCart: vi.fn(),
    };

    mockSearch = {
      clearSearch: vi.fn(),
    };

    mockDateTimePicker = {
      getLogTimestamp: vi.fn().mockReturnValue(new Date('2024-01-01T10:00:00')),
    };
  });

  describe('handleSelect', () => {
    it('should add exercise to cart and set initial log data', () => {
      const { result } = renderHook(() =>
        useExerciseLogging(
          mockExerciseLibrary,
          mockExerciseHistory,
          mockCart,
          mockSearch,
          mockDateTimePicker
        )
      );

      const exercise = {
        id: 'bench-press',
        name: 'Bench Press',
        category: 'strength',
      };

      act(() => {
        result.current.handleSelect(exercise);
      });

      expect(mockCart.addToCart).toHaveBeenCalledWith(exercise);
      expect(mockSearch.clearSearch).toHaveBeenCalled();
    });

    it('should set cardio log data for cardio exercises', () => {
      const { result } = renderHook(() =>
        useExerciseLogging(
          mockExerciseLibrary,
          mockExerciseHistory,
          mockCart,
          mockSearch,
          mockDateTimePicker
        )
      );

      const cardioExercise = {
        id: 'running',
        name: 'Running',
        category: 'cardio',
      };

      act(() => {
        result.current.handleSelect(cardioExercise);
      });

      expect(mockCart.addToCart).toHaveBeenCalledWith(cardioExercise);
    });

    it('should not call clearSearch if search is not provided', () => {
      const { result } = renderHook(() =>
        useExerciseLogging(
          mockExerciseLibrary,
          mockExerciseHistory,
          mockCart,
          null,
          mockDateTimePicker
        )
      );

      const exercise = {
        id: 'bench-press',
        name: 'Bench Press',
      };

      act(() => {
        result.current.handleSelect(exercise);
      });

      expect(mockCart.addToCart).toHaveBeenCalledWith(exercise);
      expect(mockSearch.clearSearch).not.toHaveBeenCalled();
    });
  });

  describe('logCart', () => {
    it('should log all exercises in cart successfully', async () => {
      const { result } = renderHook(() =>
        useExerciseLogging(
          mockExerciseLibrary,
          mockExerciseHistory,
          mockCart,
          mockSearch,
          mockDateTimePicker
        )
      );

      // Set up cart data
      act(() => {
        result.current.handleSelect({
          id: 'bench-press',
          name: 'Bench Press',
          category: 'strength',
        });
      });

      // Update log data
      act(() => {
        result.current.cartProps.onLogDataChange('bench-press', {
          sets: [
            { weight: 135, reps: 10 },
            { weight: 155, reps: 8 },
          ],
        });
      });

      await act(async () => {
        await result.current.logCart();
      });

      expect(mockCart.clearCart).toHaveBeenCalled();
    });

    it('should handle errors during logging', async () => {
      const { saveWorkoutLog } = await import(
        '../../firebase/firestore/logExerciseEntry'
      );
      saveWorkoutLog.mockRejectedValueOnce(new Error('Firebase error'));

      const { result } = renderHook(() =>
        useExerciseLogging(
          mockExerciseLibrary,
          mockExerciseHistory,
          mockCart,
          mockSearch,
          mockDateTimePicker
        )
      );

      // Set up cart data
      act(() => {
        result.current.handleSelect({
          id: 'bench-press',
          name: 'Bench Press',
        });
      });

      await act(async () => {
        await result.current.logCart();
      });

      // Should still clear cart even if there's an error
      expect(mockCart.clearCart).toHaveBeenCalled();
    });

    it('should calculate and add XP correctly', async () => {
      const mockAddXP = vi.fn();
      const { default: useAuthStore } = await import(
        '../../store/useAuthStore'
      );
      useAuthStore.mockReturnValue({
        user: { uid: 'test-user-id' },
        userProfile: { totalXP: 100, muscleReps: {} },
        saveUserProfile: vi.fn(),
        addXP: mockAddXP,
      });

      const { result } = renderHook(() =>
        useExerciseLogging(
          mockExerciseLibrary,
          mockExerciseHistory,
          mockCart,
          mockSearch,
          mockDateTimePicker
        )
      );

      // Set up cart data
      act(() => {
        result.current.handleSelect({
          id: 'bench-press',
          name: 'Bench Press',
        });
      });

      await act(async () => {
        await result.current.logCart();
      });

      expect(mockAddXP).toHaveBeenCalledWith(25); // score from calculateExerciseScore
    });
  });

  describe('cartProps', () => {
    it('should provide log data and change handler', () => {
      const { result } = renderHook(() =>
        useExerciseLogging(
          mockExerciseLibrary,
          mockExerciseHistory,
          mockCart,
          mockSearch,
          mockDateTimePicker
        )
      );

      expect(result.current.cartProps).toHaveProperty('logData');
      expect(result.current.cartProps).toHaveProperty('onLogDataChange');
      expect(typeof result.current.cartProps.onLogDataChange).toBe('function');
    });

    it('should update log data when onLogDataChange is called', () => {
      const { result } = renderHook(() =>
        useExerciseLogging(
          mockExerciseLibrary,
          mockExerciseHistory,
          mockCart,
          mockSearch,
          mockDateTimePicker
        )
      );

      const newLogData = {
        sets: [{ weight: 135, reps: 10 }],
      };

      act(() => {
        result.current.cartProps.onLogDataChange('bench-press', newLogData);
      });

      expect(result.current.cartProps.logData['bench-press']).toEqual(
        newLogData
      );
    });
  });
});
