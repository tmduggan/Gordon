import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logFoodEntry } from '../firestore/logFoodEntry';

// Mock Firebase
vi.mock('firebase/firestore');
vi.mock('../../firebase', () => ({
  db: {},
}));

// Mock food scoring service
vi.mock('../../services/gamification/foodScoringService', () => ({
  calculateFoodXP: vi.fn().mockReturnValue(25),
}));

describe('Food Logging Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addDoc.mockResolvedValue({ id: 'test-food-log-id' });
    collection.mockReturnValue('mock-collection-ref');
    serverTimestamp.mockReturnValue(new Date('2024-01-01'));
  });

  describe('logFoodEntry', () => {
    it('should log food entry successfully', async () => {
      const mockFood = {
        id: 'chicken-breast',
        name: 'Chicken Breast',
        units: 'oz',
      };

      const mockUser = {
        uid: 'test-user-id',
      };

      const serving = 6;
      const timestamp = new Date('2024-01-01T12:00:00');

      const result = await logFoodEntry(mockFood, mockUser, serving, timestamp);

      expect(addDoc).toHaveBeenCalledWith('mock-collection-ref', {
        foodId: 'chicken-breast',
        timestamp: timestamp,
        serving: 6,
        units: 'oz',
        userId: 'test-user-id',
        recordedTime: new Date('2024-01-01'),
        xp: 25,
      });
      expect(result).toEqual({
        id: 'test-food-log-id',
        foodId: 'chicken-breast',
        timestamp: timestamp,
        serving: 6,
        units: 'oz',
        userId: 'test-user-id',
        recordedTime: new Date('2024-01-01'),
        xp: 25,
      });
    });

    it('should use default serving size when not provided', async () => {
      const mockFood = {
        id: 'apple',
        name: 'Apple',
      };

      const mockUser = {
        uid: 'test-user-id',
      };

      const timestamp = new Date('2024-01-01T12:00:00');

      await logFoodEntry(mockFood, mockUser, null, timestamp);

      expect(addDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({
          serving: 1,
        })
      );
    });

    it('should use default units when not provided', async () => {
      const mockFood = {
        id: 'banana',
        name: 'Banana',
      };

      const mockUser = {
        uid: 'test-user-id',
      };

      const timestamp = new Date('2024-01-01T12:00:00');

      await logFoodEntry(mockFood, mockUser, 1, timestamp);

      expect(addDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({
          units: 'serving',
        })
      );
    });

    it('should use serving_unit when available', async () => {
      const mockFood = {
        id: 'milk',
        name: 'Milk',
        serving_unit: 'cup',
      };

      const mockUser = {
        uid: 'test-user-id',
      };

      const timestamp = new Date('2024-01-01T12:00:00');

      await logFoodEntry(mockFood, mockUser, 1, timestamp);

      expect(addDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({
          units: 'cup',
        })
      );
    });

    it('should throw error when user is missing', async () => {
      const mockFood = {
        id: 'chicken-breast',
        name: 'Chicken Breast',
      };

      const timestamp = new Date('2024-01-01T12:00:00');

      await expect(logFoodEntry(mockFood, null, 1, timestamp)).rejects.toThrow(
        'User and Food ID must be provided to log an entry.'
      );
    });

    it('should throw error when food ID is missing', async () => {
      const mockFood = {
        name: 'Chicken Breast',
      };

      const mockUser = {
        uid: 'test-user-id',
      };

      const timestamp = new Date('2024-01-01T12:00:00');

      await expect(
        logFoodEntry(mockFood, mockUser, 1, timestamp)
      ).rejects.toThrow('User and Food ID must be provided to log an entry.');
    });

    it('should handle Firebase errors', async () => {
      const mockFood = {
        id: 'chicken-breast',
        name: 'Chicken Breast',
      };

      const mockUser = {
        uid: 'test-user-id',
      };

      const timestamp = new Date('2024-01-01T12:00:00');

      addDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(
        logFoodEntry(mockFood, mockUser, 1, timestamp)
      ).rejects.toThrow('Firebase error');
    });

    it('should call collection with correct path', async () => {
      const mockFood = {
        id: 'chicken-breast',
        name: 'Chicken Breast',
      };

      const mockUser = {
        uid: 'test-user-id',
      };

      const timestamp = new Date('2024-01-01T12:00:00');

      await logFoodEntry(mockFood, mockUser, 1, timestamp);

      expect(collection).toHaveBeenCalledWith(
        {},
        'users',
        'test-user-id',
        'foodLog'
      );
    });
  });
}); 