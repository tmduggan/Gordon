// Helper to extract standardized macronutrient info from a food object.
// This is the single source of truth for interpreting nutrition data.
export const getFoodMacros = (food) => {
    if (!food) {
        return { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 };
    }

    // If this is a recipe, return its totalMacros if present
    if (food.isRecipe) {
        if (food.totalMacros) {
            return food.totalMacros;
        }
        // fallback: return zeros if missing
        return { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 };
    }

    // This function is now robust enough to handle any food data structure
    // in the database, whether it's the newest format, an older nested
    // format, or the original default food format.
    const data = food.nutritionix_data || food.nutrition || food;

    return {
        calories: Math.round(data.nf_calories || data.calories || 0),
        fat: Math.round(data.nf_total_fat || data.fat || 0),
        carbs: Math.round(data.nf_total_carbohydrate || data.carbs || 0),
        protein: Math.round(data.nf_protein || data.protein || 0),
        fiber: Math.round(data.nf_dietary_fiber || data.fiber || 0),
    };
};

// Utility: Convert any (qty, unit) pair to grams for a given food
export function convertToGrams(food, qty, unit) {
    if (!food) return 0;
    const servingWeightGrams = food.serving_weight_grams || 1;
    // If unit is grams, return qty directly
    if (unit === 'g') {
        return qty;
    }
    // If unit is the base serving unit
    if (unit === food.serving_unit) {
        return (servingWeightGrams / (food.serving_qty || 1)) * qty;
    }
    // If alt_measures exist, try to find the matching measure
    if (food.alt_measures) {
        const alt = food.alt_measures.find(m => m.measure === unit);
        if (alt) {
            return (alt.serving_weight / alt.qty) * qty;
        }
    }
    // Fallback: treat as base unit
    return (servingWeightGrams / (food.serving_qty || 1)) * qty;
}

// Helper to calculate initial scaled nutrition for cart items
// This replicates the logic from ServingSizeEditor for initial values
export const getInitialScaledNutrition = (food) => {
    if (!food) {
        return { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 };
    }

    // Use the same initial values as ServingSizeEditor
    const quantity = food.serving_qty || 1;
    const unit = food.serving_unit || 'g';
    const servingWeightGrams = food.serving_weight_grams || 1;
    const macros = food.nutritionix_data || food.nutrition || food;

    // Calculate macros per gram
    const macrosPerGram = {
        calories: (macros.nf_calories || macros.calories || 0) / servingWeightGrams,
        fat: (macros.nf_total_fat || macros.fat || 0) / servingWeightGrams,
        carbs: (macros.nf_total_carbohydrate || macros.carbs || 0) / servingWeightGrams,
        protein: (macros.nf_protein || macros.protein || 0) / servingWeightGrams,
        fiber: (macros.nf_dietary_fiber || macros.fiber || 0) / servingWeightGrams,
    };

    // Use the new utility for grams
    const grams = convertToGrams(food, quantity, unit);

    // Calculate scaled nutrition
    const safe = v => (isFinite(v) && !isNaN(v)) ? Math.round(v * 100) / 100 : 0;
    
    return {
        calories: safe(macrosPerGram.calories * grams),
        fat: safe(macrosPerGram.fat * grams),
        carbs: safe(macrosPerGram.carbs * grams),
        protein: safe(macrosPerGram.protein * grams),
        fiber: safe(macrosPerGram.fiber * grams),
    };
};

// Helper to slugify a string for generating consistent document IDs.
export function slugify(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
}

// Default equipment for each category
export const DEFAULT_EQUIPMENT = {
  gym: ["barbell", "dumbbell"],
  bodyweight: ["body weight"],
  cardio: []
};

// Ensures availableEquipment is always a valid, non-empty object
export function ensureAvailableEquipment(equipment) {
  return {
    gym: Array.isArray(equipment?.gym) && equipment.gym.length > 0 ? equipment.gym : [...DEFAULT_EQUIPMENT.gym],
    bodyweight: Array.isArray(equipment?.bodyweight) && equipment.bodyweight.length > 0 ? equipment.bodyweight : [...DEFAULT_EQUIPMENT.bodyweight],
    cardio: Array.isArray(equipment?.cardio) && equipment.cardio.length > 0 ? equipment.cardio : [...DEFAULT_EQUIPMENT.cardio],
  };
}

