import { useState, useEffect, useMemo, useCallback } from 'react';
import { exerciseTargetsMuscleCategory } from '../services/svgMappingService';

export default function useExerciseSearch(library, userProfile) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [targetCategoryFilter, setTargetCategoryFilter] = useState('');
    const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState('');

    // Helper function to check if exercise equipment matches the selected category
    const exerciseMatchesEquipmentCategory = useCallback((exercise, category, userProfile) => {
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
    }, []);

    // Helper function to check if an exercise targets a specific muscle group
    const exerciseTargetsMuscleGroup = useCallback((exercise, muscleGroup) => {
        if (!muscleGroup) return true;
        return exerciseTargetsMuscleCategory(exercise, muscleGroup);
    }, []);

    // Get pinned items that match the query and filters
    const pinnedItems = useMemo(() => {
        if (!userProfile?.pinnedExercises) return [];
        
        return library.items
            .filter(item => userProfile.pinnedExercises.includes(item.id))
            .filter(item => !searchQuery.trim() || 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(item => exerciseMatchesEquipmentCategory(item, equipmentCategoryFilter, userProfile))
            .filter(item => !targetCategoryFilter || exerciseTargetsMuscleGroup(item, targetCategoryFilter))
            .map(item => ({ ...item, isPinned: true }));
    }, [searchQuery, userProfile?.pinnedExercises, library.items, equipmentCategoryFilter, targetCategoryFilter, exerciseMatchesEquipmentCategory, exerciseTargetsMuscleGroup]);

    // Get regular library items that match the query and filters
    const libraryItems = useMemo(() => {
        const pinnedIds = new Set(pinnedItems.map(item => item.id));
        
        let exerciseResults = library.items;
        
        // Apply filters
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
        if (searchQuery.trim()) {
            exerciseResults = exerciseResults.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Filter out exercises that are already pinned
        return exerciseResults.filter(item => !pinnedIds.has(item.id));
    }, [searchQuery, library.items, targetCategoryFilter, equipmentCategoryFilter, pinnedItems, exerciseTargetsMuscleGroup, exerciseMatchesEquipmentCategory, userProfile]);

    // Combine results
    const combinedResults = useMemo(() => {
        return [...pinnedItems, ...libraryItems];
    }, [pinnedItems, libraryItems]);

    // Update search results when combined results change
    useEffect(() => {
        setSearchResults(combinedResults);
    }, [combinedResults]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setTargetCategoryFilter('');
        setEquipmentCategoryFilter('');
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
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