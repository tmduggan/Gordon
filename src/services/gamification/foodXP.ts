// Food XP and nutrition bonus logic

export const FOOD_XP_CONFIG = {
  baseMultiplier: 2,
  foodGroupMultipliers: {
    3: 1.5, 4: 1.5, 7: 1.5, 1: 1.0, 2: 1.0, 5: 1.0, 6: 1.0, 8: 1.0, 9: 1.0, 0: 1.0,
  },
} as const;

export function calculateFoodXP(food: any, serving: number = 1, units?: string): number {
  // If the food object already has a .calories property, use it directly (already scaled)
  if (typeof food.calories === 'number' && !isNaN(food.calories)) {
    return Math.round(food.calories * FOOD_XP_CONFIG.baseMultiplier);
  }
  const data = food.nutritionix_data || food.nutrition || food;
  const servingWeightGrams = food.serving_weight_grams || 1;
  const grams = 1; // TODO: use convertToGrams util
  const caloriesPerGram = (data.nf_calories || data.calories || 0) / servingWeightGrams;
  const calories = caloriesPerGram * grams;
  return Math.round(calories * FOOD_XP_CONFIG.baseMultiplier);
}

export function calculateFoodGroupMultiplier(food: any): number {
  const foodGroup = food.tags?.food_group || 0;
  return FOOD_XP_CONFIG.foodGroupMultipliers[foodGroup] || 1.0;
} 