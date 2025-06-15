import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const NUTRITIONIX_APP_ID = '131fa0b3';
const NUTRITIONIX_API_KEY = '3733def5ca528b11d7fa11a41f23703b';

export default function FoodLibrary({ onNutritionixAdd }) {
  const [foodList, setFoodList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nutritionixQuery, setNutritionixQuery] = useState('');
  const [nutritionixLoading, setNutritionixLoading] = useState(false);
  const [nutritionixPreview, setNutritionixPreview] = useState(null);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    const fetchFoodLibrary = async () => {
      try {
        console.log('Fetching food library...');
        const querySnapshot = await getDocs(collection(db, 'foods'));
        console.log('Query snapshot:', querySnapshot);
        
        if (querySnapshot.empty) {
          console.log('No food items found in the database');
          // Initialize with default food items if the collection is empty
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
          console.log('Fetched foods:', foods);
          setFoodList(foods);
        }
      } catch (error) {
        console.error("Error fetching food library:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodLibrary();
  }, []);

  const addFood = async (food) => {
    try {
      const docRef = await addDoc(collection(db, 'foods'), food);
      setFoodList([...foodList, { id: docRef.id, ...food }]);
    } catch (error) {
      console.error("Error adding food:", error);
      setError(error.message);
    }
  };

  const deleteFood = async (id) => {
    try {
      await deleteDoc(doc(db, 'foods', id));
      setFoodList(foodList.filter(food => food.id !== id));
    } catch (error) {
      console.error("Error deleting food:", error);
      setError(error.message);
    }
  };

  // Nutritionix fetcher (add to cart and save to Firestore if not exists)
  const fetchNutritionix = async (query) => {
    setNutritionixLoading(true);
    setNoResults(false);
    try {
      console.log('Searching Nutritionix for:', query);
      const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
        method: 'POST',
        headers: {
          'x-app-id': '131fa0b3',
          'x-app-key': '3733def5ca528b11d7fa11a41f23703b',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      console.log('Nutritionix response status:', response.status);
      const data = await response.json();
      console.log('Nutritionix response data:', data);

      if (!data.foods || data.foods.length === 0) {
        setNoResults(true);
        throw new Error('No foods found matching your query');
      }

      const food = data.foods[0];
      // Map Nutritionix response to new food structure
      const nutrition = {
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
      const foodObj = {
        label: food.food_name,
        default_serving: {
          label: `${food.serving_qty} ${food.serving_unit}`,
          grams: food.serving_weight_grams || 0
        },
        base_unit: 'g',
        base_amount: 100,
        nutrition,
        tags: food.tags || []
      };
      setNutritionixPreview(foodObj);
    } catch (e) {
      console.error('Nutritionix error:', e);
      // Only alert if not a "no results" case
      if (!noResults) {
        alert(e.message || 'Failed to fetch from Nutritionix. Please try again.');
      }
    } finally {
      setNutritionixLoading(false);
    }
  };

  const confirmNutritionixAdd = () => {
    if (nutritionixPreview && onNutritionixAdd) {
      onNutritionixAdd(nutritionixPreview);
      setNutritionixPreview(null);
      setNutritionixQuery('');
    }
  };

  const cancelNutritionixAdd = () => {
    setNutritionixPreview(null);
    setNutritionixQuery('');
  };

  if (loading) {
    return [];
  }

  if (error) {
    console.error('FoodLibrary error:', error);
    return [];
  }

  // Return foodList as before, but also expose Nutritionix helpers for the custom food form
  foodList.fetchNutritionix = fetchNutritionix;
  foodList.nutritionixLoading = nutritionixLoading;
  foodList.nutritionixQuery = nutritionixQuery;
  foodList.setNutritionixQuery = setNutritionixQuery;
  foodList.nutritionixPreview = nutritionixPreview;
  foodList.setNutritionixPreview = setNutritionixPreview;
  foodList.confirmNutritionixAdd = confirmNutritionixAdd;
  foodList.cancelNutritionixAdd = cancelNutritionixAdd;
  return foodList;
} 