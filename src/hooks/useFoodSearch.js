import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchFullNutrition,
  fetchInstantResults as fetchNutritionixSearch,
} from '../api/nutritionixAPI';
import { parseNutritionString } from '../services/nutrition/nutritionStringParser';
import { useToast } from './useToast';

// Helper function to normalize strings for fuzzy matching
const normalize = (str) =>
  (str || '')
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Helper function to check if an item matches the search query
const itemMatchesFoodQuery = (item, query) => {
  if (!query.trim()) return false;
  const searchTerm = normalize(query);
  const foodName = normalize(item.food_name || item.label || item.name || '');
  const brandName = normalize(item.brand_name || '');
  return (
    foodName.includes(searchTerm) ||
    brandName.includes(searchTerm) ||
    searchTerm
      .split(' ')
      .every((word) => foodName.includes(word) || brandName.includes(word))
  );
};

// Helper: Normalize string for matching
function normalizeName(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Helper: Simple two-way includes fuzzy match
function isFuzzyMatch(a, b) {
  a = normalizeName(a);
  b = normalizeName(b);
  return a.includes(b) || b.includes(a);
}

// Helper: Try to convert quantity to available unit
function convertToAvailableUnit(food, qty, unit) {
  const availableUnits = new Set();
  if (food.serving_unit) availableUnits.add(food.serving_unit.toLowerCase());
  if (food.serving_weight_grams) availableUnits.add('g');
  if (food.alt_measures && Array.isArray(food.alt_measures)) {
    food.alt_measures.forEach(
      (m) => m.measure && availableUnits.add(m.measure.toLowerCase())
    );
  }

  if (availableUnits.has(unit)) {
    return { quantity: qty, units: unit, converted: false };
  }

  if (unit === 'g' && food.alt_measures && Array.isArray(food.alt_measures)) {
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
      const convertedQty = (qty / best.serving_weight) * best.qty;
      return {
        quantity: convertedQty,
        units: best.measure,
        converted: true,
        conversionText: `Converted ${qty}g to ${convertedQty.toFixed(2)} ${best.measure}`,
      };
    }
  }

  return {
    quantity: 1,
    units: food.serving_unit || 'serving',
    converted: true,
    conversionText: `Used default unit for '${food.food_name || food.label || food.name}'`,
  };
}

export default function useFoodSearch(library, userProfile, options = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [nutrientsLoading, setNutrientsLoading] = useState(false);
  const { toast } = useToast();

  // Get pinned items that match the query
  const pinnedItems = useMemo(() => {
    if (!searchQuery.trim() || !userProfile?.pinnedFoods) return [];

    return library.items
      .filter((item) => userProfile.pinnedFoods.includes(item.id))
      .filter((item) => itemMatchesFoodQuery(item, searchQuery))
      .map((item) => ({ ...item, isPinned: true }));
  }, [searchQuery, userProfile?.pinnedFoods, library.items]);

  // Get recipes that match the query
  const recipes = useMemo(() => {
    if (!searchQuery.trim() || !userProfile?.recipes) return [];

    return userProfile.recipes
      .filter((recipe) => itemMatchesFoodQuery(recipe, searchQuery))
      .map((recipe) => ({ ...recipe, isRecipe: true }));
  }, [searchQuery, userProfile?.recipes]);

  // Get regular library items that match the query
  const libraryItems = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const pinnedIds = new Set(
      pinnedItems.map((item) => item.id || item.food_name)
    );

    return library.items
      .filter((item) => itemMatchesFoodQuery(item, searchQuery))
      .filter((item) => !pinnedIds.has(item.id || item.food_name));
  }, [searchQuery, library.items, pinnedItems]);

  // Combine all results
  const combinedResults = useMemo(() => {
    return [...pinnedItems, ...recipes, ...libraryItems];
  }, [pinnedItems, recipes, libraryItems]);

  // Update search results when combined results change
  useEffect(() => {
    setSearchResults(combinedResults);
  }, [combinedResults]);

  const handleApiSearch = useCallback(async () => {
    if (searchQuery.trim() === '') return;

    setSearchLoading(true);
    try {
      let nutritionixResults = [];
      if (library && typeof library.searchNutritionix === 'function') {
        nutritionixResults = await library.searchNutritionix(searchQuery);
      } else {
        nutritionixResults = await fetchNutritionixSearch(searchQuery);
      }

      const pinnedIds = new Set(
        pinnedItems.map((item) => item.id || item.food_name)
      );
      const filteredApiResults = nutritionixResults.filter(
        (item) => !pinnedIds.has(item.id || item.food_name)
      );

      const combinedResults = [
        ...pinnedItems,
        ...recipes,
        ...filteredApiResults,
      ];
      setSearchResults(combinedResults);
    } catch (error) {
      console.error('Error fetching from Nutritionix:', error);
      setSearchResults([...pinnedItems, ...recipes]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, library, pinnedItems, recipes]);

  const handleNutrientsSearch = useCallback(async () => {
    if (searchQuery.trim() === '') return;

    if (searchQuery.length > 100) {
      toast({
        title: 'Query Too Long',
        description: 'Please limit your input to 100 characters.',
        variant: 'destructive',
      });
      return;
    }

    setNutrientsLoading(true);
    try {
      const parsedItems = parseNutritionString(searchQuery);
      if (parsedItems.length === 0) {
        toast({
          title: 'No Foods Parsed',
          description: 'Could not parse any foods from your input.',
          variant: 'destructive',
        });
        return;
      }

      const processedFoods = [];
      for (const { qty, unit, name } of parsedItems) {
        let match = library.items.find((item) =>
          isFuzzyMatch(item.food_name || item.label || item.name || '', name)
        );
        let food = match;
        let usedFuzzy = false;

        if (!food) {
          let minDist = Infinity;
          let bestMatch = null;
          for (const item of library.items) {
            const dist = Math.abs(
              (item.food_name || item.label || item.name || '').length -
                name.length
            );
            if (dist < minDist) {
              minDist = dist;
              bestMatch = item;
            }
          }
          if (bestMatch && minDist <= 3) {
            food = bestMatch;
            usedFuzzy = true;
          }
        }

        if (!food) {
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
          const { quantity, units, converted, conversionText } =
            convertToAvailableUnit(food, qty, unit);
          processedFoods.push({ ...food, quantity, units });

          if (usedFuzzy) {
            toast({
              title: 'Closest Match Added',
              description: `Added closest match '${food.food_name || food.label || food.name}' for '${name}'`,
            });
          }
          if (converted && conversionText) {
            toast({
              title: 'Unit Converted',
              description: conversionText,
            });
          }
        } else {
          toast({
            title: 'Food Not Found',
            description: `Could not find or fetch '${name}'.`,
            variant: 'destructive',
          });
        }
      }

      if (options.onNutrientsAdd && processedFoods.length > 0) {
        options.onNutrientsAdd(processedFoods);
      }
      clearSearch();
    } catch (error) {
      console.error(
        '[handleNutrientsSearch] Error processing nutrients:',
        error
      );
      toast({
        title: 'Error Processing Foods',
        description:
          'There was an error processing your food query. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setNutrientsLoading(false);
    }
  }, [searchQuery, library, options.onNutrientsAdd, toast]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    nutrientsLoading,
    handleApiSearch,
    handleNutrientsSearch,
    clearSearch,
  };
}
