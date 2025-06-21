import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchInstantResults, fetchFullNutrition } from '../api/nutritionixAPI';
import { loadLocalFoods, saveFoodToLibrary, generateFoodId } from '../services/foodService';

export default function useLibrary(libraryType, options = {}) {
  const [items, setItems] = useState([]);
  const [apiResults, setApiResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load initial library from Firestore on mount
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true);
        if (libraryType === 'exercise') {
          const querySnapshot = await getDocs(collection(db, 'exerciseLibrary'));
          const exercises = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setItems(exercises);
          console.log(`✅ Loaded ${exercises.length} exercises from local library`);
        } else if (libraryType === 'food') {
          const localFoods = await loadLocalFoods();
          setItems(localFoods);
        }
      } catch (error) {
        console.error(`❌ Error loading ${libraryType} library:`, error);
      } finally {
        setLoading(false);
      }
    };
    loadLibrary();
  }, [libraryType]);

  // Search functionality
  const searchItems = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setShowDropdown(false);
      setResults([]);
      return;
    }

    if (libraryType === 'exercise') {
      const searchTerm = searchQuery.toLowerCase();
      const filtered = items.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm) ||
        exercise.target.toLowerCase().includes(searchTerm) ||
        exercise.bodyPart.toLowerCase().includes(searchTerm) ||
        exercise.equipment.toLowerCase().includes(searchTerm) ||
        exercise.category.toLowerCase().includes(searchTerm) ||
        (exercise.secondaryMuscles && exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(searchTerm)))
      );
      setResults(filtered);
      setShowDropdown(true);
    }
    // Food search is handled by API calls, not local filtering
  }, [items, libraryType]);

  useEffect(() => {
    if (libraryType === 'exercise') {
      searchItems(query);
    }
  }, [query, searchItems, libraryType]);

  // Food-specific functions
  const fetchAndSaveFood = async (item) => {
    if (libraryType !== 'food') return null;
    
    try {
      const potentialId = generateFoodId(item);
      if (!potentialId || items.some(f => f.id === potentialId)) {
        return null;
      }

      const fullDetails = await fetchFullNutrition(item);
      if (fullDetails) {
        const savedFood = await saveFoodToLibrary(fullDetails);
        setItems(currentItems => [...currentItems, savedFood]);
        return savedFood;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch and save food item:", error);
      return null;
    }
  };

  const searchNutritionix = async (searchQuery) => {
    if (libraryType !== 'food') return [];
    
    try {
      const results = await fetchInstantResults(searchQuery);
      setApiResults(results);

      const newBranded = results
        .filter(item => item.is_branded)
        .filter(item => !items.some(f => f.id === generateFoodId(item)))
        .slice(0, 2);

      const newCommon = results
        .filter(item => !item.is_branded)
        .filter(item => !items.some(f => f.id === generateFoodId(item)))
        .slice(0, 2);
      
      const itemsToSave = [...newBranded, ...newCommon];
      itemsToSave.forEach(item => fetchAndSaveFood(item));
      
      return results;
    } catch (error) {
      console.error("Failed to search Nutritionix:", error);
      setApiResults([]);
      return [];
    }
  };

  // Exercise-specific functions
  const handleSelectExercise = useCallback((exercise) => {
    if (libraryType !== 'exercise') return;
    
    const exerciseForCart = {
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
    
    setShowDropdown(false);
    setQuery('');
    
    // Call the callback if provided
    if (options.onExerciseAdd) {
      options.onExerciseAdd(exerciseForCart);
    }
    
    return exerciseForCart;
  }, [libraryType, options]);

  // Return different exports based on library type
  if (libraryType === 'exercise') {
    return {
      localExercises: items,
      exerciseQuery: query,
      setExerciseQuery: setQuery,
      exerciseResults: results,
      loading,
      showDropdown,
      setShowDropdown,
      handleSelectExercise,
    };
  } else if (libraryType === 'food') {
    return {
      foods: items,
      apiResults,
      loading,
      searchNutritionix,
      fetchAndSave: fetchAndSaveFood,
    };
  }

  return { loading: false };
} 