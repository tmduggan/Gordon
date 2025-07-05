import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import useLibrary from '../../../hooks/useLibrary';
import { useToast } from '../../../hooks/useToast';

interface FoodItem {
  id?: string;
  food_name?: string;
  label?: string;
  name?: string;
  isRecipe?: boolean;
  isPinned?: boolean;
  photo?: {
    thumb?: string;
  };
  brand_name?: string;
  serving_qty?: number;
  serving_unit?: string;
  tags?: {
    food_group?: number;
  };
  food_group?: number;
  items?: Array<{
    id: string;
    quantity: number;
    isRecipe?: boolean;
  }>;
  servings?: number;
}

interface UserProfile {
  pinnedFoods?: string[];
  recipes?: Array<{
    id: string;
    servings?: number;
    items?: Array<{
      id: string;
      quantity: number;
      isRecipe?: boolean;
    }>;
  }>;
}

interface FoodResultProps {
  item: FoodItem;
  onSelect: (item: FoodItem) => void;
  userProfile?: UserProfile;
  togglePin: (id: string) => void;
  getFoodMacros: (item: FoodItem) => any;
}

interface FoodSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults?: FoodItem[];
  handleApiSearch: () => void;
  handleNutrientsSearch: () => void;
  handleSelect: (item: FoodItem) => void;
  isLoading: boolean;
  nutrientsLoading: boolean;
  userProfile?: UserProfile;
  togglePin: (id: string) => void;
  getFoodMacros: (item: FoodItem) => any;
  placeholder?: string;
}

const FoodResult = ({
  item,
  onSelect,
  userProfile,
  togglePin,
  getFoodMacros,
}: FoodResultProps) => {
  const foodName = item.isRecipe ? item.name : item.food_name || item.label;
  const isPinned = item.isPinned || userProfile?.pinnedFoods?.includes(item.id || '');
  const isRecipe = item.isRecipe;
  const thumb = item.photo?.thumb;
  const macros = getFoodMacros(item);
  const isBranded = !!item.brand_name;
  const foodLibrary = useLibrary('food');

  const formatQty = (qty: any): string => {
    if (typeof qty === 'number') {
      return qty % 1 === 0 ? qty.toString() : qty.toFixed(2);
    }
    if (!isNaN(Number(qty))) {
      const num = Number(qty);
      return num % 1 === 0 ? num.toString() : num.toFixed(2);
    }
    return qty || '';
  };

  const subtext = isBranded
    ? `${item.brand_name || ''}${item.serving_qty && item.serving_unit ? ', ' + formatQty(item.serving_qty) + ' ' + item.serving_unit : ''}`
    : '';

  let bgColorClass = 'hover:bg-accent';
  if (isPinned) {
    bgColorClass =
      'bg-equipment hover:bg-equipment/80 border-l-4 border-equipment';
  } else if (isRecipe) {
    bgColorClass =
      'bg-status-success hover:bg-status-success/80 border-l-4 border-status-success';
  }

  const getRecipeCalories = (recipe: FoodItem, servings: number = 1): number => {
    if (!recipe || !recipe.items) return 0;
    const recipeServings = recipe.servings || 1;
    let total = 0;
    recipe.items.forEach((ingredient) => {
      if (ingredient.isRecipe) {
        const nestedRecipe = userProfile?.recipes?.find(
          (r) => r.id === ingredient.id
        );
        if (nestedRecipe) {
          const nestedCals = getRecipeCalories(
            nestedRecipe,
            (ingredient.quantity / recipeServings) * servings
          );
          total += nestedCals;
        }
      } else {
        const food = foodLibrary.items.find((f: any) => f.id === ingredient.id);
        if (food) {
          const macros = getFoodMacros(food);
          total +=
            (macros.calories || 0) *
            ((ingredient.quantity / recipeServings) * servings);
        }
      }
    });
    return Math.round(total);
  };

  const calories = isRecipe ? getRecipeCalories(item, 1) : macros.calories;

  return (
    <div
      onClick={() => onSelect(item)}
      className={`cursor-pointer ${bgColorClass}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_80px_auto] items-center gap-2 px-2 py-1">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center min-w-0">
            {thumb ? (
              <img
                src={thumb}
                alt="food thumb"
                className="h-7 w-7 rounded object-cover mr-2 flex-shrink-0"
              />
            ) : (
              <div className="h-7 w-7 mr-2 flex-shrink-0 bg-gray-100 rounded" />
            )}
            <span className="truncate font-medium text-sm">
              {foodName}
              {(item.tags && item.tags.food_group !== undefined
                ? item.tags.food_group
                : item.food_group) !== undefined && (
                <span className="ml-1 text-xs text-gray-400">
                  fg:
                  {item.tags && item.tags.food_group !== undefined
                    ? item.tags.food_group
                    : item.food_group}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center min-h-[18px] text-xs text-gray-500">
            {isBranded ? (
              <span>{subtext}</span>
            ) : (
              <span className="opacity-0">placeholder</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end justify-center">
          <span className="flex items-baseline">
            <span className="font-mono text-base text-right">{calories}</span>
            <span className="ml-1 text-xs text-gray-500">cal</span>
          </span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          {isRecipe && (
            <span className="text-green-600 text-xs font-medium" title="Recipe">
              👨‍🍳
            </span>
          )}
          {item.id && !isRecipe && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                togglePin(item.id!);
              }}
              title={isPinned ? 'Unpin food' : 'Pin food'}
            >
              {isPinned ? '📌' : '📍'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function FoodSearch({
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
  placeholder = 'Search foods...',
}: FoodSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchQuery]);

  const uniqueResults = searchResults
    .slice(0, 40)
    .reduce((acc: FoodItem[], item, index) => {
      const key = item.id || item.food_name || `food-${index}`;
      if (
        !acc.find((existing) => {
          const existingKey = existing.id || existing.food_name;
          return existingKey === key;
        })
      ) {
        acc.push(item);
      }
      return acc;
    }, []);

  const showLoadingInResults = isLoading && searchQuery.length > 0;

  return (
    <div className="relative">
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
                  } else {
                    toast({
                      title: 'Query Too Long',
                      description: 'Please limit your input to 100 characters.',
                      variant: 'destructive',
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
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            style={{
              maxHeight: '400px',
              minHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {showLoadingInResults && (
              <div className="p-4 text-sm text-center flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching for foods...</span>
              </div>
            )}
            {!showLoadingInResults &&
              searchResults.length === 0 &&
              searchQuery && (
                <div className="p-4 text-sm text-center text-gray-500">
                  No results found. Try a different search term.
                </div>
              )}
            {!showLoadingInResults &&
              uniqueResults.map((item, index) => (
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