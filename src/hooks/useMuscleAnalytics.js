import { useMemo } from 'react';
import useHistory from './fetchHistory';
import useLibrary from './fetchLibrary';

export default function useMuscleAnalytics() {
  const { logs: exerciseHistory, loading: historyLoading } = useHistory('exercise');
  const { items: exerciseLibrary, loading: libraryLoading } = useLibrary('exercise');

  const muscleScores = useMemo(() => {
    if (!exerciseHistory || exerciseHistory.length === 0 || !exerciseLibrary || exerciseLibrary.length === 0) {
      console.log('Muscle Analytics: No data available', {
        exerciseHistoryLength: exerciseHistory?.length || 0,
        exerciseLibraryLength: exerciseLibrary?.length || 0
      });
      return { scores: {}, maxScore: 0, normalizedScores: {} };
    }

    console.log('Muscle Analytics: Processing data', {
      exerciseHistoryLength: exerciseHistory.length,
      exerciseLibraryLength: exerciseLibrary.length
    });

    const allPrimaryTargets = new Set(exerciseLibrary.map(e => e.target?.toLowerCase()).filter(Boolean));

    const scores = exerciseHistory.reduce((acc, log) => {
      const exercise = exerciseLibrary.find(ex => ex.id === log.exerciseId);
      if (!exercise) return acc;

      const primaryTarget = exercise.target?.toLowerCase();
      const secondaryTargets = exercise.secondaryMuscles?.map(m => m.toLowerCase()) || [];
      const logScore = log.score || 0;

      if (primaryTarget) {
        acc[primaryTarget] = (acc[primaryTarget] || 0) + logScore;
      }

      secondaryTargets.forEach(muscle => {
        const weight = allPrimaryTargets.has(muscle) ? 0.5 : 1.0;
        acc[muscle] = (acc[muscle] || 0) + (logScore * weight);
      });

      return acc;
    }, {});

    console.log('Raw muscle scores:', scores);

    const maxScore = Math.max(...Object.values(scores), 1);

    const normalizedScores = Object.entries(scores).reduce((acc, [muscle, score]) => {
      acc[muscle] = score / maxScore;
      return acc;
    }, {});
    
    console.log('Normalized muscle scores:', normalizedScores);
    console.log('Max score:', maxScore);
    
    return { scores, maxScore, normalizedScores };
  }, [exerciseHistory, exerciseLibrary]);

  return {
    muscleScores,
    loading: historyLoading || libraryLoading
  };
} 