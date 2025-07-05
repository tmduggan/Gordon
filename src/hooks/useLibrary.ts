import { useCallback, useEffect, useState } from 'react';
import {
  fetchAndSaveFood,
  loadExerciseLibrary,
  loadFoodLibrary,
  prepareExerciseForCart,
  searchExercises,
  searchNutritionix,
} from '../services/firebase/fetchLibraryService';
import type { Food, Exercise } from '../types';

export type LibraryType = 'food' | 'exercise';

interface LibraryOptions {
  onExerciseAdd?: (exercise: any) => void;
  [key: string]: any;
}

interface UseLibraryReturn {
  items: Food[] | Exercise[];
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
  results: Food[] | Exercise[];
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  // Food-specific
  apiResults: Food[];
  searchNutritionix: (searchQuery: string) => Promise<Food[]>;
  fetchAndSave: (item: any) => Promise<Food | null>;
  // Exercise-specific
  handleSelectExercise: (exercise: Exercise) => any;
}

export default function useLibrary(
  libraryType: LibraryType,
  options: LibraryOptions = {}
): UseLibraryReturn {
  const [items, setItems] = useState<Food[] | Exercise[]>([]);
  const [apiResults, setApiResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Food[] | Exercise[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Load initial library from Firestore on mount
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true);
        if (libraryType === 'exercise') {
          const exercises = await loadExerciseLibrary();
          setItems(exercises);
        } else if (libraryType === 'food') {
          const foods = await loadFoodLibrary();
          setItems(foods);
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
  const searchItems = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setShowDropdown(false);
        setResults([]);
        return;
      }

      if (libraryType === 'exercise') {
        const filtered = searchExercises(items as Exercise[], searchQuery);
        setResults(filtered);
        setShowDropdown(true);
      }
      // Food search is handled by API calls, not local filtering
    },
    [items, libraryType]
  );

  useEffect(() => {
    if (libraryType === 'exercise') {
      searchItems(query);
    }
  }, [query, searchItems, libraryType]);

  // Food-specific functions
  const handleFetchAndSaveFood = async (item: any): Promise<Food | null> => {
    if (libraryType !== 'food') return null;

    const savedFood = await fetchAndSaveFood(item, items as Food[]);
    if (savedFood) {
      // Instead of just adding to local state, reload the full library from Firestore
      try {
        const foods = await loadFoodLibrary();
        setItems(foods);
      } catch (error) {
        console.error('Error reloading food library after save:', error);
        // Fallback: optimistically add to local state
        setItems((currentItems) => [...currentItems, savedFood]);
      }
    }
    return savedFood;
  };

  const handleSearchNutritionix = async (searchQuery: string): Promise<Food[]> => {
    if (libraryType !== 'food') return [];

    const results = await searchNutritionix(searchQuery, items as Food[]);
    setApiResults(results);
    // After API search and saves, reload the food library from Firestore
    try {
      const foods = await loadFoodLibrary();
      setItems(foods);
    } catch (error) {
      console.error(
        'Error reloading food library after Nutritionix search:',
        error
      );
    }
    return results;
  };

  // Exercise-specific functions
  const handleSelectExercise = useCallback(
    (exercise: Exercise) => {
      if (libraryType !== 'exercise') return;

      const exerciseForCart = prepareExerciseForCart(exercise);

      setShowDropdown(false);
      setQuery('');

      // Call the callback if provided
      if (options.onExerciseAdd) {
        options.onExerciseAdd(exerciseForCart);
      }

      return exerciseForCart;
    },
    [libraryType, options]
  );

  // Return consistent structure
  return {
    items,
    loading,
    query,
    setQuery,
    results,
    showDropdown,
    setShowDropdown,

    // Food-specific
    apiResults,
    searchNutritionix: handleSearchNutritionix,
    fetchAndSave: handleFetchAndSaveFood,

    // Exercise-specific
    handleSelectExercise,
  };
} 