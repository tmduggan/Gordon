import { collection, getDocs } from 'firebase/firestore';
import {
  fetchFullNutrition,
  fetchInstantResults,
} from '../../api/nutritionixAPI';
import { db } from '../../firebase';
import {
  generateFoodId,
  loadLocalFoods,
  saveFoodToLibrary,
} from '../foodService';

/**
 * Load exercise library from Firestore
 * @returns {Promise<Array>} Array of exercise objects
 */
export async function loadExerciseLibrary() {
  try {
    const querySnapshot = await getDocs(collection(db, 'exerciseLibrary'));
    const exercises = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Deduplicate exercises by ID to prevent duplicate key warnings
    const uniqueExercises = exercises.reduce((acc, exercise) => {
      if (!acc.find((ex) => ex.id === exercise.id)) {
        acc.push(exercise);
      } else {
        console.warn(
          `Duplicate exercise found with ID ${exercise.id}: ${exercise.name}`
        );
      }
      return acc;
    }, []);

    console.log(
      `✅ Loaded ${uniqueExercises.length} exercises from local library (${exercises.length - uniqueExercises.length} duplicates removed)`
    );
    return uniqueExercises;
  } catch (error) {
    console.error('❌ Error loading exercise library:', error);
    throw error;
  }
}

/**
 * Load food library from local storage
 * @returns {Promise<Array>} Array of food objects
 */
export async function loadFoodLibrary() {
  try {
    return await loadLocalFoods();
  } catch (error) {
    console.error('❌ Error loading food library:', error);
    throw error;
  }
}

/**
 * Search exercises in local library
 * @param {Array} items - Exercise items array
 * @param {string} searchQuery - Search query
 * @returns {Array} Filtered exercise results
 */
export function searchExercises(items, searchQuery) {
  if (!searchQuery.trim()) {
    return [];
  }

  const searchTerm = searchQuery.toLowerCase();
  return items.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.target.toLowerCase().includes(searchTerm) ||
      exercise.bodyPart.toLowerCase().includes(searchTerm) ||
      exercise.equipment.toLowerCase().includes(searchTerm) ||
      exercise.category.toLowerCase().includes(searchTerm) ||
      (exercise.secondaryMuscles &&
        exercise.secondaryMuscles.some((muscle) =>
          muscle.toLowerCase().includes(searchTerm)
        ))
  );
}

/**
 * Fetch and save food item to library
 * @param {Object} item - Food item to save
 * @param {Array} existingItems - Current food items to check for duplicates
 * @returns {Promise<Object|null>} Saved food item or null if already exists
 */
export async function fetchAndSaveFood(item, existingItems = []) {
  console.log('[fetchAndSaveFood] Called with:', item);

  try {
    const potentialId = generateFoodId(item);
    if (!potentialId || existingItems.some((f) => f.id === potentialId)) {
      console.log('[fetchAndSaveFood] Skipping: Already exists or invalid ID', {
        potentialId,
        item,
      });
      return null;
    }

    console.log(
      '[fetchAndSaveFood] About to call fetchFullNutrition with:',
      item
    );
    const fullDetails = await fetchFullNutrition(item);
    console.log('[fetchAndSaveFood] fetchFullNutrition returned:', fullDetails);

    if (fullDetails) {
      console.log('[fetchAndSaveFood] Full nutrition details:', fullDetails);
      const savedFood = await saveFoodToLibrary(fullDetails);
      console.log('[fetchAndSaveFood] Saved food:', savedFood);
      return savedFood;
    }

    console.warn(
      '[fetchAndSaveFood] No full nutrition details returned for:',
      item
    );
    return null;
  } catch (error) {
    console.error(
      '[fetchAndSaveFood] Failed to fetch and save food item:',
      error,
      item
    );
    return null;
  }
}

/**
 * Search Nutritionix API for food items
 * @param {string} searchQuery - Search query
 * @param {Array} existingItems - Current food items to check for duplicates
 * @returns {Promise<Array>} Search results from Nutritionix
 */
export async function searchNutritionix(searchQuery, existingItems = []) {
  try {
    console.log('[searchNutritionix] Searching Nutritionix for:', searchQuery);
    const results = await fetchInstantResults(searchQuery);

    const newBranded = results
      .filter((item) => item.is_branded)
      .filter(
        (item) => !existingItems.some((f) => f.id === generateFoodId(item))
      )
      .slice(0, 4);

    const newCommon = results
      .filter((item) => !item.is_branded)
      .filter(
        (item) => !existingItems.some((f) => f.id === generateFoodId(item))
      )
      .slice(0, 4);

    const itemsToSave = [...newBranded, ...newCommon];
    console.log('[searchNutritionix] Items to save:', itemsToSave);

    // Save items and wait for all to complete
    await Promise.all(
      itemsToSave.map((item) => fetchAndSaveFood(item, existingItems))
    );

    return results;
  } catch (error) {
    console.error('[searchNutritionix] Failed to search Nutritionix:', error);
    return [];
  }
}

/**
 * Prepare exercise for cart selection
 * @param {Object} exercise - Exercise object
 * @returns {Object} Exercise formatted for cart
 */
export function prepareExerciseForCart(exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.category || 'strength',
    muscleGroup: exercise.target,
    bodyPart: exercise.bodyPart,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    instructions: exercise.instructions,
    description: exercise.description,
    gifUrl: exercise.gifUrl,
    secondaryMuscles: exercise.secondaryMuscles,
  };
}
