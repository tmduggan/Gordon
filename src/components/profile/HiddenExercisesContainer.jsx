import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EyeOff } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useLibrary from '../../hooks/useLibrary';
import ExerciseDisplay from '../exercise/ExerciseDisplay';

export default function HiddenExercisesContainer() {
  const { userProfile, unhideExercise, getRemainingHides } = useAuthStore();
  const exerciseLibrary = useLibrary('exercise');
  const [hiddenExercises, setHiddenExercises] = useState([]);
  const [loading, setLoading] = useState({});

  // Get hidden exercises with full details
  useEffect(() => {
    if (exerciseLibrary.items && userProfile?.hiddenExercises) {
      const hiddenWithDetails = userProfile.hiddenExercises
        .map(exerciseId => {
          const exercise = exerciseLibrary.items.find(e => e.id === exerciseId);
          return exercise ? { ...exercise, id: exerciseId } : null;
        })
        .filter(Boolean);
      setHiddenExercises(hiddenWithDetails);
    }
  }, [exerciseLibrary.items, userProfile?.hiddenExercises]);

  const handleUnhide = async (exerciseId) => {
    setLoading(prev => ({ ...prev, [exerciseId]: true }));
    try {
      await unhideExercise(exerciseId);
      // Remove from local state
      setHiddenExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    } catch (error) {
      console.error('Error unhiding exercise:', error);
    } finally {
      setLoading(prev => ({ ...prev, [exerciseId]: false }));
    }
  };

  const remainingHides = getRemainingHides();
  const isBasic = userProfile?.subscription?.status === 'basic';

  if (hiddenExercises.length === 0) {
    return null; // Don't render anything if no hidden exercises
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <EyeOff className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-sm">Hidden Exercises</h3>
        {isBasic && (
          <span className="text-xs text-gray-500 ml-auto">
            Remaining hides today: {remainingHides}/1
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {hiddenExercises.map((exercise) => (
          <ExerciseDisplay
            key={exercise.id}
            exercise={exercise}
            showXP={false}
            showUnhideButton={true}
            onUnhide={handleUnhide}
            loading={loading[exercise.id]}
          />
        ))}
      </div>
    </div>
  );
} 