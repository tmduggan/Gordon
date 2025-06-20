import { useState, useEffect } from 'react';
import { fetchInstantResults, fetchFullNutrition } from '../api/nutritionixAPI';
import { loadLocalFoods, saveFoodToLibrary, generateFoodId } from '../services/foodService';

export default function useFoodLibrary() {
  const [foods, setFoods] = useState([]);
  const [apiResults, setApiResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial food list from Firestore on mount
  useEffect(() => {
    async function loadFoods() {
      try {
        const localFoods = await loadLocalFoods();
        setFoods(localFoods);
      } catch (error) {
        console.error("Failed to load food library:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFoods();
  }, []);

  // Function to get full details for a preview item and save it to the library
  const fetchAndSave = async (item) => {
    try {
      // First, generate a potential ID from the preview item and check for existence.
      const potentialId = generateFoodId(item);
      if (!potentialId || foods.some(f => f.id === potentialId)) {
        // If it already exists, don't waste an API call.
        return null;
      }

      // If it's a new item, proceed to fetch its full details.
      const fullDetails = await fetchFullNutrition(item);
      if (fullDetails) {
        // The service will generate the final ID and save the food.
        const savedFood = await saveFoodToLibrary(fullDetails);
        setFoods(currentFoods => [...currentFoods, savedFood]);
        return savedFood;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch and save item:", error);
      return null;
    }
  };

  // Function to search the Nutritionix API and automatically save results
  const searchNutritionix = async (query) => {
    try {
      const results = await fetchInstantResults(query);
      setApiResults(results);

      // In the background, fetch full details for each result and save to library
      results.forEach(item => fetchAndSave(item));
      
      return results;
    } catch (error) {
      console.error("Failed to search Nutritionix:", error);
      setApiResults([]);
      return [];
    }
  };
  
  return {
    foods,
    apiResults,
    loading,
    searchNutritionix,
    fetchAndSave,
  };
} 