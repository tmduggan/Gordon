import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function ExerciseLibrary({ onExerciseAdd }) {
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseResults, setExerciseResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [localExercises, setLocalExercises] = useState([]);

  // Load local exercises from Firestore
  useEffect(() => {
    const loadLocalExercises = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'exerciseLibrary'));
        const exercises = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocalExercises(exercises);
        console.log(`✅ Loaded ${exercises.length} exercises from local library`);
      } catch (error) {
        console.error('❌ Error loading local exercises:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLocalExercises();
  }, []);

  // Search local exercises only
  const searchLocalExercises = (query) => {
    if (!query.trim()) {
      setShowDropdown(false);
      setExerciseResults([]);
      return;
    }
    
    const searchTerm = query.toLowerCase();
    const filtered = localExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.target.toLowerCase().includes(searchTerm) ||
      exercise.bodyPart.toLowerCase().includes(searchTerm) ||
      exercise.equipment.toLowerCase().includes(searchTerm) ||
      exercise.category.toLowerCase().includes(searchTerm) ||
      (exercise.secondaryMuscles && exercise.secondaryMuscles.some(muscle => 
        muscle.toLowerCase().includes(searchTerm)
      ))
    );
    
    setExerciseResults(filtered);
    setShowDropdown(true);
    console.log(`🔍 Found ${filtered.length} exercises matching "${query}"`);
  };

  // Handle exercise selection
  const handleSelectExercise = async (exercise) => {
    // Add to cart
    if (onExerciseAdd) {
      // Convert API exercise format to our internal format
      const exerciseForCart = {
        id: exercise.id,
        label: exercise.name,
        category: exercise.category || 'strength',
        muscleGroup: exercise.target,
        bodyPart: exercise.bodyPart,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        description: exercise.description,
        gifUrl: exercise.gifUrl,
        secondaryMuscles: exercise.secondaryMuscles,
        // Estimate calories per minute based on difficulty and body part
        caloriesPerMinute: estimateCaloriesPerMinute(exercise)
      };
      
      onExerciseAdd(exerciseForCart);
    }
    
    setShowDropdown(false);
    setExerciseQuery('');
  };

  // Estimate calories per minute based on exercise properties
  const estimateCaloriesPerMinute = (exercise) => {
    let baseCalories = 5; // Base calories per minute
    
    // Adjust based on difficulty
    switch (exercise.difficulty) {
      case 'beginner':
        baseCalories = 4;
        break;
      case 'intermediate':
        baseCalories = 6;
        break;
      case 'advanced':
        baseCalories = 8;
        break;
      default:
        baseCalories = 6;
    }
    
    // Adjust based on body part (compound movements burn more)
    if (exercise.bodyPart === 'cardio' || exercise.secondaryMuscles?.length > 2) {
      baseCalories += 2;
    }
    
    // Adjust based on equipment (heavier equipment = more calories)
    if (exercise.equipment === 'barbell' || exercise.equipment === 'dumbbell') {
      baseCalories += 1;
    }
    
    return baseCalories;
  };

  // Combined search function (local only)
  const handleSearch = (query) => {
    setExerciseQuery(query);
    searchLocalExercises(query);
  };

  return {
    exerciseQuery,
    setExerciseQuery,
    exerciseResults,
    loading,
    showDropdown,
    setShowDropdown,
    localExercises,
    handleSelectExercise,
    handleSearch,
    searchLocalExercises
  };
} 