import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateLevelFromXP,
  calculateStreakBonuses,
  calculateTotalXPForLevel,
  calculateXPForLevel,
  recalculateTotalXPFromLogs,
  validateUserXP,
} from '../gamification/levelService';

describe('Level Service', () => {
  describe('calculateLevelFromXP', () => {
    it('should calculate correct level for given XP', () => {
      expect(calculateLevelFromXP(0).level).toBe(1);
      expect(calculateLevelFromXP(100).level).toBe(2);
      expect(calculateLevelFromXP(300).level).toBe(3);
      expect(calculateLevelFromXP(600).level).toBe(4);
      expect(calculateLevelFromXP(1000).level).toBe(5);
    });

    it('should handle decimal XP values', () => {
      expect(calculateLevelFromXP(50.5).level).toBe(1);
      expect(calculateLevelFromXP(150.7).level).toBe(2);
    });

    it('should handle very high XP values', () => {
      expect(calculateLevelFromXP(10000).level).toBe(14);
      expect(calculateLevelFromXP(50000).level).toBe(31);
    });
  });

  describe('calculateXPForLevel', () => {
    it('should calculate XP required for specific level', () => {
      expect(calculateXPForLevel(1)).toBe(0);
      expect(calculateXPForLevel(2)).toBe(100);
      expect(calculateXPForLevel(3)).toBe(300);
      expect(calculateXPForLevel(4)).toBe(600);
    });

    it('should handle invalid level inputs', () => {
      expect(calculateXPForLevel(0)).toBe(0);
      expect(calculateXPForLevel(-1)).toBe(0);
    });
  });

  describe('calculateTotalXPForLevel', () => {
    it('should calculate cumulative XP for level', () => {
      expect(calculateTotalXPForLevel(1)).toBe(0);
      expect(calculateTotalXPForLevel(2)).toBe(100);
      expect(calculateTotalXPForLevel(3)).toBe(400); // 100 + 300
      expect(calculateTotalXPForLevel(4)).toBe(1000); // 100 + 300 + 600
    });
  });

  describe('calculateStreakBonuses', () => {
    it('should calculate streak bonuses correctly', () => {
      const workoutLogs = [
        { timestamp: new Date('2024-01-01') },
        { timestamp: new Date('2024-01-02') },
        { timestamp: new Date('2024-01-03') },
        { timestamp: new Date('2024-01-05') }, // gap
        { timestamp: new Date('2024-01-06') },
        { timestamp: new Date('2024-01-07') },
      ];

      const result = calculateStreakBonuses(workoutLogs);

      expect(result.dailyStreak).toBeGreaterThan(0);
      expect(result.dailyBonus).toBeGreaterThanOrEqual(0);
      expect(result.weeklyStreak).toBeGreaterThanOrEqual(0);
      expect(result.weeklyBonus).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty workout logs', () => {
      const result = calculateStreakBonuses([]);
      expect(result.dailyStreak).toBe(0);
      expect(result.weeklyStreak).toBe(0);
      expect(result.dailyBonus).toBe(0);
      expect(result.weeklyBonus).toBe(0);
    });

    it('should handle single workout', () => {
      const result = calculateStreakBonuses([
        { timestamp: new Date('2024-01-01') },
      ]);
      expect(result.dailyStreak).toBe(1);
      expect(result.dailyBonus).toBe(0); // No bonus for single day
      expect(result.weeklyStreak).toBe(1);
      expect(result.weeklyBonus).toBe(0); // No bonus for single week
    });
  });

  describe('recalculateTotalXPFromLogs', () => {
    it('should sum XP from exercise and food logs', () => {
      const exerciseLogs = [{ score: 50 }, { score: 75 }, { score: 25 }];

      const foodLogs = [{ xp: 30 }, { xp: 45 }, { xp: 20 }];

      const result = recalculateTotalXPFromLogs(exerciseLogs, foodLogs);
      expect(result).toBe(245); // 50+75+25+30+45+20
    });

    it('should handle logs without XP/score', () => {
      const exerciseLogs = [
        { score: 50 },
        { duration: 30 }, // no score
        { score: 25 },
      ];

      const foodLogs = [
        { xp: 30 },
        { serving: 1 }, // no xp
        { xp: 20 },
      ];

      const result = recalculateTotalXPFromLogs(exerciseLogs, foodLogs);
      expect(result).toBe(125); // 50+25+30+20
    });

    it('should handle empty logs', () => {
      const result = recalculateTotalXPFromLogs([], []);
      expect(result).toBe(0);
    });
  });

  describe('validateUserXP', () => {
    it('should detect valid XP', () => {
      const userProfile = { totalXP: 150 };
      const exerciseLogs = [{ score: 100 }];
      const foodLogs = [{ xp: 50 }];

      const result = validateUserXP(userProfile, exerciseLogs, foodLogs);

      expect(result.isValid).toBe(true);
      expect(result.calculatedXP).toBe(150);
      expect(result.discrepancy).toBe(0);
    });

    it('should detect XP discrepancy', () => {
      const userProfile = { totalXP: 200 };
      const exerciseLogs = [{ score: 100 }];
      const foodLogs = [{ xp: 50 }];

      const result = validateUserXP(userProfile, exerciseLogs, foodLogs);

      expect(result.isValid).toBe(false);
      expect(result.calculatedXP).toBe(150);
      expect(result.discrepancy).toBe(50);
    });

    it('should handle missing user profile', () => {
      const exerciseLogs = [{ score: 100 }];
      const foodLogs = [{ xp: 50 }];

      const result = validateUserXP(null, exerciseLogs, foodLogs);

      expect(result.isValid).toBe(false);
      expect(result.calculatedXP).toBe(150);
      expect(result.storedXP).toBe(0);
    });

    it('should allow small rounding differences', () => {
      const userProfile = { totalXP: 150.1 };
      const exerciseLogs = [{ score: 100 }];
      const foodLogs = [{ xp: 50 }];

      const result = validateUserXP(userProfile, exerciseLogs, foodLogs);

      expect(result.isValid).toBe(true); // 0.1 difference is within tolerance
    });
  });
});
