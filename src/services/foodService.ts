import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Food, UserProfile } from '../types';

/**
 * A utility to create a URL-friendly "slug" from a string.
 * Used for generating consistent, readable document IDs.
 * @param str - The input string.
 * @returns The slugified string.
 */
function slugify(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

/**
 * Generates a unique and consistent ID for a food object.
 * Uses the NIX ID for branded, NDB number for USDA, or a slug of the name for common foods.
 * @param food - The food object.
 * @returns The generated ID, or null if no identifier can be found.
 */
export function generateFoodId(food: Partial<Food>): string | null {
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
 * @returns A promise that resolves to an array of food objects.
 */
export async function loadLocalFoods(): Promise<Food[]> {
  const querySnapshot = await getDocs(collection(db, 'foods'));
  console.log(
    '[loadLocalFoods] Loaded foods count:',
    querySnapshot.docs.length
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Food[];
}

/**
 * Saves a new food object to the 'foods' collection in Firestore.
 * It generates a unique ID and adds metadata before saving.
 * @param food - The full food object with nutrition data.
 * @returns A promise that resolves to the saved food object, including its new ID.
 */
export async function saveFoodToLibrary(food: Partial<Food>): Promise<Food> {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('[saveFoodToLibrary] No authenticated user found!');
  } else {
    console.log('[saveFoodToLibrary] Authenticated user:', currentUser);
  }
  const foodId = generateFoodId(food);
  if (!foodId) {
    console.error('Cannot save food without a valid identifier:', food);
    throw new Error('Cannot save food without a valid identifier.');
  }

  const foodToSave: Food = {
    ...food,
    id: foodId,
    label: food.food_name || food.label || '',
    created_at: new Date().toISOString(),
    source: 'nutritionix', // Or determine source based on data
  } as Food;

  console.log('Attempting to save food to Firestore:', foodToSave);
  try {
    await setDoc(doc(db, 'foods', foodId), foodToSave);
    console.log('Successfully saved to database as food id', foodId);
    console.log('Successfully saved food to Firestore:', foodToSave);
    return foodToSave;
  } catch (error) {
    console.error('Error saving food to Firestore:', error, foodToSave);
    throw error;
  }
}

// Example: Calculate total calories for a list of foods
export function calculateTotalCalories(foods: Food[]): number {
  return foods.reduce((total, food) => total + (food.calories || 0), 0);
}

// Example: Get favorite foods for a user
export function getFavoriteFoods(userProfile: UserProfile, allFoods: Food[]): Food[] {
  if (!userProfile.favoriteFoods) return [];
  return allFoods.filter(food => userProfile.favoriteFoods.includes(food.id));
} 