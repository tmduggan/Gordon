import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, setDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const EXERCISE_DB_BASE_URL = 'https://exercisedb.p.rapidapi.com';

export default function ExerciseLibrary({ onExerciseAdd }) {
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseResults, setExerciseResults] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [localExercises, setLocalExercises] = useState([]);

  // Load local exercises from Firestore
  useEffect(() => {
    const loadLocalExercises = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'exerciseLibrary'));
        const exercises = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocalExercises(exercises);
      } catch (error) {
        console.error('Error loading local exercises:', error);
      }
    };
    loadLocalExercises();
  }, []);

  // Search ExerciseDB API
  const searchExerciseDB = async (query) => {
    if (!query.trim()) return;
    
    setApiLoading(true);
    try {
      const response = await fetch(`${EXERCISE_DB_BASE_URL}/exercises/name/${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY', // You'll need to add this to your environment
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('ExerciseDB API response:', data);
      
      // Filter out exercises that already exist in local database
      const newExercises = data.filter(apiExercise => 
        !localExercises.some(localExercise => localExercise.id === apiExercise.id)
      );
      
      setExerciseResults(newExercises);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching from ExerciseDB:', error);
      // For now, let's use the sample data from the JSON file
      const sampleExercises = [
        {
          "bodyPart": "chest",
          "equipment": "barbell",
          "gifUrl": "https://v2.exercisedb.io/image/8DybE1ln2WAE-s",
          "id": "0025",
          "name": "barbell bench press",
          "target": "pectorals",
          "secondaryMuscles": ["triceps", "shoulders"],
          "instructions": [
            "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
            "Grasp the barbell with an overhand grip slightly wider than shoulder-width apart.",
            "Lift the barbell off the rack and hold it directly above your chest with your arms fully extended.",
            "Lower the barbell slowly towards your chest, keeping your elbows tucked in.",
            "Pause for a moment when the barbell touches your chest.",
            "Push the barbell back up to the starting position by extending your arms.",
            "Repeat for the desired number of repetitions."
          ],
          "description": "The barbell bench press is a classic compound exercise that primarily targets the pectoral muscles, while also engaging the triceps and shoulders. It is performed by lying on a bench and pressing a barbell up and down in a controlled manner.",
          "difficulty": "intermediate",
          "category": "strength"
        },
        {
          "bodyPart": "chest",
          "equipment": "barbell",
          "gifUrl": "https://v2.exercisedb.io/image/ymk7PvhHVdQpbj",
          "id": "0047",
          "name": "barbell incline bench press",
          "target": "pectorals",
          "secondaryMuscles": ["shoulders", "triceps"],
          "instructions": [
            "Set up an incline bench at a 45-degree angle.",
            "Lie down on the bench with your feet flat on the ground.",
            "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
            "Unrack the barbell and lower it slowly towards your chest, keeping your elbows at a 45-degree angle.",
            "Pause for a moment at the bottom, then push the barbell back up to the starting position.",
            "Repeat for the desired number of repetitions."
          ],
          "description": "The barbell incline bench press is a compound upper-body exercise that targets the upper portion of the pectoral muscles, with secondary emphasis on the shoulders and triceps. It is performed on an incline bench using a barbell, making it a staple in strength training routines for developing chest size and strength.",
          "difficulty": "intermediate",
          "category": "strength"
        }
      ];
      
      const filteredSample = sampleExercises.filter(exercise => 
        exercise.name.toLowerCase().includes(query.toLowerCase()) &&
        !localExercises.some(localExercise => localExercise.id === exercise.id)
      );
      
      setExerciseResults(filteredSample);
      setShowDropdown(true);
    } finally {
      setApiLoading(false);
    }
  };

  // Save exercise to Firestore
  const saveExerciseToLibrary = async (exercise) => {
    try {
      // Check if exercise already exists
      const exerciseRef = doc(db, 'exerciseLibrary', exercise.id);
      const exerciseDoc = await getDoc(exerciseRef);
      
      if (!exerciseDoc.exists()) {
        // Save the complete exercise object with all fields
        await setDoc(exerciseRef, {
          ...exercise,
          // Add any additional fields we might want
          savedAt: new Date().toISOString(),
          source: 'exercisedb'
        });
        
        // Update local state
        setLocalExercises(prev => [...prev, exercise]);
        console.log('Exercise saved to library:', exercise.name);
      } else {
        console.log('Exercise already exists in library:', exercise.name);
      }
      
      return exercise.id;
    } catch (error) {
      console.error('Error saving exercise to library:', error);
      return null;
    }
  };

  // Handle exercise selection
  const handleSelectExercise = async (exercise) => {
    // Save to library first
    await saveExerciseToLibrary(exercise);
    
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

  // Search local exercises
  const searchLocalExercises = (query) => {
    if (!query.trim()) {
      setShowDropdown(false);
      return;
    }
    
    const filtered = localExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(query.toLowerCase()) ||
      exercise.target.toLowerCase().includes(query.toLowerCase()) ||
      exercise.bodyPart.toLowerCase().includes(query.toLowerCase())
    );
    
    setExerciseResults(filtered);
    setShowDropdown(true);
  };

  // Combined search function
  const handleSearch = async (query) => {
    setExerciseQuery(query);
    
    if (!query.trim()) {
      setShowDropdown(false);
      return;
    }
    
    // First search local exercises
    searchLocalExercises(query);
    
    // Then search API (with debouncing)
    const timeoutId = setTimeout(() => {
      searchExerciseDB(query);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  return {
    exerciseQuery,
    setExerciseQuery,
    exerciseResults,
    apiLoading,
    showDropdown,
    setShowDropdown,
    localExercises,
    searchExerciseDB,
    saveExerciseToLibrary,
    handleSelectExercise,
    handleSearch,
    searchLocalExercises
  };
} 