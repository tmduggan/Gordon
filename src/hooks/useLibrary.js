import { useState, useEffect, useCallback } from 'react';
import {
    loadExerciseLibrary,
    loadFoodLibrary,
    searchExercises,
    searchNutritionix,
    fetchAndSaveFood,
    prepareExerciseForCart
} from '../services/firebase/fetchLibraryService';

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
    const searchItems = useCallback((searchQuery) => {
        if (!searchQuery.trim()) {
            setShowDropdown(false);
            setResults([]);
            return;
        }

        if (libraryType === 'exercise') {
            const filtered = searchExercises(items, searchQuery);
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
    const handleFetchAndSaveFood = async (item) => {
        if (libraryType !== 'food') return null;
        
        const savedFood = await fetchAndSaveFood(item, items);
        if (savedFood) {
            // Instead of just adding to local state, reload the full library from Firestore
            try {
                const foods = await loadFoodLibrary();
                setItems(foods);
            } catch (error) {
                console.error('Error reloading food library after save:', error);
                // Fallback: optimistically add to local state
                setItems(currentItems => [...currentItems, savedFood]);
            }
        }
        return savedFood;
    };

    const handleSearchNutritionix = async (searchQuery) => {
        if (libraryType !== 'food') return [];
        
        const results = await searchNutritionix(searchQuery, items);
        setApiResults(results);
        // After API search and saves, reload the food library from Firestore
        try {
            const foods = await loadFoodLibrary();
            setItems(foods);
        } catch (error) {
            console.error('Error reloading food library after Nutritionix search:', error);
        }
        return results;
    };

    // Exercise-specific functions
    const handleSelectExercise = useCallback((exercise) => {
        if (libraryType !== 'exercise') return;
        
        const exerciseForCart = prepareExerciseForCart(exercise);
        
        setShowDropdown(false);
        setQuery('');
        
        // Call the callback if provided
        if (options.onExerciseAdd) {
            options.onExerciseAdd(exerciseForCart);
        }
        
        return exerciseForCart;
    }, [libraryType, options]);

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