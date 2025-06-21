import { useState, useCallback, useEffect } from 'react';

export function useExerciseSearch(exerciseProvider, { onExerciseAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { localExercises } = exerciseProvider;

  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const searchTerm = query.toLowerCase();
    const filtered = localExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.target.toLowerCase().includes(searchTerm) ||
      exercise.bodyPart.toLowerCase().includes(searchTerm) ||
      exercise.equipment.toLowerCase().includes(searchTerm) ||
      exercise.category.toLowerCase().includes(searchTerm) ||
      (exercise.secondaryMuscles && exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(searchTerm)))
    );
    setSearchResults(filtered);
    setShowDropdown(true);
    setSearchLoading(false);
  }, [localExercises]);

  const estimateCaloriesPerMinute = (exercise) => {
    let baseCalories = 5;
    switch (exercise.difficulty) {
      case 'beginner': baseCalories = 4; break;
      case 'intermediate': baseCalories = 6; break;
      case 'advanced': baseCalories = 8; break;
      default: baseCalories = 6;
    }
    if (exercise.bodyPart === 'cardio' || exercise.secondaryMuscles?.length > 2) baseCalories += 2;
    if (exercise.equipment === 'barbell' || exercise.equipment === 'dumbbell') baseCalories += 1;
    return baseCalories;
  };

  const handleSelectExercise = (exercise) => {
    if (onExerciseAdd) {
      const exerciseForCart = {
        ...exercise,
        name: exercise.name,
        caloriesPerMinute: estimateCaloriesPerMinute(exercise)
      };
      onExerciseAdd(exerciseForCart);
    }
    setShowDropdown(false);
    setSearchQuery('');
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    handleSearch,
    showDropdown,
    handleSelectExercise
  };
} 