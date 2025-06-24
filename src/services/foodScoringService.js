// Food scoring service for unified XP system
// Implements scoring based on food groups, unique foods, macro goals, and micronutrients

// Food group multipliers based on nutritional value
const FOOD_GROUP_MULTIPLIERS = {
  3: 1.5, // Fruits - high value
  4: 1.5, // Vegetables - high value  
  7: 1.5, // Legumes & Nuts/Seeds - high value
  1: 1.0, // Dairy - standard
  2: 1.0, // Animal products - standard
  5: 1.0, // Grains - standard
  6: 1.0, // Fats & Oils - standard
  8: 1.0, // Prepared/Composite foods - standard
  9: 1.0, // Catch-all/Misc/Spices/Other - standard
  0: 1.0, // Catch-all/Other/Unclassified - standard
  // No food group (branded foods) = 1.0
};

// Micronutrient tracking - FDA Daily Values for adults/children 4+
const MICRONUTRIENT_ATTRS = [
  { attr_id: 301, label: 'Calcium', unit: 'mg', rdv: 1300 },
  { attr_id: 303, label: 'Iron', unit: 'mg', rdv: 18 },
  { attr_id: 306, label: 'Potassium', unit: 'mg', rdv: 4700 },
  { attr_id: 401, label: 'Vitamin C', unit: 'mg', rdv: 90 },
  { attr_id: 328, label: 'Vitamin D', unit: 'IU', rdv: 800 },
  { attr_id: 324, label: 'Vitamin D', unit: 'mcg', rdv: 20 },
  { attr_id: 430, label: 'Vitamin K', unit: 'mcg', rdv: 120 },
  { attr_id: 418, label: 'Vitamin B12', unit: 'mcg', rdv: 2.4 },
  { attr_id: 404, label: 'Thiamin (B1)', unit: 'mg', rdv: 1.2 },
  { attr_id: 405, label: 'Riboflavin (B2)', unit: 'mg', rdv: 1.3 },
  { attr_id: 406, label: 'Niacin (B3)', unit: 'mg', rdv: 16 },
  { attr_id: 415, label: 'Vitamin B6', unit: 'mg', rdv: 1.7 },
  { attr_id: 417, label: 'Folate (B9)', unit: 'mcg', rdv: 400 },
  { attr_id: 320, label: 'Vitamin A', unit: 'IU', rdv: 5000 },
  { attr_id: 318, label: 'Vitamin A', unit: 'IU', rdv: 5000 },
  { attr_id: 851, label: 'Vitamin A (RAE)', unit: 'mcg', rdv: 900 },
  { attr_id: 573, label: 'Retinol', unit: 'mcg', rdv: undefined },
  { attr_id: 578, label: 'Vitamin E', unit: 'mg', rdv: 15 },
  { attr_id: 309, label: 'Zinc', unit: 'mg', rdv: 11 },
  { attr_id: 312, label: 'Copper', unit: 'mg', rdv: 0.9 },
  { attr_id: 315, label: 'Manganese', unit: 'mg', rdv: 2.3 },
  { attr_id: 317, label: 'Selenium', unit: 'mcg', rdv: 55 },
  { attr_id: 421, label: 'Choline', unit: 'mg', rdv: 550 },
];

// Helper to get nutrient value from full_nutrients by attr_id
function getNutrientValue(full_nutrients, attr_id) {
  const found = full_nutrients?.find(n => n.attr_id === attr_id);
  return found ? found.value : 0;
}

// Helper to get food group from food item
function getFoodGroup(food) {
  const data = food.nutritionix_data || food.nutrition || food;
  return data.tags?.food_group || null;
}

// Helper to get unique food identifier for bonus tracking
function getUniqueFoodId(food) {
  const data = food.nutritionix_data || food.nutrition || food;
  const foodGroup = getFoodGroup(food);
  const foodName = food.food_name || food.label || '';
  
  // For branded foods (no food group), use the food name
  if (!foodGroup) {
    return foodName.toLowerCase().trim();
  }
  
  // For foods with food groups, use group + name for uniqueness
  return `${foodGroup}_${foodName.toLowerCase().trim()}`;
}

/**
 * Calculate base XP for a food item
 * @param {object} food - The food item
 * @param {number} serving - The serving size
 * @returns {number} Base XP points
 */
export function calculateFoodBaseXP(food, serving = 1) {
  const data = food.nutritionix_data || food.nutrition || food;
  const calories = (data.nf_calories || data.calories || 0) * serving;
  
  // Base scale: 2 points per calorie
  return Math.round(calories * 2);
}

/**
 * Calculate food group multiplier bonus
 * @param {object} food - The food item
 * @returns {number} Multiplier bonus (1.0 = no bonus, 1.5 = 50% bonus)
 */
export function calculateFoodGroupMultiplier(food) {
  const foodGroup = getFoodGroup(food);
  return FOOD_GROUP_MULTIPLIERS[foodGroup] || 1.0;
}

/**
 * Calculate daily totals for macros and micronutrients
 * @param {Array} logs - Array of food logs for the day
 * @param {Function} getFoodById - Function to get food details by ID
 * @returns {object} Daily totals
 */
