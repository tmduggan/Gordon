import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export default function FoodLibrary() {
  const [foodList, setFoodList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return [];
  }

  if (error) {
    console.error('FoodLibrary error:', error);
    return [];
  }

  return foodList;
} 