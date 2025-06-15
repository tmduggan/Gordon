import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
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
    } catch (e) {
      alert(e.message || 'Failed to fetch from Nutritionix. Please try again.');
    } finally {
      setNutritionixLoading(false);
    }
  };

  // Helper to fetch nutrition info for a selected instant search result
  const fetchNutritionixItem = async (item) => {
    if (!item) return null;
    let nutrition = null;
    try {
      let data;
      if (item.is_branded && item.nix_item_id) {
        // Branded item: use /v2/search/item
        const response = await fetch('https://trackapi.nutritionix.com/v2/search/item', {
          method: 'POST',
          headers: {
            'x-app-id': NUTRITIONIX_APP_ID,
            'x-app-key': NUTRITIONIX_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nix_item_id: item.nix_item_id })
        });
        data = await response.json();
        if (data.foods && data.foods.length > 0) {
          const food = data.foods[0];
          nutrition = {
            calories: Math.round(food.nf_calories) || 0,
            fat: Math.round(food.nf_total_fat * 10) / 10 || 0,
            carbs: Math.round(food.nf_total_carbohydrate * 10) / 10 || 0,
            protein: Math.round(food.nf_protein * 10) / 10 || 0,
            fiber: Math.round(food.nf_dietary_fiber * 10) / 10 || 0,
            sodium: Math.round((food.nf_sodium || 0) * 10) / 10,
            potassium: Math.round((food.nf_potassium || 0) * 10) / 10,
            vitamin_c: food.nf_vitamin_c || 0,
            vitamin_b6: food.nf_vitamin_b6 || 0,
            iron: food.nf_iron || 0
          };
        }
      } else {
        // Common food: use /v2/natural/nutrients for a single food
        const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
          method: 'POST',
          headers: {
            'x-app-id': NUTRITIONIX_APP_ID,
            'x-app-key': NUTRITIONIX_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: item.label })
        });
        data = await response.json();
        if (data.foods && data.foods.length > 0) {
          const food = data.foods[0];
          nutrition = {
            calories: Math.round(food.nf_calories) || 0,
            fat: Math.round(food.nf_total_fat * 10) / 10 || 0,
            carbs: Math.round(food.nf_total_carbohydrate * 10) / 10 || 0,
            protein: Math.round(food.nf_protein * 10) / 10 || 0,
            fiber: Math.round(food.nf_dietary_fiber * 10) / 10 || 0,
            sodium: Math.round((food.nf_sodium || 0) * 10) / 10,
            potassium: Math.round((food.nf_potassium || 0) * 10) / 10,
            vitamin_c: food.nf_vitamin_c || 0,
            vitamin_b6: food.nf_vitamin_b6 || 0,
            iron: food.nf_iron || 0
          };
        }
      }
    } catch (e) {
      // Optionally handle error
    }
    return nutrition;
  };

  // Helper to save Nutritionix result to library
  const saveNutritionixToLibrary = async (food) => {
    if (!food || !food.label) return;
    const foodId = (food.id || food.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32));
    // Check if already in foodList
    if (foodList.some(f => f.id === foodId)) return;
    try {
      await addDoc(collection(db, 'foods'), { ...food, id: foodId });
      setFoodList([...foodList, { ...food, id: foodId }]);
    } catch (err) {
      // fallback: try setDoc if addDoc fails (e.g. duplicate)
      // Optionally handle error
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
  arr.fetchNutritionixItem = fetchNutritionixItem;
  return arr;
} 