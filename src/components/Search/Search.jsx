import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import MacroDisplay from '../nutrition/MacroDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from 'lucide-react';

const FoodResult = ({ item, onSelect, userProfile, togglePin, getFoodMacros }) => {
    const foodName = item.food_name || item.label;
    const isPinned = userProfile?.pinnedFoods?.includes(item.id);
    const thumb = item.photo?.thumb;
    return (
        <div
            onClick={() => onSelect(item)}
            className="flex justify-between items-center p-2 hover:bg-accent cursor-pointer"
        >
            <div className="flex items-center w-full">
                {/* Food photo icon or placeholder */}
                {thumb ? (
                    <img src={thumb} alt="food thumb" className="h-7 w-7 rounded object-cover mr-2 flex-shrink-0" />
                ) : (
                    <div className="h-7 w-7 mr-2 flex-shrink-0 bg-gray-100 rounded" />
                )}
                <MacroDisplay macros={getFoodMacros(item)} format="inline-text" truncateLength={40}>
                    {foodName}
                </MacroDisplay>
            </div>
            {item.id && (
                <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}
                    title={isPinned ? "Unpin food" : "Pin food"}
                >
                    {isPinned ? '📌' : '📍'}
                </Button>
            )}
        </div>
    );
};

const ExerciseResult = ({ item, onSelect, userProfile, togglePin }) => {
    const isPinned = userProfile?.pinnedExercises?.includes(item.id);
    return (
        <div
            onClick={() => onSelect(item)}
            className="flex justify-between items-center p-2 hover:bg-accent cursor-pointer"
        >
            <span>{item.name}</span>
            {item.id && (
                <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}
                    title={isPinned ? "Unpin exercise" : "Pin exercise"}
                >
                    {isPinned ? '📌' : '📍'}
                </Button>
            )}
        </div>
    );
};

const ExerciseFilterControls = ({ options = {}, filters, setFilters, onFilterChange }) => (
    <div className="flex flex-col sm:flex-row gap-2 my-2">
        <FilterSelect
            placeholder="Filter by Target"
            value={filters.target}
            options={options.targets}
            onValueChange={(value) => onFilterChange('target', value)}
            onClear={() => onFilterChange('target', '')}
        />
        <FilterSelect
            placeholder="Filter by Equipment"
            value={filters.equipment}
            options={options.equipments}
            onValueChange={(value) => onFilterChange('equipment', value)}
            onClear={() => onFilterChange('equipment', '')}
        />
    </div>
);

const FilterSelect = ({ placeholder, value, options = [], onValueChange, onClear }) => (
    <div className="flex items-center gap-1 w-full">
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map(option => (
                    <SelectItem key={option} value={option} className="capitalize">{option}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        {value && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} title={`Clear ${placeholder}`}>
                <X className="h-4 w-4" />
            </Button>
        )}
    </div>
);

export default function Search({
    type,
    searchQuery,
    setSearchQuery,
    searchResults = [],
    handleApiSearch,
    handleSelect,
    isLoading,
    userProfile,
    togglePin,
    getFoodMacros,
    placeholder,
    filters,
    setFilters,
    filterOptions
}) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(searchQuery.length > 0 && searchResults.length > 0);
    }, [searchResults, searchQuery]);

    const handleFilterChange = (filterType, value) => {
        setFilters[filterType](value);
        if (value) {
            setSearchQuery(''); // Clear text query when a filter is applied
        }
    };

    const ResultComponent = type === 'food' ? FoodResult : ExerciseResult;

    return (
        <div className="relative">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverAnchor asChild>
                    <div className="flex items-center space-x-2">
                        <Input
                            type="text"
                            placeholder={placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsOpen(true)}
                            className="flex-grow"
                        />
                        {type === 'food' && (
                            <Button onClick={handleApiSearch} disabled={isLoading}>
                                {isLoading ? '...' : 'Search'}
                            </Button>
                        )}
                    </div>
                </PopoverAnchor>
                
                {type === 'exercise' && (
                    <ExerciseFilterControls
                        options={filterOptions}
                        filters={filters}
                        setFilters={setFilters}
                        onFilterChange={handleFilterChange}
                    />
                )}

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div>
                        {isLoading && <div className="p-4 text-sm text-center">Searching...</div>}
                        {!isLoading && searchResults.length === 0 && searchQuery && (
                            <div className="p-4 text-sm text-center">No results found.</div>
                        )}
                        {searchResults.map((item) => (
                            <ResultComponent
                                key={item.id || item.food_name}
                                item={item}
                                onSelect={(selectedItem) => {
                                    handleSelect(selectedItem);
                                    setIsOpen(false);
                                }}
                                userProfile={userProfile}
                                togglePin={togglePin}
                                getFoodMacros={getFoodMacros} // Only used by FoodResult
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
} 