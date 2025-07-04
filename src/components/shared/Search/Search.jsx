import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import MacroDisplay from '../../nutrition/MacroDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, ChevronDown, ChevronUp, Loader2, Star, StarOff, Lightbulb } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import ExerciseDisplay from '../../exercise/ExerciseDisplay';
import ExerciseLibraryAdditionModal from '../../exercise/ExerciseLibraryAdditionModal';
import { getSvgGroupDisplayName } from '@/services/svgMappingService';
import useLibrary from '../../../hooks/useLibrary';

const FoodResult = ({ item, onSelect, userProfile, togglePin, getFoodMacros }) => {
    // Show recipe name if isRecipe, otherwise food_name or label
    const foodName = item.isRecipe ? item.name : (item.food_name || item.label);
    const isPinned = item.isPinned || userProfile?.pinnedFoods?.includes(item.id);
    const isRecipe = item.isRecipe;
    const thumb = item.photo?.thumb;
    const macros = getFoodMacros(item);
    const isBranded = !!item.brand_name;
    const foodLibrary = useLibrary('food');

    const formatQty = (qty) => {
        if (typeof qty === 'number') {
            return qty % 1 === 0 ? qty : qty.toFixed(2);
        }
        if (!isNaN(Number(qty))) {
            const num = Number(qty);
            return num % 1 === 0 ? num : num.toFixed(2);
        }
        return qty || '';
    };
    const subtext = isBranded
        ? `${item.brand_name || ''}${item.serving_qty && item.serving_unit ? ", " + formatQty(item.serving_qty) + " " + item.serving_unit : ''}`
        : '';

    // Determine background color based on item type
    let bgColorClass = "hover:bg-accent";
    if (isPinned) {
        bgColorClass = "bg-equipment hover:bg-equipment/80 border-l-4 border-equipment";
    } else if (isRecipe) {
        bgColorClass = "bg-status-success hover:bg-status-success/80 border-l-4 border-status-success";
    }
    
    // Helper to calculate calories for a recipe (including nested)
    const getRecipeCalories = (recipe, servings = 1) => {
        if (!recipe || !recipe.items) return 0;
        const recipeServings = recipe.servings || 1;
        let total = 0;
        recipe.items.forEach(ingredient => {
            if (ingredient.isRecipe) {
                const nestedRecipe = userProfile?.recipes?.find(r => r.id === ingredient.id);
                if (nestedRecipe) {
                    const nestedCals = getRecipeCalories(nestedRecipe, (ingredient.quantity / recipeServings) * servings);
                    total += nestedCals;
                }
            } else {
                const food = foodLibrary.items.find(f => f.id === ingredient.id);
                if (food) {
                    const macros = getFoodMacros(food);
                    total += (macros.calories || 0) * ((ingredient.quantity / recipeServings) * servings);
                }
            }
        });
        return Math.round(total);
    };

    // For recipes, calculate calories from ingredients; for foods, use macros.calories
    const calories = isRecipe ? getRecipeCalories(item, 1) : macros.calories;

    return (
        <div
            onClick={() => onSelect(item)}
            className={`cursor-pointer ${bgColorClass}`}
        >
            <div className="grid grid-cols-[minmax(0,1fr)_80px_auto] items-center gap-2 px-2 py-1">
                {/* Food name and thumb */}
                <div className="flex flex-col min-w-0">
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
                    {/* Subtext line */}
                    <div className="flex items-center min-h-[18px] text-xs text-gray-500">
                        {isBranded ? (
                            <span>{subtext}</span>
                        ) : (
                            <span className="opacity-0">placeholder</span>
                        )}
                    </div>
                </div>
                {/* Calories only, right-aligned */}
                <div className="flex flex-col items-end justify-center">
                    <span className="flex items-baseline">
                        <span className="font-mono text-base text-right">{calories}</span>
                        <span className="ml-1 text-xs text-gray-500">cal</span>
                    </span>
                </div>
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

const ExerciseFilterControls = ({ options = {}, filters, setFilters, onFilterChange, isExpanded, onToggleExpanded }) => {
    // Deduplicate SVG muscle groups by display name
    const seen = new Set();
    const uniqueSvgGroups = (options.targets || []).filter(svgGroup => {
        const displayName = getSvgGroupDisplayName(svgGroup);
        if (seen.has(displayName)) return false;
        seen.add(displayName);
        return true;
    });

    return (
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
                    <span>Filter by Muscle Group / Equipment</span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {/* Filter Controls */}
            {isExpanded && (
                <div className="flex flex-col sm:flex-row gap-2 mt-2 p-3 border rounded-md bg-gray-50">
                    <Select
                        value={filters.targetCategory || 'all'}
                        onValueChange={(value) => onFilterChange('targetCategory', value === 'all' ? '' : value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by Muscle Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Muscle Groups</SelectItem>
                            {uniqueSvgGroups.map((svgGroup) => (
                                <SelectItem key={svgGroup} value={svgGroup}>
                                    {getSvgGroupDisplayName(svgGroup)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FilterSelect
                        placeholder="Filter by Equipment Category"
                        value={filters.equipmentCategory}
                        options={options.equipmentCategories}
                        onValueChange={(value) => onFilterChange('equipmentCategory', value)}
                        onClear={() => onFilterChange('equipmentCategory', '')}
                    />
                </div>
            )}
        </div>
    );
};

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
    handleNutrientsSearch,
    handleSelect,
    isLoading,
    nutrientsLoading,
    userProfile,
    togglePin,
    getFoodMacros,
    placeholder,
    filters,
    setFilters,
    filterOptions,
    laggingMuscles = []
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const { toast } = useToast();

    // NOTE: The search logic here is getting quite complex and could benefit from refactoring into smaller, more maintainable hooks or utility functions, especially as more features are added (filters, fuzzy matching, etc).

    useEffect(() => {
        if (searchQuery.length > 0) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [searchQuery]);

    const handleFilterChange = (filterType, value) => {
        setFilters[filterType](value);
        if (value) {
            setSearchQuery(''); // Clear text query when a filter is applied
        }
    };

    const handleToggleFilterExpanded = () => {
        setIsFilterExpanded(!isFilterExpanded);
    };

    const ResultComponent = type === 'food' ? FoodResult : null; // We'll handle exercise below

    // Only show up to 40 results total
    const paginatedResults = searchResults.slice(0, 40);
    
    // Final deduplication to prevent duplicate key warnings
    const uniqueResults = paginatedResults.reduce((acc, item, index) => {
      const key = type === 'food' ? (item.id || item.food_name || `food-${index}`) : (item.id || `exercise-${index}`);
      if (!acc.find(existing => {
        const existingKey = type === 'food' ? (existing.id || existing.food_name) : existing.id;
        return existingKey === key;
      })) {
        acc.push(item);
      }
      return acc;
    }, []);
    
    const canShowMore = visibleCount < Math.min(20, searchResults.length);

    // Show loading state in search results area
    const showLoadingInResults = isLoading && searchQuery.length > 0;

    return (
        <div className="relative">
            <ExerciseLibraryAdditionModal
                open={showAddExerciseModal}
                onOpenChange={setShowAddExerciseModal}
                searchQuery={searchQuery}
            />
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverAnchor asChild>
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-grow">
                            <Input
                                type="text"
                                placeholder={placeholder}
                                value={searchQuery}
                                onChange={(e) => {
                                    if (e.target.value.length <= 100) {
                                        setSearchQuery(e.target.value);
                                        setVisibleCount(10);
                                    } else {
                                        toast({
                                            title: "Query Too Long",
                                            description: "Please limit your input to 100 characters.",
                                            variant: "destructive"
                                        });
                                    }
                                }}
                                onFocus={() => setIsOpen(true)}
                                maxLength={100}
                                className={`${nutrientsLoading ? 'border-equipment bg-equipment' : ''}`}
                            />
                            {nutrientsLoading && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-equipment" />
                                </div>
                            )}
                        </div>
                        {type === 'exercise' && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowAddExerciseModal(true)}
                                title="Add Exercise to Library"
                                className="ml-1"
                            >
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                            </Button>
                        )}
                        {type === 'food' && (
                            <>
                                <Button 
                                    onClick={handleApiSearch} 
                                    disabled={isLoading || nutrientsLoading || !searchQuery.trim()}
                                    className="min-w-[80px]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        'Search'
                                    )}
                                </Button>
                                <Button 
                                    onClick={handleNutrientsSearch} 
                                    disabled={isLoading || nutrientsLoading || !searchQuery.trim()}
                                    variant="secondary"
                                    className="min-w-[100px]"
                                >
                                    {nutrientsLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Foods'
                                    )}
                                </Button>
                            </>
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
                    <div style={{ maxHeight: '400px', minHeight: '200px', overflowY: 'auto' }}>
                        {showLoadingInResults && (
                            <div className="p-4 text-sm text-center flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Searching for foods...</span>
                            </div>
                        )}
                        {!showLoadingInResults && searchResults.length === 0 && searchQuery && (
                            <div className="p-4 text-sm text-center text-gray-500">
                                No results found. Try a different search term.
                            </div>
                        )}
                        {/* Render exercise results using ExerciseDisplay with lagging/XP if applicable */}
                        {!showLoadingInResults && type === 'exercise' && uniqueResults.map((item, index) => {
                          // Find lagging muscle match for this exercise
                          let laggingType, bonusXP;
                          if (item.target) {
                            const match = laggingMuscles.find(lag => lag.muscle && item.target.toLowerCase().includes(lag.muscle));
                            if (match) {
                              laggingType = match.laggingType;
                              bonusXP = match.bonus;
                            }
                          }
                          if (!laggingType && Array.isArray(item.secondaryMuscles)) {
                            for (const sec of item.secondaryMuscles) {
                              const match = laggingMuscles.find(lag => lag.muscle && sec.toLowerCase().includes(lag.muscle));
                              if (match) {
                                laggingType = match.laggingType;
                                bonusXP = match.bonus;
                                break;
                              }
                            }
                          }
                          return (
                            <ExerciseDisplay
                              key={item.id || `exercise-${index}`}
                              exercise={item}
                              variant="row"
                              showPinIcon={true}
                              showCategory={true}
                              showBodyPart={true}
                              showSecondaryMuscles={true}
                              onPinToggle={() => togglePin(item.id)}
                              onClick={() => {
                                handleSelect(item);
                                setSearchQuery('');
                                setIsOpen(false);
                              }}
                              userProfile={userProfile}
                              className="mb-2"
                              bonusXP={bonusXP}
                              laggingType={laggingType}
                            />
                          );
                        })}
                        {/* Render food results as before */}
                        {!showLoadingInResults && type === 'food' && uniqueResults.map((item, index) => (
                          <FoodResult
                            key={item.id || item.food_name || `food-${index}`}
                            item={item}
                            onSelect={(selectedItem) => {
                              handleSelect(selectedItem);
                              setSearchQuery('');
                              setIsOpen(false);
                            }}
                            userProfile={userProfile}
                            togglePin={togglePin}
                            getFoodMacros={getFoodMacros}
                          />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
} 