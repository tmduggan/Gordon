import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import useLibrary from '../../../hooks/useLibrary';
import { useToast } from '../../../hooks/useToast';
import { normalizeFoodForDisplay } from '../../../utils/foodUtils';
import FoodItemDisplay from '../Food/FoodItemDisplay';
import FoodItemTooltip from '../Food/FoodItemTooltip';
import { Card } from '@/components/ui/card';
import { SearchRowRight, SearchRowWrapper } from './Search';

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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsOpen(isFocused || searchQuery.length > 0);
  }, [isFocused, searchQuery]);

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
                ref={inputRef}
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
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
          side="bottom"
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
              uniqueResults.map((item, index) => {
                const normalized = normalizeFoodForDisplay(item);
                const isPinned = !!(item.isPinned || (userProfile?.pinnedFoods?.includes(item.id || '')));
                const isRecipe = !!item.isRecipe;
                const calories = getFoodMacros(normalized).calories;
                return (
                  <SearchRowWrapper
                    key={item.id || item.food_name || `food-${index}`}
                    isPinned={isPinned}
                    isRecipe={isRecipe}
                    onClick={() => {
                      handleSelect(item);
                      setSearchQuery('');
                      setIsOpen(false);
                    }}
                  >
                    <FoodItemTooltip food={normalized}>
                      <div className="flex flex-1 min-w-0">
                        <FoodItemDisplay
                          food={normalized}
                          context="search"
                          showActions={false}
                        />
                      </div>
                    </FoodItemTooltip>
                    <SearchRowRight
                      isPinned={isPinned}
                      onPin={item.id && !isRecipe ? (() => togglePin(item.id!)) : () => {}}
                      isRecipe={isRecipe}
                    >
                      <span className="font-mono text-base text-right">{calories}</span>
                      <span className="ml-1 text-xs text-gray-500">cal</span>
                    </SearchRowRight>
                  </SearchRowWrapper>
                );
              })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 