import { useState, useEffect, useCallback } from 'react';

export default function useSearchController(foodLibrary) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Effect for live searching local food library
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }
        if (!foodLibrary.foods) {
            return;
        }
        const localResults = foodLibrary.foods.filter(food =>
            (food.label || food.food_name).toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(localResults);
    }, [searchQuery, foodLibrary.foods]);

    const handleApiSearch = useCallback(async () => {
        if (!searchQuery) return;
        setSearchLoading(true);
        const apiResults = await foodLibrary.searchNutritionix(searchQuery) || [];
        
        setSearchResults(prevResults => {
            const combined = [...prevResults];
            apiResults.forEach(apiFood => {
                if (!combined.some(localFood => localFood.label === apiFood.food_name)) {
                    combined.push({ ...apiFood, isPreview: true });
                }
            });
            return combined;
        });

        setSearchLoading(false);
    }, [searchQuery, foodLibrary]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        searchLoading,
        handleApiSearch,
        clearSearch
    };
} 