import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateFoodBaseXP,
  calculateFoodGroupMultiplier,
  calculateFoodXP,
  calculateDailyFoodXP,
} from '../gamification/foodScoringService';

describe('Food Scoring Service', () => {
  describe('calculateFoodBaseXP', () => {
    it('should calculate base XP from calories', () => {
      const food = {
        nutritionix_data: { nf_calories: 200 },
      };

      const result = calculateFoodBaseXP(food, 1);
      expect(result).toBe(400); // 200 calories * 2 = 400 XP
    });

    it('should handle different serving sizes', () => {
      const food = {
        nutritionix_data: { nf_calories: 100 },
      };

      const result = calculateFoodBaseXP(food, 2.5);
      expect(result).toBe(500); // 100 * 2.5 * 2 = 500 XP
    });

    it('should handle missing nutrition data', () => {
      const food = {};

      const result = calculateFoodBaseXP(food, 1);
      expect(result).toBe(0); // No calories = 0 XP
    });

    it('should use fallback calories field', () => {
      const food = {
        calories: 150,
      };

      const result = calculateFoodBaseXP(food, 1);
      expect(result).toBe(300); // 150 * 2 = 300 XP
    });
  });

  describe('calculateFoodGroupMultiplier', () => {
    it('should return 1.0 for unknown food groups', () => {
      const food = {
        food_group: 'unknown',
      };

      const result = calculateFoodGroupMultiplier(food);
      expect(result).toBe(1.0);
    });

    it('should return 1.0 for protein foods', () => {
      const food = {
        food_group: 'Protein Foods',
      };

      const result = calculateFoodGroupMultiplier(food);
      expect(result).toBe(1.0);
    });

    it('should return 1.0 for vegetables', () => {
      const food = {
        food_group: 'Vegetables',
      };

      const result = calculateFoodGroupMultiplier(food);
      expect(result).toBe(1.0);
    });

    it('should handle missing food group', () => {
      const food = {};

      const result = calculateFoodGroupMultiplier(food);
      expect(result).toBe(1.0);
    });
  });

  describe('calculateFoodXP', () => {
    it('should calculate total XP with multiplier', () => {
      const food = {
        nutritionix_data: { nf_calories: 200 },
        food_group: 'Protein Foods',
      };

      const result = calculateFoodXP(food, 1);
      expect(result).toBe(400); // 200 * 2 * 1.0 = 400 XP
    });

    it('should handle default serving size', () => {
      const food = {
        nutritionix_data: { nf_calories: 100 },
      };

      const result = calculateFoodXP(food);
      expect(result).toBe(200); // 100 * 2 * 1.0 = 200 XP
    });

    it('should round the result', () => {
      const food = {
        nutritionix_data: { nf_calories: 75 },
        food_group: 'Vegetables',
      };

      const result = calculateFoodXP(food, 1);
      expect(result).toBe(150); // 75 * 2 * 1.0 = 150 XP
    });
  });

  describe('calculateDailyFoodXP', () => {
    const mockGetFoodById = (id: string) => {
      const foods: any = {
        chicken: {
          id: 'chicken',
          food_name: 'Chicken Breast',
          nutritionix_data: { nf_calories: 200, tags: { food_group: 2 } },
        },
        broccoli: {
          id: 'broccoli',
          food_name: 'Broccoli',
          nutritionix_data: { nf_calories: 50, tags: { food_group: 4 } },
        },
        rice: {
          id: 'rice',
          food_name: 'Rice',
          nutritionix_data: { nf_calories: 150, tags: { food_group: 5 } },
        },
      };
      return foods[id];
    };

    const mockGoals = {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 60,
    };

    it('should calculate total daily XP from food logs', () => {
      const logs = [
        { foodId: 'chicken', serving: 1 },
        { foodId: 'broccoli', serving: 2 },
        { foodId: 'rice', serving: 1 },
      ];

      const result = calculateDailyFoodXP(logs, mockGetFoodById, mockGoals);

      // Chicken: 200 * 2 * 1.0 = 400
      // Broccoli: 50 * 2 * 2 * 1.0 = 200
      // Rice: 150 * 2 * 1.0 = 300
      // Unique food bonus: 3 * 5 = 15
      // Macro goal bonus: 100 (all macros in range)
      // Total: 400 + 200 + 300 + 15 + 100 = 1015
      expect(result.totalXP).toBe(1015);
    });

    it('should include breakdown of XP sources', () => {
      const logs = [{ foodId: 'chicken', serving: 1 }];

      const result = calculateDailyFoodXP(logs, mockGetFoodById, mockGoals);

      expect(result.breakdown).toHaveProperty('baseXP');
      expect(result.breakdown).toHaveProperty('foodGroupBonus');
      expect(result.breakdown).toHaveProperty('uniqueFoodBonus');
      expect(result.breakdown).toHaveProperty('macroGoalBonus');
      expect(result.breakdown).toHaveProperty('micronutrientBonus');
    });

    it('should handle empty logs', () => {
      const logs: any[] = [];

      const result = calculateDailyFoodXP(logs, mockGetFoodById, mockGoals);

      expect(result.totalXP).toBe(0);
      expect(result.breakdown.baseXP).toBe(0);
    });

    it('should handle missing food data', () => {
      const logs = [{ foodId: 'unknown', serving: 1 }];

      const result = calculateDailyFoodXP(logs, mockGetFoodById, mockGoals);

      expect(result.totalXP).toBe(0);
    });
  });
}); 