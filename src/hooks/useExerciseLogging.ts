import { useState } from 'react';
import { saveWorkoutLog } from '../firebase/firestore/logExerciseEntry';
import { logExercise } from '../services/exercise/exerciseLoggingService';
import useAuthStore from '../store/useAuthStore';
import { useToast } from './useToast';
import type { 
  Exercise, 
  WorkoutData, 
  ExerciseLog,
  UserProfile,
  UseExerciseLoggingReturn,
  CartItem
} from '../types';

interface ExerciseLibrary {
  items: Exercise[];
}

interface ExerciseHistory {
  logs: ExerciseLog[];
}

interface Cart {
  cart: CartItem[];
  addToCart: (item: Exercise) => void;
  clearCart: () => void;
}

interface Search {
  clearSearch?: () => void;
}

interface DateTimePicker {
  getLogTimestamp: () => Date;
}

interface LogData {
  [exerciseId: string]: {
    sets?: Array<{ weight: string | number; reps: string | number }>;
    duration?: string | number;
  };
}

export default function useExerciseLogging(
  exerciseLibrary: ExerciseLibrary,
  exerciseHistory: ExerciseHistory,
  cart: Cart,
  search?: Search,
  dateTimePicker?: DateTimePicker
): UseExerciseLoggingReturn {
  const { user, userProfile, saveUserProfile, addXP } = useAuthStore();
  const { toast } = useToast();
  const [currentLogData, setCurrentLogData] = useState<LogData>({});
  const [logs, setLogs] = useState<ExerciseLog[]>([]);

  const handleSelect = (exercise: Exercise): void => {
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

  const logCart = async (): Promise<void> => {
    if (!dateTimePicker || !userProfile) return;
    
    const timestamp = dateTimePicker.getLogTimestamp();
    let updatedProfile: UserProfile = { ...userProfile };
    let totalXP = 0;

    for (const item of cart.cart) {
      const exerciseDetailsFromCart = currentLogData[item.id] || {};
      const exerciseDetailsFromLib =
        exerciseLibrary.items.find((e) => e.id === item.id);
      
      if (!exerciseDetailsFromLib) {
        console.error(`Exercise not found in library: ${item.id}`);
        continue;
      }

      const workoutToScore: WorkoutData = {
        sets: exerciseDetailsFromCart.sets || [],
        duration: exerciseDetailsFromCart.duration ? Number(exerciseDetailsFromCart.duration) : null,
        timestamp,
      };

      try {
        // Use centralized exercise logging service
        const result = await logExercise(
          workoutToScore,
          exerciseDetailsFromLib,
          updatedProfile,
          user.uid,
          timestamp
        );

        // Save the exercise log
        await saveWorkoutLog(result.exerciseLog);
        
        // Update profile and XP
        updatedProfile = result.updatedProfile;
        totalXP += result.totalXP;

        toast({
          title: `+${result.totalXP} XP!`,
          description: `Logged ${item.name}.`,
        });
      } catch (error) {
        console.error('Error logging exercise:', error);
      }
    }

    // Add total XP to user's profile
    if (totalXP > 0) {
      await addXP(totalXP);
    }

    // Save updated profile with new muscle scores and personal bests
    await saveUserProfile(updatedProfile);

    cart.clearCart();
    setCurrentLogData({});
  };

  const cartProps = {
    logData: currentLogData,
    onLogDataChange: (id: string, data: any) =>
      setCurrentLogData((prev) => ({ ...prev, [id]: data })),
  };

  function addLog(log: ExerciseLog) {
    setLogs((prev) => [...prev, log]);
  }

  function removeLog(id: string) {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  }

  return {
    handleSelect,
    logCart,
    cartProps,
  };
} 