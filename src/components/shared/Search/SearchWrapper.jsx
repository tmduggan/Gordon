import React from 'react';
import ExerciseSearch from './ExerciseSearch';
import FoodSearch from './FoodSearch';

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
}) {
  if (type === 'food') {
    return (
      <FoodSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
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
        searchResults={searchResults}
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
