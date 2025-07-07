import React from 'react';
import ExerciseSearch from './ExerciseSearch';
import FoodSearch from './FoodSearch';
import type { Food, Exercise, UserProfile } from '../../../types';

export type SearchType = 'food' | 'exercise';

interface SearchFilters {
  targetCategory: string;
  equipmentCategory: string;
}

interface SetFilters {
  targetCategory: (category: string) => void;
  equipmentCategory: (category: string) => void;
}

interface FilterOptions {
  [key: string]: any;
}

interface SearchProps {
  type: SearchType;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Food[] | Exercise[];
  handleApiSearch?: () => Promise<void>;
  handleNutrientsSearch?: () => Promise<void>;
  handleSelect: (item: Food | Exercise) => void;
  isLoading?: boolean;
  nutrientsLoading?: boolean;
  userProfile: UserProfile | null;
  togglePin: (item: Food | Exercise) => void;
  getFoodMacros?: (food: Food) => any;
  placeholder?: string;
  filters?: SearchFilters;
  setFilters?: SetFilters;
  filterOptions?: FilterOptions;
  laggingMuscles?: string[];
}

/**
 * @deprecated Use FoodSearch or ExerciseSearch instead
 * This wrapper maintains backward compatibility but uses the new efficient components internally
 */
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
  laggingMuscles = [],
}: SearchProps) {
  if (type === 'food') {
    return (
      <FoodSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults as Food[]}
        handleApiSearch={handleApiSearch}
        handleNutrientsSearch={handleNutrientsSearch}
        handleSelect={handleSelect}
        isLoading={isLoading}
        nutrientsLoading={nutrientsLoading}
        userProfile={userProfile}
        togglePin={togglePin}
        getFoodMacros={getFoodMacros}
        placeholder={placeholder}
      />
    );
  }

  if (type === 'exercise') {
    return (
      <ExerciseSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults as Exercise[]}
        handleSelect={handleSelect}
        userProfile={userProfile}
        togglePin={togglePin}
        placeholder={placeholder}
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        laggingMuscles={laggingMuscles}
      />
    );
  }

  console.warn(
    `Search: Unknown type "${type}". Use FoodSearch or ExerciseSearch instead.`
  );
  return null;
}

// Universal right-aligned row for search results (pin icon, highlight, etc.)
export function SearchRowRight({
  isPinned,
  onPin,
  isRecipe = false,
  children,
}: {
  isPinned: boolean;
  onPin: () => void;
  isRecipe?: boolean;
  children?: React.ReactNode;
}) {
  // Highlight: blue for pinned, green for recipe
  let highlightClass = '';
  if (isRecipe) highlightClass = 'bg-green-100';
  else if (isPinned) highlightClass = 'bg-blue-100';
  return (
    <div className={`flex items-center justify-end w-[90px] gap-2 text-right rounded ${highlightClass}`}>
      {children}
      <button
        aria-label={isPinned ? 'Unpin' : 'Pin'}
        onClick={onPin}
        className="ml-1 h-6 w-6 focus:outline-none"
        tabIndex={0}
        type="button"
      >
        <span className="text-lg">{isPinned ? '📌' : '📍'}</span>
      </button>
    </div>
  );
} 