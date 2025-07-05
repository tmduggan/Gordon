import { useMemo } from 'react';
import useAuthStore from '../store/useAuthStore';

interface MuscleReps {
  [muscleName: string]: number;
}

interface MuscleAnalytics {
  reps: MuscleReps;
  maxReps: number;
  normalizedReps: MuscleReps;
}

interface UseMuscleAnalyticsReturn {
  muscleReps: MuscleAnalytics;
  loading: boolean;
}

export default function useMuscleAnalytics(): UseMuscleAnalyticsReturn {
  const { userProfile } = useAuthStore();

  const muscleReps = useMemo((): MuscleAnalytics => {
    const profileReps: MuscleReps = userProfile?.muscleReps || {};

    // Now muscleReps is just a simple object with muscle names as keys and rep counts as values
    const reps: MuscleReps = { ...profileReps };

    console.log('Muscle Analytics: Using profile reps', {
      muscleCount: Object.keys(reps).length,
      totalReps: Object.values(reps).reduce((sum, rep) => sum + rep, 0),
    });

    const maxReps = Math.max(...Object.values(reps), 1);

    const normalizedReps: MuscleReps = Object.entries(reps).reduce((acc, [muscle, rep]) => {
      acc[muscle] = rep / maxReps;
      return acc;
    }, {} as MuscleReps);

    console.log('Normalized muscle reps:', normalizedReps);
    console.log('Max reps:', maxReps);

    return { reps, maxReps, normalizedReps };
  }, [userProfile]);

  return {
    muscleReps,
    loading: false, // No longer loading from external data
  };
} 