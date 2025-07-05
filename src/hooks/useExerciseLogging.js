import { useState } from 'react';
import { saveWorkoutLog } from '../firebase/firestore/logExerciseEntry';
import { calculateExerciseScore } from '../services/exercise/exerciseService';
import { updatePersonalBests } from '../services/gamification/exerciseBestsService';
import { addWorkoutToMuscleReps } from '../services/gamification/exerciseScoringService';
import useAuthStore from '../store/useAuthStore';
import { useToast } from './useToast';

export default function useExerciseLogging(
  exerciseLibrary,
  exerciseHistory,
  cart,
  search,
  dateTimePicker
) {
  const { user, userProfile, saveUserProfile, addXP } = useAuthStore();
  const { toast } = useToast();
  const [currentLogData, setCurrentLogData] = useState({}); // For exercise cart inputs

  const handleSelect = (exercise) => {
    cart.addToCart(exercise);
    setCurrentLogData((prev) => ({
      ...prev,
      [exercise.id]:
        exercise.category && exercise.category.toLowerCase() === 'cardio'
          ? { duration: '' }
          : { sets: [{ weight: '', reps: '' }] },
    }));
    if (search && search.clearSearch) {
      search.clearSearch();
    }
  };

  const logCart = async () => {
    const timestamp = dateTimePicker.getLogTimestamp();
    const userWorkoutHistory = exerciseHistory.logs; // All past logs
    let updatedProfile = { ...userProfile };
    let profileReps = updatedProfile.muscleReps || {};
    let totalXP = 0;

    for (const item of cart.cart) {
      const exerciseDetailsFromCart = currentLogData[item.id] || {};
      const exerciseDetailsFromLib =
        exerciseLibrary.items.find((e) => e.id === item.id) || {};

      const workoutToScore = {
        sets: exerciseDetailsFromCart.sets || [],
        duration: exerciseDetailsFromCart.duration || null,
        timestamp,
      };

      // Calculate XP using the service
      const score = calculateExerciseScore(
        workoutToScore,
        exerciseDetailsFromLib
      );
      totalXP += score;

      // --- Update Muscle Reps ---
      profileReps = addWorkoutToMuscleReps(
        workoutToScore,
        exerciseDetailsFromLib,
        profileReps
      );
      // --- End Reps Update ---

      // Update personal bests if this workout has sets
      if (workoutToScore.sets && workoutToScore.sets.length > 0) {
        const bestSet = workoutToScore.sets.reduce((best, set) => {
          const setValue = (set.weight || 0) * (1 + (set.reps || 0) / 30); // 1RM calculation
          const bestValue = (best.weight || 0) * (1 + (best.reps || 0) / 30);
          return setValue > bestValue ? set : best;
        }, {});

        updatedProfile = updatePersonalBests(
          item.id,
          bestSet,
          exerciseDetailsFromLib,
          updatedProfile
        );
      }

      const logToSave = {
        userId: user.uid,
        exerciseId: item.id,
        timestamp,
        sets: workoutToScore.sets,
        duration: workoutToScore.duration,
        score,
      };

      try {
        await saveWorkoutLog(logToSave);
        toast({
          title: `+${score} XP!`,
          description: `Logged ${item.name}.`,
        });
      } catch (error) {
        console.error('Error saving workout log:', error);
      }
    }

    // Add total XP to user's profile
    if (totalXP > 0) {
      await addXP(totalXP);
    }

    // Save updated profile with new personal bests and muscle scores
    updatedProfile.muscleReps = profileReps;
    await saveUserProfile(updatedProfile);

    cart.clearCart();
    setCurrentLogData({});
  };

  const cartProps = {
    logData: currentLogData,
    onLogDataChange: (id, data) =>
      setCurrentLogData((prev) => ({ ...prev, [id]: data })),
  };

  return {
    handleSelect,
    logCart,
    cartProps,
  };
}
