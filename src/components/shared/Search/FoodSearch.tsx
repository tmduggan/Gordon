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
import { normalizeFoodForDisplay } from '../../../utils/foodUtils';
import FoodItemDisplay from '../Food/FoodItemDisplay';
import FoodItemTooltip from '../Food/FoodItemTooltip';
import { Card } from '@/components/ui/card';

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
              uniqueResults.map((item, index) => {
                const normalized = normalizeFoodForDisplay(item);
                const isPinned = item.isPinned || userProfile?.pinnedFoods?.includes(item.id || '');
                return (
                  <div
                    key={item.id || item.food_name || `food-${index}`}
                    className={`cursor-pointer hover:bg-accent`}
                    onClick={() => {
                      handleSelect(item);
                      setSearchQuery('');
                      setIsOpen(false);
                    }}
                  >
                    <FoodItemTooltip food={normalized}>
                      <FoodItemDisplay
                        food={normalized}
                        context="search"
                        isPinned={isPinned}
                        showActions={true}
                        onPin={item.id && !item.isRecipe ? (() => togglePin(item.id!)) : undefined}
                        calories={normalized.calories || normalized.macros?.calories || 0}
                      />
                    </FoodItemTooltip>
                  </div>
                );
              })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 