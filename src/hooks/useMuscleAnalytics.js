import { useMemo } from 'react';
import useAuthStore from '../store/useAuthStore';

export default function useMuscleAnalytics() {
  const { userProfile } = useAuthStore();

  const muscleReps = useMemo(() => {
    const profileReps = userProfile?.muscleReps || {};
    
    // Now muscleReps is just a simple object with muscle names as keys and rep counts as values
    const reps = { ...profileReps };

    console.log('Muscle Analytics: Using profile reps', {
      muscleCount: Object.keys(reps).length,
      totalReps: Object.values(reps).reduce((sum, rep) => sum + rep, 0)
    });

    const maxReps = Math.max(...Object.values(reps), 1);

    const normalizedReps = Object.entries(reps).reduce((acc, [muscle, rep]) => {
      acc[muscle] = rep / maxReps;
      return acc;
    }, {});
    
    console.log('Normalized muscle reps:', normalizedReps);
    console.log('Max reps:', maxReps);
    
    return { reps, maxReps, normalizedReps };
  }, [userProfile]);

  return {
    muscleReps,
    loading: false // No longer loading from external data
  };
} 