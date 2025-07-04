import { useState, useEffect, useMemo } from 'react';
import { fetchInstantResults as fetchNutritionixSearch, fetchNutrients, fetchFullNutrition } from '../api/nutritionixAPI';
import { generateFoodId } from '../services/foodService';
import { useToast } from './useToast';
import { exerciseTargetsMuscleCategory } from '../services/svgMappingService';
import { parseNutritionString } from '../services/nutrition/nutritionStringParser';

// Helper function to normalize strings for fuzzy matching
const normalize = str => (str || '').toLowerCase().replace(/[''`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Helper function to check if an item matches the search query (food)
const itemMatchesFoodQuery = (item, query) => {
    if (!query.trim()) return false;
    const searchTerm = normalize(query);
    const foodName = normalize(item.food_name || item.label || item.name || '');
    const brandName = normalize(item.brand_name || '');
    // Allow multi-word queries to match across both fields
    return (
        foodName.includes(searchTerm) ||
        brandName.includes(searchTerm) ||
        // Split query into words and require all to be present in either field
        searchTerm.split(' ').every(word => foodName.includes(word) || brandName.includes(word))
    );
};

// Helper: Normalize string for matching
function normalizeName(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Helper: Simple two-way includes fuzzy match
function isFuzzyMatch(a, b) {
  a = normalizeName(a);
  b = normalizeName(b);
  return a.includes(b) || b.includes(a);
}

// Helper: Try to convert quantity to available unit
function convertToAvailableUnit(food, qty, unit) {
  // If requested unit is available, use it
  const availableUnits = new Set();
  if (food.serving_unit) availableUnits.add(food.serving_unit.toLowerCase());
  if (food.serving_weight_grams) availableUnits.add('g');
  if (food.alt_measures && Array.isArray(food.alt_measures)) {
    food.alt_measures.forEach(m => m.measure && availableUnits.add(m.measure.toLowerCase()));
  }
  if (availableUnits.has(unit)) {
    return { quantity: qty, units: unit, converted: false };
  }
  // Try to convert grams to another unit
  if (unit === 'g' && food.alt_measures && Array.isArray(food.alt_measures)) {
    // Find closest alt_measure in grams
    let best = null;
    let minDiff = Infinity;
    for (const m of food.alt_measures) {
      if (m.serving_weight && m.measure) {
        const diff = Math.abs(qty - m.serving_weight);
        if (diff < minDiff) {
          minDiff = diff;
          best = m;
        }
      }
    }
    if (best) {
      const convertedQty = qty / best.serving_weight * best.qty;
      return { quantity: convertedQty, units: best.measure, converted: true, conversionText: `Converted ${qty}g to ${convertedQty.toFixed(2)} ${best.measure}` };
    }
  }
  // Fallback to default unit
  return { quantity: 1, units: food.serving_unit || 'serving', converted: true, conversionText: `Used default unit for '${food.food_name || food.label || food.name}'` };
}

export default function useSearch(type, library, userProfile, options = {}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [nutrientsLoading, setNutrientsLoading] = useState(false);
    const [targetCategoryFilter, setTargetCategoryFilter] = useState('');
    const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState('');
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

    // Helper function to check if exercise equipment matches the selected category
    const exerciseMatchesEquipmentCategory = (exercise, category, userProfile) => {
        if (!category || !userProfile?.availableEquipment) return true;
        
        const availableEquipment = userProfile.availableEquipment;
        
        switch (category) {
            case 'bodyweight':
                return availableEquipment.bodyweight?.some(equipment => 
                    exercise.equipment?.toLowerCase().includes(equipment.toLowerCase())
                ) || exercise.equipment?.toLowerCase().includes('body weight');
            case 'gym':
                return availableEquipment.gym?.some(equipment => 
                    exercise.equipment?.toLowerCase().includes(equipment.toLowerCase())
                );
            case 'cardio':
                return availableEquipment.cardio?.some(equipment => 
                    exercise.equipment?.toLowerCase().includes(equipment.toLowerCase())
                ) || exercise.category?.toLowerCase() === 'cardio';
            default:
                return true;
        }
    };

    // Helper function to check if an exercise targets a specific muscle group
    const exerciseTargetsMuscleGroup = (exercise, muscleGroup) => {
        if (!muscleGroup) return true;
        return exerciseTargetsMuscleCategory(exercise, muscleGroup);
    };

    // Get pinned items that match the query
    const getMatchingPinnedItems = useMemo(() => {
        if (!searchQuery.trim() || !userProfile) return [];
        
        if (type === 'food') {
            const pinnedFoodIds = userProfile.pinnedFoods || [];
            return library.items
                .filter(item => pinnedFoodIds.includes(item.id))
                .filter(item => itemMatchesFoodQuery(item, searchQuery))
                .map(item => ({ ...item, isPinned: true }));
        } else {
            const pinnedExerciseIds = userProfile.pinnedExercises || [];
            return library.items
                .filter(item => pinnedExerciseIds.includes(item.id))
                .filter(item => itemMatchesQuery(item, searchQuery))
                .filter(item => exerciseMatchesEquipmentCategory(item, equipmentCategoryFilter, userProfile))
                .filter(item => !targetCategoryFilter || exerciseTargetsMuscleGroup(item, targetCategoryFilter))
                .map(item => ({ ...item, isPinned: true }));
        }
    }, [searchQuery, userProfile, library.items, type, equipmentCategoryFilter, targetCategoryFilter]);

    // Get recipes that match the query (only for food type)
    const getMatchingRecipes = useMemo(() => {
        if (!searchQuery.trim() || type !== 'food' || !userProfile?.recipes) return [];
        
        return userProfile.recipes
            .filter(recipe => itemMatchesFoodQuery(recipe, searchQuery))
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
            if (targetCategoryFilter) {
                exerciseResults = exerciseResults.filter(item => 
                    exerciseTargetsMuscleGroup(item, targetCategoryFilter)
                );
            }
            if (equipmentCategoryFilter) {
                exerciseResults = exerciseResults.filter(item => 
                    exerciseMatchesEquipmentCategory(item, equipmentCategoryFilter, userProfile)
                );
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
                .filter(item => itemMatchesFoodQuery(item, searchQuery))
                .filter(item => !pinnedIds.has(item.id || item.food_name)); // Remove items already in pinned
            
            results = foodResults;
        }

        // Add pinned items and recipes at the top
        const pinnedItems = getMatchingPinnedItems;
        const recipes = getMatchingRecipes;
        
        // Combine results: pinned items first, then recipes, then regular results
        const combinedResults = [...pinnedItems, ...recipes, ...results];
        
        setSearchResults(combinedResults);
    }, [searchQuery, library.items, type, targetCategoryFilter, equipmentCategoryFilter, getMatchingPinnedItems, getMatchingRecipes, userProfile]);

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
        if (searchQuery.length > 100) {
            toast({
                title: "Query Too Long",
                description: "Please limit your input to 100 characters.",
                variant: "destructive",
            });
            return;
        }
        setNutrientsLoading(true);
        try {
            console.log('[handleNutrientsSearch] Processing query:', searchQuery);
            // Use the nutrition string parser
            const parsedItems = parseNutritionString(searchQuery);
            if (parsedItems.length === 0) {
                toast({
                    title: "No Foods Parsed",
                    description: "Could not parse any foods from your input.",
                    variant: "destructive",
                });
                return;
            }
            const processedFoods = [];
            for (const { qty, unit, name } of parsedItems) {
                // Fuzzy/case-insensitive match in library
                let match = library.items.find(item => isFuzzyMatch(item.food_name || item.label || item.name || '', name));
                let food = match;
                let usedFuzzy = false;
                if (!food) {
                    // Try closest match by Levenshtein distance (optional, simple version)
                    let minDist = Infinity;
                    let bestMatch = null;
                    for (const item of library.items) {
                        const dist = Math.abs((item.food_name || item.label || item.name || '').length - name.length);
                        if (dist < minDist) {
                            minDist = dist;
                            bestMatch = item;
                        }
                    }
                    if (bestMatch && minDist <= 3) { // Allow small difference
                        food = bestMatch;
                        usedFuzzy = true;
                    }
                }
                if (!food) {
                    // Fetch from Nutritionix if not found
                    const fetched = await fetchFullNutrition({ food_name: name });
                    if (fetched) {
                        if (library && typeof library.fetchAndSave === 'function') {
                            food = await library.fetchAndSave(fetched);
                        } else {
                            food = fetched;
                        }
                    }
                }
                if (food) {
                    // Handle unit/quantity
                    const { quantity, units, converted, conversionText } = convertToAvailableUnit(food, qty, unit);
                    processedFoods.push({ ...food, quantity, units });
                    if (usedFuzzy) {
                        toast({
                            title: "Closest Match Added",
                            description: `Added closest match '${food.food_name || food.label || food.name}' for '${name}'`,
                        });
                    }
                    if (converted && conversionText) {
                        toast({
                            title: "Unit Converted",
                            description: conversionText,
                        });
                    }
                } else {
                    toast({
                        title: "Food Not Found",
                        description: `Could not find or fetch '${name}'.`,
                        variant: "destructive",
                    });
                }
            }
            if (options.onNutrientsAdd && processedFoods.length > 0) {
                options.onNutrientsAdd(processedFoods);
                console.log('[handleNutrientsSearch] Added foods to cart:', processedFoods.length);
            }
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
            setTargetCategoryFilter('');
            setEquipmentCategoryFilter('');
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
            targetCategory: targetCategoryFilter,
            equipmentCategory: equipmentCategoryFilter
        },
        setFilters: {
            targetCategory: setTargetCategoryFilter,
            equipmentCategory: setEquipmentCategoryFilter
        },
    };
} 