// Returns the most recent log timestamp for a given exerciseId, or null if none exist
export function getLastTrainedDate(logs, exerciseId) {
  if (!Array.isArray(logs) || !exerciseId) return null;
  const filtered = logs.filter(l => String(l.exerciseId) === String(exerciseId));
  if (filtered.length === 0) return null;
  return filtered.reduce((latest, l) => {
    const lTime = l.timestamp?.seconds ? l.timestamp.seconds : new Date(l.timestamp).getTime() / 1000;
    if (!latest) return l;
    const latestTime = latest.timestamp?.seconds ? latest.timestamp.seconds : new Date(latest.timestamp).getTime() / 1000;
    return lTime > latestTime ? l : latest;
  }, null)?.timestamp || null;
}

// Milestones for weekly progress
export const STRENGTH_REP_MILESTONES = [10, 20, 50, 80, 120, 150, 180, 210, 360, 420];
export const CARDIO_MIN_MILESTONES = [5, 10, 20, 40, 60, 90, 120, 240, 360, 480];

// Returns the start of the current week (Monday)
export function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get total strength reps for the current week
export function getWeeklyStrengthReps(logs) {
  const startOfWeek = getStartOfWeek();
  return logs.filter(l => l.timestamp && new Date(l.timestamp.seconds ? l.timestamp.seconds * 1000 : l.timestamp) >= startOfWeek && Array.isArray(l.sets) && l.sets.length > 0)
    .reduce((sum, l) => sum + l.sets.reduce((s, set) => {
      const r = parseInt(set.reps);
      return s + (isNaN(r) ? 0 : r);
    }, 0), 0);
}

// Get total cardio minutes for the current week
export function getWeeklyCardioMinutes(logs) {
  const startOfWeek = getStartOfWeek();
  return logs.filter(l => l.timestamp && new Date(l.timestamp.seconds ? l.timestamp.seconds * 1000 : l.timestamp) >= startOfWeek && l.duration && (!l.sets || l.sets.length === 0))
    .reduce((sum, l) => {
      const mins = parseInt(l.duration);
      return sum + (isNaN(mins) ? 0 : mins);
    }, 0);
}

// Get current milestone tier and progress for a value and milestone array
export function getMilestoneProgress(value, milestones) {
  let tier = 0;
  while (tier < milestones.length && value >= milestones[tier]) tier++;
  const prev = tier === 0 ? 0 : milestones[tier - 1];
  const next = milestones[tier] || milestones[milestones.length - 1];
  const progress = Math.min(100, ((value - prev) / (next - prev)) * 100);
  return { tier, prev, next, progress };
}

// Greek prestige symbols (lowercase)
const GREEK_LETTERS = [
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'
];

/**
 * Returns prestige tier info for milestone progress with Greek symbols.
 * @param {number} value - The current value (reps or minutes)
 * @param {number[]} milestones - The base milestone array
 * @param {number} baseIncrement - The increment after the last milestone
 * @returns {object} { prestigeSymbol, prestigeIndex, baseTier, prev, next, progress, tier, displayTier }
 */
export function getPrestigeMilestoneProgress(value, milestones, baseIncrement) {
  let tier = 0;
  while (tier < milestones.length && value >= milestones[tier]) tier++;

  // After base milestones, use consistent increment
  let prestigeIndex = 0;
  let baseTier = tier + 1; // 1-based for display
  let prev, next;

  if (tier < milestones.length) {
    prev = tier === 0 ? 0 : milestones[tier - 1];
    next = milestones[tier];
    prestigeIndex = 0;
    baseTier = tier + 1;
  } else {
    // Calculate prestige tier
    const extra = value - milestones[milestones.length - 1];
    const extraTier = Math.floor(extra / baseIncrement) + 1;
    prestigeIndex = Math.floor((extraTier - 1) / 10) + 1; // 1-based prestige
    baseTier = ((extraTier - 1) % 10) + 1;
    prev = milestones[milestones.length - 1] + (extraTier - 1) * baseIncrement;
    next = prev + baseIncrement;
  }

  const progress = Math.min(100, ((value - prev) / (next - prev)) * 100);
  const prestigeSymbol = prestigeIndex > 0 ? GREEK_LETTERS[(prestigeIndex - 1) % GREEK_LETTERS.length] : '';
  const displayTier = prestigeIndex > 0 ? `${prestigeSymbol}-${baseTier}` : `${baseTier}`;

  return {
    prestigeSymbol,
    prestigeIndex,
    baseTier,
    prev,
    next,
    progress,
    tier,
    displayTier
  };
} 