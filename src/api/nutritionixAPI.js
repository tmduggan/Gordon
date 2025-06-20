const NUTRITIONIX_APP_ID = '131fa0b3';
const NUTRITIONIX_API_KEY = '3733def5ca528b11d7fa11a41f23703b';

/**
 * Fetches a list of food suggestions from the Nutritionix "instant search" endpoint.
 * @param {string} query - The user's search query (e.g., "apple").
 * @returns {Promise<Array>} A promise that resolves to an array of simplified food objects.
 */
export async function fetchInstantResults(query) {
  try {
    const response = await fetch(`https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}&branded=true&common=true`, {
      method: 'GET',
      headers: {
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_API_KEY,
      }
    });
    const data = await response.json();
    
    
    let results = [];
    if (data.branded) results = results.concat(data.branded);
    if (data.common) results = results.concat(data.common);
    
    // Take the top 10 combined results
    results = results.slice(0, 10);

    // Map to a common, simplified format for previews
    return results.map(item => ({
      food_name: item.food_name,
      brand_name: item.brand_name || null,
      photo: item.photo?.thumb || null,
      nix_item_id: item.nix_item_id || null, // For branded items
      is_branded: !!item.nix_item_id,
    }));
  } catch (e) {
    console.error('Failed to fetch from Nutritionix instant search:', e);
    throw e;
  }
}

/**
 * Fetches the full nutritional details for a single food item.
 * @param {object} item - A simplified food object from the instant search.
 * @returns {Promise<object|null>} A promise that resolves to the full food object with all nutrition data.
 */
export async function fetchFullNutrition(item) {
  if (!item) return null;
  try {
    let data;
    const isBranded = !!item.nix_item_id;

    if (isBranded) {
      const response = await fetch(`https://trackapi.nutritionix.com/v2/search/item?nix_item_id=${item.nix_item_id}`, {
        headers: {
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
        }
      });
      data = await response.json();
    } else {
      const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
        method: 'POST',
        headers: {
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: item.food_name })
      });
      data = await response.json();
    }
    
    if (data.foods && data.foods.length > 0) {
      return data.foods[0]; // The first item in the array has the full data
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch full nutrition from Nutritionix:', e);
    throw e;
  }
} 