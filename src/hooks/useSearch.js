import { useState, useEffect, useMemo } from 'react';
import { fetchInstantResults as fetchNutritionixSearch, fetchNutrients } from '../api/nutritionixAPI';
import { generateFoodId } from '../services/foodService';
import { useToast } from './use-toast';

export default function useSearch(type, library, userProfile, options = {}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [nutrientsLoading, setNutrientsLoading] = useState(false);
    const [targetFilter, setTargetFilter] = useState('');
    const [equipmentFilter, setEquipmentFilter] = useState('');
    const { toast } = useToast();

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
            // Get pinned items first
            const pinnedItems = getMatchingPinnedItems;
            
            // Create a set of pinned item IDs for efficient lookup
            const pinnedIds = new Set(pinnedItems.map(item => item.id));
            
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
            
            // Filter out exercises that are already pinned
            results = exerciseResults.filter(item => !pinnedIds.has(item.id));
        } else { // Food search
            // Get pinned items first
            const pinnedItems = getMatchingPinnedItems;
            
            // Create a set of pinned item IDs for efficient lookup
            const pinnedIds = new Set(pinnedItems.map(item => item.id || item.food_name));
            
            // Filter regular results, excluding items that are already pinned
            const foodResults = library.items
                .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .filter(item => !pinnedIds.has(item.id || item.food_name)); // Remove items already in pinned
            
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
            
            // Create a set of pinned item IDs for efficient lookup
            const pinnedIds = new Set(pinnedItems.map(item => item.id || item.food_name));
            
            // Filter out API results that are already pinned
            const filteredApiResults = nutritionixResults.filter(item => 
                !pinnedIds.has(item.id || item.food_name)
            );
            
            const combinedResults = [...pinnedItems, ...recipes, ...filteredApiResults];
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

    const handleNutrientsSearch = async () => {
        if (searchQuery.trim() === '' || type !== 'food') return;
        
        setNutrientsLoading(true);
        try {
            console.log('[handleNutrientsSearch] Processing query:', searchQuery);
            const nutrientsResults = await fetchNutrients(searchQuery);
            
            if (nutrientsResults.length === 0) {
                console.log('[handleNutrientsSearch] No foods found for query:', searchQuery);
                toast({
                    title: "No Foods Found",
                    description: "Could not find any foods matching your query. Try a different description.",
                    variant: "destructive",
                });
                return;
            }
            
            console.log('[handleNutrientsSearch] Found foods:', nutrientsResults);
            
            // Process each result: check if in library, save if not, add to cart
            const processedFoods = [];
            for (const food of nutrientsResults) {
                // Check if food already exists in library
                const existingFood = library.items.find(item => 
                    item.id === generateFoodId(food)
                );
                
                if (existingFood) {
                    // Use existing food from library
                    processedFoods.push(existingFood);
                    console.log('[handleNutrientsSearch] Using existing food:', existingFood.food_name);
                } else {
                    // Save new food to library
                    if (library && typeof library.fetchAndSave === 'function') {
                        const savedFood = await library.fetchAndSave(food);
                        if (savedFood) {
                            processedFoods.push(savedFood);
                            console.log('[handleNutrientsSearch] Saved new food:', savedFood.food_name);
                        }
                    } else {
                        console.warn('[handleNutrientsSearch] Library fetchAndSave not available');
                    }
                }
            }
            
            // Add all processed foods to cart
            if (options.onNutrientsAdd && processedFoods.length > 0) {
                options.onNutrientsAdd(processedFoods);
                console.log('[handleNutrientsSearch] Added foods to cart:', processedFoods.length);
            }
            
            // Clear search after successful processing
            clearSearch();
            
        } catch (error) {
            console.error('[handleNutrientsSearch] Error processing nutrients:', error);
            toast({
                title: "Error Processing Foods",
                description: "There was an error processing your food query. Please try again.",
                variant: "destructive",
            });
        } finally {
            setNutrientsLoading(false);
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
        nutrientsLoading,
        handleApiSearch,
        handleNutrientsSearch,
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