import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveWorkoutLog } from '../firestore/logExerciseEntry';

// Mock Firebase
vi.mock('firebase/firestore');
vi.mock('../../firebase', () => ({
  db: {},
}));

describe('Exercise Logging Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addDoc.mockResolvedValue({ id: 'test-log-id' });
    collection.mockReturnValue('mock-collection-ref');
    serverTimestamp.mockReturnValue(new Date('2024-01-01'));
  });

  describe('saveWorkoutLog', () => {
    it('should save workout log successfully', async () => {
      const mockLogObject = {
        userId: 'test-user-id',
        exerciseId: 'bench-press',
        timestamp: new Date('2024-01-01T10:00:00'),
        sets: [
          { weight: 135, reps: 10 },
          { weight: 155, reps: 8 },
        ],
        score: 50,
      };

      const result = await saveWorkoutLog(mockLogObject);

      expect(addDoc).toHaveBeenCalledWith('mock-collection-ref', {
        ...mockLogObject,
        recordedTime: new Date('2024-01-01'),
      });
      expect(result).toBe('test-log-id');
    });

    it('should throw error when userId is missing', async () => {
      const mockLogObject = {
        exerciseId: 'bench-press',
        timestamp: new Date('2024-01-01T10:00:00'),
        sets: [{ weight: 135, reps: 10 }],
        score: 50,
      };

      await expect(saveWorkoutLog(mockLogObject)).rejects.toThrow(
        'User ID is required to save a workout log.'
      );
    });

    it('should handle cardio exercises with duration', async () => {
      const mockLogObject = {
        userId: 'test-user-id',
        exerciseId: 'running',
        timestamp: new Date('2024-01-01T10:00:00'),
        duration: 30,
        score: 25,
      };

      await saveWorkoutLog(mockLogObject);

      expect(addDoc).toHaveBeenCalledWith('mock-collection-ref', {
        ...mockLogObject,
        recordedTime: new Date('2024-01-01'),
      });
    });

    it('should handle Firebase errors', async () => {
      const mockLogObject = {
        userId: 'test-user-id',
        exerciseId: 'bench-press',
        timestamp: new Date('2024-01-01T10:00:00'),
        sets: [{ weight: 135, reps: 10 }],
        score: 50,
      };

      addDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(saveWorkoutLog(mockLogObject)).rejects.toThrow(
        'Firebase error'
      );
    });

    it('should call collection with correct path', async () => {
      const mockLogObject = {
        userId: 'test-user-id',
        exerciseId: 'bench-press',
        timestamp: new Date('2024-01-01T10:00:00'),
        sets: [{ weight: 135, reps: 10 }],
        score: 50,
      };

      await saveWorkoutLog(mockLogObject);

      expect(collection).toHaveBeenCalledWith(
        {},
        'users',
        'test-user-id',
        'workoutLog'
      );
    });
  });
}); 