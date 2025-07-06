import { useMemo } from 'react';
import useAuthStore from '../store/useAuthStore';

interface MuscleScores {
  [muscleName: string]: {
    today: number;
    '3day': number;
    '7day': number;
  };
}

interface MuscleAnalytics {
  reps: Record<string, number>;
  maxReps: number;
  normalizedReps: Record<string, number>;
}

interface UseMuscleAnalyticsReturn {
  muscleReps: MuscleAnalytics;
  loading: boolean;
}

export default function useMuscleAnalytics(): UseMuscleAnalyticsReturn {
  const { userProfile } = useAuthStore();

  const muscleReps = useMemo((): MuscleAnalytics => {
    const profileScores: MuscleScores = userProfile?.muscleScores || {};

    // Convert muscleScores to a simple reps object using weighted scoring
    // Weights: today (1.0), 3day (0.5), 7day (0.1)
    const reps: Record<string, number> = {};
    
    Object.entries(profileScores).forEach(([muscle, scores]) => {
      const todayPct = Math.min(scores.today, 60) / 60; // 60 reps = 100%
      const threeDayPct = (Math.min(scores['3day'], 120) / 120) * 0.5; // 120 reps = 50%
      const sevenDayPct = (Math.min(scores['7day'], 500) / 500) * 0.1; // 500 reps = 10%
      const weightedScore = todayPct + threeDayPct + sevenDayPct;
      reps[muscle] = Math.min(weightedScore, 1.0) * 100; // Convert to percentage
    });

    console.log('Muscle Analytics: Using profile scores', {
      muscleCount: Object.keys(reps).length,
      totalReps: Object.values(reps).reduce((sum, rep) => sum + rep, 0),
    });

    const maxReps = Math.max(...Object.values(reps), 1);

    const normalizedReps: Record<string, number> = Object.entries(reps).reduce((acc, [muscle, rep]) => {
      acc[muscle] = rep / maxReps;
      return acc;
    }, {} as Record<string, number>);

    console.log('Normalized muscle reps:', normalizedReps);
    console.log('Max reps:', maxReps);

    return { reps, maxReps, normalizedReps };
  }, [userProfile]);

  return {
    muscleReps,
    loading: false, // No longer loading from external data
  };
} 