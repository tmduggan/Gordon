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

    // Convert to grams (same logic as ServingSizeEditor)
    let grams = 0;
    if (unit === 'g') {
        grams = quantity;
    } else if (unit === food.serving_unit) {
        // For base unit, use the serving_weight_grams directly
        grams = (servingWeightGrams / (food.serving_qty || 1)) * quantity;
    } else {
        // Check alt_measures
        if (food.alt_measures) {
            const alt = food.alt_measures.find(m => m.measure === unit);
            if (alt) {
                grams = (alt.serving_weight / alt.qty) * quantity;
            } else {
                // Fallback: treat as base unit
                grams = (servingWeightGrams / (food.serving_qty || 1)) * quantity;
            }
        } else {
            // Fallback: treat as base unit
            grams = (servingWeightGrams / (food.serving_qty || 1)) * quantity;
        }
    }

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