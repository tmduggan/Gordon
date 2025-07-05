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

interface SearchWrapperProps {
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

export default function SearchWrapper({
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
}: SearchWrapperProps) {
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

  return null;
} 