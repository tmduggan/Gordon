// Helper to extract standardized macronutrient info from a food object.
// This is the single source of truth for interpreting nutrition data.
export const getFoodMacros = (food) => {
    if (!food) {
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

// Helper to slugify a string for generating consistent document IDs.
export function slugify(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
} 