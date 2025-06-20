import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * A utility to create a URL-friendly "slug" from a string.
 * Used for generating consistent, readable document IDs.
 * @param {string} str - The input string.
 * @returns {string} The slugified string.
 */
function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
}

/**
 * Generates a unique and consistent ID for a food object.
 * Uses the NIX ID for branded, NDB number for USDA, or a slug of the name for common foods.
 * @param {object} food - The food object.
 * @returns {string|null} The generated ID, or null if no identifier can be found.
 */
export function generateFoodId(food) {
  const foodName = food.food_name || food.label;
  if (food.nix_item_id) {
    return `branded_${food.nix_item_id}`;
  }
  if (food.ndb_no) {
    return `usda_${food.ndb_no}`;
  }
  if (foodName) {
    return `common_${slugify(foodName)}`;
  }
  return null;
}

/**
 * Loads all food documents from the 'foods' collection in Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of food objects.
 */
export async function loadLocalFoods() {
  const querySnapshot = await getDocs(collection(db, 'foods'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Saves a new food object to the 'foods' collection in Firestore.
 * It generates a unique ID and adds metadata before saving.
 * @param {object} food - The full food object with nutrition data.
 * @returns {Promise<object>} A promise that resolves to the saved food object, including its new ID.
 */
export async function saveFoodToLibrary(food) {
  const foodId = generateFoodId(food);
  if (!foodId) {
    throw new Error('Cannot save food without a valid identifier.');
  }

  const foodToSave = {
    ...food,
    id: foodId,
    label: food.food_name || food.label,
    created_at: new Date().toISOString(),
    source: 'nutritionix' // Or determine source based on data
  };
  
  await setDoc(doc(db, 'foods', foodId), foodToSave);
  return foodToSave;
} 