import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const NUTRITIONIX_APP_ID = '131fa0b3';
const NUTRITIONIX_API_KEY = '3733def5ca528b11d7fa11a41f23703b';

export default function FoodLibrary({ onNutritionixAdd }) {
  const [foodList, setFoodList] = useState([]);
  const [nutritionixQuery, setNutritionixQuery] = useState('');
  const [nutritionixLoading, setNutritionixLoading] = useState(false);
  const [nutritionixPreview, setNutritionixPreview] = useState(null);
  const [dbResults, setDbResults] = useState([]);

  useEffect(() => {
    const fetchFoodLibrary = async () => {
      const querySnapshot = await getDocs(collection(db, 'foods'));
      if (querySnapshot.empty) {
        const defaultFoods = [
          { label: "Whey protein 🥛", calories: 120, fat: 1, carbs: 3, protein: 25, fiber: 0 },
          { label: "Sautéed chicken", calories: 220, fat: 10, carbs: 0, protein: 26, fiber: 0 },
          { label: "3 Fried Eggs", calories: 255, fat: 18, carbs: 2, protein: 18, fiber: 0 }
        ];
        for (const food of defaultFoods) {
          await addDoc(collection(db, 'foods'), food);
        }
        setFoodList(defaultFoods);
      } else {
        const foods = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFoodList(foods);
      }
    };
    fetchFoodLibrary();
  }, []);

  // Predictive search from local database
  useEffect(() => {
    if (!nutritionixQuery) {
      setDbResults([]);
      return;
    }
    const matches = foodList.filter(food =>
      food.label && food.label.toLowerCase().includes(nutritionixQuery.toLowerCase())
    );
    setDbResults(matches.slice(0, 5));
  }, [nutritionixQuery, foodList]);

  // Use Nutritionix instant search for suggestions
  const fetchNutritionix = async (query) => {
    setNutritionixLoading(true);
    try {
      const response = await fetch('https://trackapi.nutritionix.com/v2/search/instant', {
        method: 'POST',
        headers: {
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      // Combine common and branded results, up to 5
      let results = [];
      if (data.common) results = results.concat(data.common);
      if (data.branded) results = results.concat(data.branded);
      results = results.slice(0, 5);
      // Map to a common format; nutrition will be fetched on demand
      const apiResults = results.map(item => ({
        label: item.food_name,
        brand_name: item.brand_name || null,
        photo: item.photo?.thumb || null,
        nix_item_id: item.nix_item_id || null,
        common_type: item.common_type || null,
        is_branded: !!item.nix_item_id,
        // nutrition: null for now; will fetch on demand
      }));
      setNutritionixPreview(apiResults);
      
      // Automatically save all search results to library
      console.log('Automatically saving all search results to library...');
      await saveAllSearchResults(apiResults);
      
    } catch (e) {
      alert(e.message || 'Failed to fetch from Nutritionix. Please try again.');
    } finally {
      setNutritionixLoading(false);
    }
  };

  // Helper to fetch nutrition info for a selected instant search result
  const fetchNutritionixItem = async (item) => {
    if (!item) return null;
    try {
      let data;
      // Branded items have a nix_item_id, common items do not.
      const isBranded = !!item.nix_item_id;

      if (isBranded) {
        // Branded item: use /v2/search/item to get full details
        const url = 'https://trackapi.nutritionix.com/v2/search/item';
        const headers = {
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
        };
        const response = await fetch(url + '?nix_item_id=' + item.nix_item_id, { headers });
        data = await response.json();
      } else {
        // Common food: use /v2/natural/nutrients
        const url = 'https://trackapi.nutritionix.com/v2/natural/nutrients';
        const headers = {
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
          'Content-Type': 'application/json'
        };
        const body = JSON.stringify({ query: item.food_name || item.label });
        const response = await fetch(url, { method: 'POST', headers, body });
        data = await response.json();
      }
      
      if (data.foods && data.foods.length > 0) {
        // Return the first food object which contains the full nutrition data
        return data.foods[0];
      }
    } catch (e) {
      alert(e.message || 'Failed to fetch nutrition info from Nutritionix.');
    }
    return null;
  };

  // Helper to slugify a string
  function slugify(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
  }

  // Helper to save Nutritionix result to library
  const saveNutritionixToLibrary = async (food) => {
    let foodId;
    const foodName = food.food_name || food.label; // Use label as a fallback

    if (food.nix_item_id) {
      foodId = `branded_${food.nix_item_id}`;
    } else if (food.ndb_no) {
      foodId = `usda_${food.ndb_no}`;
    } else if (foodName) {
      foodId = `common_${slugify(foodName)}`;
    } else {
      console.error('Cannot save food without a valid identifier:', food);
      return;
    }

    if (foodList.some(f => f.id === foodId)) {
      return; // Already in library
    }

    try {
      const foodToSave = {
        ...food,
        id: foodId,
        label: foodName,
        created_at: new Date().toISOString(),
        source: 'nutritionix'
      };
      await setDoc(doc(db, 'foods', foodId), foodToSave);
      setFoodList(currentFoodList => [...currentFoodList, foodToSave]);
    } catch (err) {
      console.error('Error saving food to Firestore:', err);
    }
  };

  // Helper to automatically save all search results to library
  const saveAllSearchResults = async (searchResults) => {
    console.log('Saving all search results to library:', searchResults);
    
    for (const item of searchResults) {
      try {
        // Fetch complete nutrition data for each item.
        const fullFoodObject = await fetchNutritionixItem(item);
        
        // Directly save the full object returned from the API.
        if (fullFoodObject) {
          await saveNutritionixToLibrary(fullFoodObject);
        }
      } catch (error) {
        console.error('Error saving search result:', item, error);
      }
    }
  };

  // Expose helpers as properties on the array
  const arr = [...foodList];
  arr.fetchNutritionix = fetchNutritionix;
  arr.nutritionixLoading = nutritionixLoading;
  arr.nutritionixQuery = nutritionixQuery;
  arr.setNutritionixQuery = setNutritionixQuery;
  arr.nutritionixPreview = nutritionixPreview;
  arr.setNutritionixPreview = setNutritionixPreview;
  arr.dbResults = dbResults;
  arr.setDbResults = setDbResults;
  arr.saveNutritionixToLibrary = saveNutritionixToLibrary;
  arr.saveAllSearchResults = saveAllSearchResults;
  arr.fetchNutritionixItem = fetchNutritionixItem;
  arr.handleSelectDbFood = (food) => {
    if (onNutritionixAdd) onNutritionixAdd(food);
  };
  return arr;
} 