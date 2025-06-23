import { useState, useEffect, useMemo } from 'react';
import { fetchInstantResults as fetchNutritionixSearch } from '../api/nutritionixAPI';

export default function useSearch(type, library) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [targetFilter, setTargetFilter] = useState('');
    const [equipmentFilter, setEquipmentFilter] = useState('');

    useEffect(() => {
        // This effect handles local library searching whenever the query or filters change.
        if (!searchQuery && type === 'food') {
            setSearchResults([]);
            return;
        }

        if (type === 'exercise') {
            let results = library.items;
            if (targetFilter) {
                results = results.filter(item => item.target === targetFilter);
            }
            if (equipmentFilter) {
                results = results.filter(item => item.equipment === equipmentFilter);
            }
            if (searchQuery) {
                results = results.filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            setSearchResults(results);
        } else { // Food search
            const results = library.items.filter(item =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(results);
        }
    }, [searchQuery, library.items, type, targetFilter, equipmentFilter]);

    const handleApiSearch = async () => {
        if (searchQuery.trim() === '' || type !== 'food') return;
        setSearchLoading(true);
        try {
            const nutritionixResults = await fetchNutritionixSearch(searchQuery);
            setSearchResults(nutritionixResults);
        } catch (error) {
            console.error("Error fetching from Nutritionix:", error);
            setSearchResults([]);
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