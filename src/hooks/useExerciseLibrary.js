import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useExerciseLibrary({ onExerciseAdd }) {
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseResults, setExerciseResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [localExercises, setLocalExercises] = useState([]);

  useEffect(() => {
    const loadLocalExercises = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'exerciseLibrary'));
        const exercises = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  const searchLocalExercises = useCallback((query) => {
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
      (exercise.secondaryMuscles && exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(searchTerm)))
    );
    setExerciseResults(filtered);
    setShowDropdown(true);
  }, [localExercises]);

  useEffect(() => {
    searchLocalExercises(exerciseQuery);
  }, [exerciseQuery, searchLocalExercises]);

  const handleSelectExercise = (exercise) => {
    if (onExerciseAdd) {
      const exerciseForCart = {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category || 'strength',
        muscleGroup: exercise.target,
        bodyPart: exercise.bodyPart,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        description: exercise.description,
        gifUrl: exercise.gifUrl,
        secondaryMuscles: exercise.secondaryMuscles,
      };
      onExerciseAdd(exerciseForCart);
    }
    setShowDropdown(false);
    setExerciseQuery('');
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
  };
} 