export function calculateDailyTotals(logs, getFoodById) {
  const totals = {
    calories: 0,
    fat: 0,
    carbs: 0,
    protein: 0,
    fiber: 0,
    micronutrients: {}
  };
  
  logs.forEach(log => {
    const food = getFoodById(log.foodId);
    if (food) {
      const data = food.nutritionix_data || food.nutrition || food;
      const serving = log.serving || 1;
      
      // Add macros
      totals.calories += (data.nf_calories || data.calories || 0) * serving;
      totals.fat += (data.nf_total_fat || data.fat || 0) * serving;
      totals.carbs += (data.nf_total_carbohydrate || data.carbs || 0) * serving;
      totals.protein += (data.nf_protein || data.protein || 0) * serving;
      totals.fiber += (data.nf_dietary_fiber || data.fiber || 0) * serving;
      
      // Add micronutrients
      const full_nutrients = data.full_nutrients || [];
      MICRONUTRIENT_ATTRS.forEach(({ attr_id, label }) => {
        const value = getNutrientValue(full_nutrients, attr_id) * serving;
        if (value > 0) {
          totals.micronutrients[label] = (totals.micronutrients[label] || 0) + value;
        }
      });
    }
  });
  
  return totals;
}

/**
 * Calculate macro goal bonuses
 * @param {object} totals - Daily totals
 * @param {object} goals - User's daily goals
 * @returns {number} Macro goal bonus points
 */
export function calculateMacroGoalBonus(totals, goals) {
  let bonus = 0;
  
  // Check each macro for 80-120% range
  const macros = ['calories', 'protein', 'carbs', 'fat'];
  macros.forEach(macro => {
    const total = totals[macro] || 0;
    const goal = goals[macro] || 0;
    
    if (goal > 0) {
      const percentage = (total / goal) * 100;
      
      // Bonus for hitting 80-120% range
      if (percentage >= 80 && percentage <= 120) {
        bonus += 50;
        
        // Extra bonus for hitting exactly 100%
        if (percentage >= 100 && percentage <= 100) {
          bonus += 50; // Total 100 points for hitting 100%
        }
      }
    }
  });
  
  // Bonus for hitting all macros in range
  const allMacrosInRange = macros.every(macro => {
    const total = totals[macro] || 0;
    const goal = goals[macro] || 0;
    if (goal === 0) return true;
    const percentage = (total / goal) * 100;
    return percentage >= 80 && percentage <= 120;
  });
  
  if (allMacrosInRange) {
    bonus += 500;
  }
  
  return bonus;
}

/**
 * Calculate micronutrient bonuses
 * @param {object} totals - Daily totals including micronutrients
 * @returns {number} Micronutrient bonus points
 */
export function calculateMicronutrientBonus(totals) {
  let bonus = 0;
  let micronutrientsHit = 0;
  
  MICRONUTRIENT_ATTRS.forEach(({ attr_id, label, rdv }) => {
    const value = totals.micronutrients[label] || 0;
    
    if (rdv && value >= rdv) {
      bonus += 10; // +10 points per micronutrient hitting 100%
      micronutrientsHit++;
    }
  });
  
  // Bonus for hitting multiple micronutrients
  if (micronutrientsHit >= 5) {
    bonus += 100;
  }
  
  return bonus;
}

/**
 * Calculate unique food bonus
 * @param {Array} logs - Array of food logs for the day
 * @param {Function} getFoodById - Function to get food details by ID
 * @returns {number} Unique food bonus points
 */
export function calculateUniqueFoodBonus(logs, getFoodById) {
  const uniqueFoods = new Set();
  
  logs.forEach(log => {
    const food = getFoodById(log.foodId);
    if (food) {
      const uniqueId = getUniqueFoodId(food);
      uniqueFoods.add(uniqueId);
    }
  });
  
  // +5 points per unique food
  return uniqueFoods.size * 5;
}

/**
 * Calculate total XP for a single food item
 * @param {object} food - The food item
 * @param {number} serving - The serving size
 * @returns {number} Total XP for this food item
 */
export function calculateFoodXP(food, serving = 1) {
  const baseXP = calculateFoodBaseXP(food, serving);
  const multiplier = calculateFoodGroupMultiplier(food);
  
  return Math.round(baseXP * multiplier);
}

/**
 * Calculate total daily food XP including all bonuses
 * @param {Array} logs - Array of food logs for the day
 * @param {Function} getFoodById - Function to get food details by ID
 * @param {object} goals - User's daily goals
 * @returns {object} XP breakdown
 */
export function calculateDailyFoodXP(logs, getFoodById, goals) {
  let totalXP = 0;
  let baseXP = 0;
  let foodGroupBonus = 0;
  let uniqueFoodBonus = 0;
  let macroGoalBonus = 0;
  let micronutrientBonus = 0;
  
  // Calculate base XP and food group bonuses
  logs.forEach(log => {
    const food = getFoodById(log.foodId);
    if (food) {
      const itemBaseXP = calculateFoodBaseXP(food, log.serving);
      const multiplier = calculateFoodGroupMultiplier(food);
      
      baseXP += itemBaseXP;
      foodGroupBonus += Math.round(itemBaseXP * (multiplier - 1));
    }
  });
  
  // Calculate other bonuses
  uniqueFoodBonus = calculateUniqueFoodBonus(logs, getFoodById);
  
  const totals = calculateDailyTotals(logs, getFoodById);
  macroGoalBonus = calculateMacroGoalBonus(totals, goals);
  micronutrientBonus = calculateMicronutrientBonus(totals);
  
  totalXP = baseXP + foodGroupBonus + uniqueFoodBonus + macroGoalBonus + micronutrientBonus;
  
  return {
    totalXP,
    breakdown: {
      baseXP,
      foodGroupBonus,
      uniqueFoodBonus,
      macroGoalBonus,
      micronutrientBonus
    },
    totals
  };
} 