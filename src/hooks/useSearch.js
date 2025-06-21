import { useState, useEffect, useCallback } from 'react';

export default function useSearch(type, library) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Effect for live searching
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        let localResults = [];
        if (type === 'food' && library.foods) {
            localResults = library.foods.filter(food =>
                (food.label || food.food_name).toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else if (type === 'exercise' && library.localExercises) {
            const searchTerm = searchQuery.toLowerCase();
            localResults = library.localExercises.filter(exercise =>
                exercise.name.toLowerCase().includes(searchTerm) ||
                exercise.target.toLowerCase().includes(searchTerm) ||
                (exercise.secondaryMuscles && exercise.secondaryMuscles.some(m => m.toLowerCase().includes(searchTerm)))
            );
        }
        
        setSearchResults(localResults);
        setShowDropdown(localResults.length > 0);

    }, [searchQuery, library.foods, library.localExercises, type]);

    const handleApiSearch = useCallback(async () => {
        if (type !== 'food' || !searchQuery) return;
        setSearchLoading(true);
        const apiResults = await library.searchNutritionix(searchQuery) || [];
        
        setSearchResults(prevResults => {
            const combined = [...prevResults];
            apiResults.forEach(apiFood => {
                if (!combined.some(localFood => localFood.label === apiFood.food_name)) {
                    combined.push({ ...apiFood, isPreview: true });
                }
            });
            return combined;
        });
        setShowDropdown(true);
        setSearchLoading(false);
    }, [searchQuery, library, type]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        searchLoading,
        showDropdown,
        handleApiSearch,
        clearSearch,
    };
} 