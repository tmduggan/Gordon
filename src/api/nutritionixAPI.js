// This function now acts as a client for our own Firebase Functions,
// which securely proxy the requests to the Nutritionix API.
const INSTANT_SEARCH_URL = 'https://nutritionixinstantsearch-llkdth3zaa-uc.a.run.app';
const FULL_NUTRITION_URL = 'https://nutritionixfullnutrition-llkdth3zaa-uc.a.run.app';
const NUTRIENTS_URL = 'https://us-central1-food-tracker-19c9d.cloudfunctions.net/nutritionixNutrients';

/**
 * Fetches a list of food suggestions from our secure Firebase Function proxy.
 * @param {string} query - The user's search query (e.g., "apple").
 * @returns {Promise<Array>} A promise that resolves to an array of simplified food objects.
 */
export async function fetchInstantResults(query) {
  try {
    const url = `${INSTANT_SEARCH_URL}?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const brandedResults = data.branded ? data.branded.slice(0, 4) : [];
    const commonResults = data.common ? data.common.slice(0, 4) : [];
    
    const results = [...brandedResults, ...commonResults];
    
    return results.map(item => ({
      food_name: item.food_name,
      brand_name: item.brand_name || null,
      photo: item.photo?.thumb || null,
      nix_item_id: item.nix_item_id || null,
      is_branded: !!item.nix_item_id,
    }));
  } catch (e) {
    console.error('Failed to fetch from the instant search proxy:', e);
    throw e;
  }
}

/**
 * Fetches the full nutritional details for a single food item via our secure proxy.
 * @param {object} item - A simplified food object from the instant search.
 * @returns {Promise<object|null>} A promise that resolves to the full food object with all nutrition data.
 */
export async function fetchFullNutrition(item) {
  if (!item) return null;
  try {
    let url;
    if (item.nix_item_id) {
        url = `${FULL_NUTRITION_URL}?nix_item_id=${item.nix_item_id}`;
    } else {
        url = `${FULL_NUTRITION_URL}?food_name=${encodeURIComponent(item.food_name)}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.foods && data.foods.length > 0) {
      return data.foods[0];
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch full nutrition from the proxy:', e);
    throw e;
  }
}

/**
 * Fetches nutrients data for natural language food queries via our secure proxy.
 * @param {string} query - The natural language query (e.g., "peanut butter, banana, and oatmeal").
 * @returns {Promise<Array>} A promise that resolves to an array of food objects with full nutrition data.
 */
export async function fetchNutrients(query) {
  try {
    const url = `${NUTRIENTS_URL}?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.foods && data.foods.length > 0) {
      return data.foods;
    }
    return [];
  } catch (e) {
    console.error('Failed to fetch nutrients from the proxy:', e);
    throw e;
  }
} 