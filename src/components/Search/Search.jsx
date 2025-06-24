import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import MacroDisplay from '../nutrition/MacroDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const FoodResult = ({ item, onSelect, userProfile, togglePin, getFoodMacros }) => {
    // Show recipe name if isRecipe, otherwise food_name or label
    const foodName = item.isRecipe ? item.name : (item.food_name || item.label);
    const isPinned = item.isPinned || userProfile?.pinnedFoods?.includes(item.id);
    const isRecipe = item.isRecipe;
    const thumb = item.photo?.thumb;
    const macros = getFoodMacros(item);
    
    // Determine background color based on item type
    let bgColorClass = "hover:bg-accent";
    if (isPinned) {
        bgColorClass = "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400";
    } else if (isRecipe) {
        bgColorClass = "bg-green-50 hover:bg-green-100 border-l-4 border-green-400";
    }
    
    return (
        <div
            onClick={() => onSelect(item)}
            className={`cursor-pointer ${bgColorClass}`}
        >
            <div className="grid grid-cols-[minmax(0,1fr)_60px_50px_50px_50px_50px_auto] items-center gap-2 px-2 py-1">
                {/* Food name and thumb */}
                <div className="flex items-center min-w-0">
                    {thumb ? (
                        <img src={thumb} alt="food thumb" className="h-7 w-7 rounded object-cover mr-2 flex-shrink-0" />
                    ) : (
                        <div className="h-7 w-7 mr-2 flex-shrink-0 bg-gray-100 rounded" />
                    )}
                    <span className="truncate font-medium text-sm">{foodName}
                      {((item.tags && item.tags.food_group !== undefined) ? item.tags.food_group : item.food_group) !== undefined && (
                        <span className="ml-1 text-xs text-gray-400">fg:{item.tags && item.tags.food_group !== undefined ? item.tags.food_group : item.food_group}</span>
                      )}
                    </span>
                </div>
                {/* Macros: calories, carbs, fat, protein, fiber */}
                <div className="text-right w-[60px] font-mono tabular-nums text-xs">{macros.calories} <span role="img" aria-label="calories">🔥</span></div>
                <div className="text-right w-[50px] font-mono tabular-nums text-xs">{macros.carbs}g <span role="img" aria-label="carbs">🌾</span></div>
                <div className="text-right w-[50px] font-mono tabular-nums text-xs">{macros.fat}g <span role="img" aria-label="fat">🧈</span></div>
                <div className="text-right w-[50px] font-mono tabular-nums text-xs">{macros.protein}g <span role="img" aria-label="protein">🥩</span></div>
                <div className="text-right w-[50px] font-mono tabular-nums text-xs">{macros.fiber}g <span role="img" aria-label="fiber">🌱</span></div>
                {/* Pin/Recipe/Indicators */}
                <div className="flex items-center gap-2 justify-end">
                    {isRecipe && (
                        <span className="text-green-600 text-xs font-medium" title="Recipe">👨‍🍳</span>
                    )}
                    {item.id && !isRecipe && (
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}
                            title={isPinned ? "Unpin food" : "Pin food"}
                        >
                            {isPinned ? '📌' : '📍'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ExerciseResult = ({ item, onSelect, userProfile, togglePin }) => {
    const isPinned = item.isPinned || userProfile?.pinnedExercises?.includes(item.id);
    
    // Determine background color based on item type
    let bgColorClass = "hover:bg-accent";
    if (isPinned) {
        bgColorClass = "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400";
    }
    
    return (
        <div
            onClick={() => onSelect(item)}
            className={`flex justify-between items-center p-2 cursor-pointer ${bgColorClass}`}
        >
            <div className="flex items-center gap-2">
                <span>{item.name}</span>
            </div>
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

const ExerciseFilterControls = ({ options = {}, filters, setFilters, onFilterChange, isExpanded, onToggleExpanded }) => (
    <div className="my-2">
        {/* Filter Toggle Button */}
        <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpanded}
            className="w-full justify-between"
        >
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter by Target / Equipment</span>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {/* Filter Controls */}
        {isExpanded && (
            <div className="flex flex-col sm:flex-row gap-2 mt-2 p-3 border rounded-md bg-gray-50">
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
        )}
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
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    useEffect(() => {
        setIsOpen(searchQuery.length > 0 && searchResults.length > 0);
    }, [searchResults, searchQuery]);

    const handleFilterChange = (filterType, value) => {
        setFilters[filterType](value);
        if (value) {
            setSearchQuery(''); // Clear text query when a filter is applied
        }
    };

    const handleToggleFilterExpanded = () => {
        setIsFilterExpanded(!isFilterExpanded);
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
                        isExpanded={isFilterExpanded}
                        onToggleExpanded={handleToggleFilterExpanded}
                    />
                )}

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div style={{ maxHeight: '600px', minHeight: '200px', overflowY: 'auto' }}>
                        {isLoading && <div className="p-4 text-sm text-center">Searching...</div>}
                        {!isLoading && searchResults.length === 0 && searchQuery && (
                            <div className="p-4 text-sm text-center">No results found.</div>
                        )}
                        {searchResults.slice(0, 40).map((item) => (
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