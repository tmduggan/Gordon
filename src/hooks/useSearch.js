import { useState, useEffect, useMemo } from 'react';
import { fetchInstantResults as fetchNutritionixSearch } from '../api/nutritionixAPI';

export default function useSearch(type, library, userProfile) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [targetFilter, setTargetFilter] = useState('');
    const [equipmentFilter, setEquipmentFilter] = useState('');

    // Helper function to check if an item matches the search query
    const itemMatchesQuery = (item, query) => {
        if (!query.trim()) return false;
        const searchTerm = query.toLowerCase();
        
        if (type === 'food') {
            const foodName = item.food_name || item.label || item.name || '';
            return foodName.toLowerCase().includes(searchTerm);
        } else {
            const exerciseName = item.name || '';
            return exerciseName.toLowerCase().includes(searchTerm);
        }
    };

    // Get pinned items that match the query
    const getMatchingPinnedItems = useMemo(() => {
        if (!searchQuery.trim() || !userProfile) return [];
        
        if (type === 'food') {
            const pinnedFoodIds = userProfile.pinnedFoods || [];
            return library.items
                .filter(item => pinnedFoodIds.includes(item.id))
                .filter(item => itemMatchesQuery(item, searchQuery))
                .map(item => ({ ...item, isPinned: true }));
        } else {
            const pinnedExerciseIds = userProfile.pinnedExercises || [];
            return library.items
                .filter(item => pinnedExerciseIds.includes(item.id))
                .filter(item => itemMatchesQuery(item, searchQuery))
                .map(item => ({ ...item, isPinned: true }));
        }
    }, [searchQuery, userProfile, library.items, type]);

    // Get recipes that match the query (only for food type)
    const getMatchingRecipes = useMemo(() => {
        if (!searchQuery.trim() || type !== 'food' || !userProfile?.recipes) return [];
        
        return userProfile.recipes
            .filter(recipe => itemMatchesQuery(recipe, searchQuery))
            .map(recipe => ({ ...recipe, isRecipe: true }));
    }, [searchQuery, userProfile, type]);

    useEffect(() => {
        // This effect handles local library searching whenever the query or filters change.
        if (!searchQuery && type === 'food') {
            setSearchResults([]);
            return;
        }

        let results = [];

        if (type === 'exercise') {
            let exerciseResults = library.items;
            if (targetFilter) {
                exerciseResults = exerciseResults.filter(item => item.target === targetFilter);
            }
            if (equipmentFilter) {
                exerciseResults = exerciseResults.filter(item => item.equipment === equipmentFilter);
            }
            if (searchQuery) {
                exerciseResults = exerciseResults.filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            results = exerciseResults;
        } else { // Food search
            const foodResults = library.items.filter(item =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase())
            );
            results = foodResults;
        }

        // Add pinned items and recipes at the top
        const pinnedItems = getMatchingPinnedItems;
        const recipes = getMatchingRecipes;
        
        // Combine results: pinned items first, then recipes, then regular results
        const combinedResults = [...pinnedItems, ...recipes, ...results];
        
        setSearchResults(combinedResults);
    }, [searchQuery, library.items, type, targetFilter, equipmentFilter, getMatchingPinnedItems, getMatchingRecipes]);

    const handleApiSearch = async () => {
        if (searchQuery.trim() === '' || type !== 'food') return;
        setSearchLoading(true);
        try {
            let nutritionixResults = [];
            if (type === 'food' && library && typeof library.searchNutritionix === 'function') {
                nutritionixResults = await library.searchNutritionix(searchQuery);
            } else {
                nutritionixResults = await fetchNutritionixSearch(searchQuery);
            }

            // Add pinned items and recipes at the top of API results
            const pinnedItems = getMatchingPinnedItems;
            const recipes = getMatchingRecipes;
            
            const combinedResults = [...pinnedItems, ...recipes, ...nutritionixResults];
            setSearchResults(combinedResults);
        } catch (error) {
            console.error("Error fetching from Nutritionix:", error);
            // Even if API fails, show pinned items and recipes
            const pinnedItems = getMatchingPinnedItems;
            const recipes = getMatchingRecipes;
            setSearchResults([...pinnedItems, ...recipes]);
        } finally {
            setSearchLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        if (type === 'exercise') {
            setTargetFilter('');
            setEquipmentFilter('');
        }
    };

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        searchLoading,
        handleApiSearch,
        clearSearch,
        filters: {
            target: targetFilter,
            equipment: equipmentFilter
        },
        setFilters: {
            target: setTargetFilter,
            equipment: setEquipmentFilter
        },
    };
} 