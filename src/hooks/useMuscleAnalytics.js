import { useMemo } from 'react';
import useAuthStore from '../store/useAuthStore';
import { getMuscleScore } from '../services/gamification/muscleScoreService';

export default function useMuscleAnalytics() {
  const { userProfile } = useAuthStore();

  const muscleScores = useMemo(() => {
    const profileScores = userProfile?.muscleScores || {};
    
    // Convert time-based scores to simple scores for backward compatibility
    const scores = {};
    Object.entries(profileScores).forEach(([muscle, timeScores]) => {
      // Use lifetime score for the main score
      scores[muscle] = timeScores.lifetime || 0;
    });

    console.log('Muscle Analytics: Using profile scores', {
      muscleCount: Object.keys(scores).length,
      totalScore: Object.values(scores).reduce((sum, score) => sum + score, 0)
    });

    const maxScore = Math.max(...Object.values(scores), 1);

    const normalizedScores = Object.entries(scores).reduce((acc, [muscle, score]) => {
      acc[muscle] = score / maxScore;
      return acc;
    }, {});
    
    console.log('Normalized muscle scores:', normalizedScores);
    console.log('Max score:', maxScore);
    
    return { scores, maxScore, normalizedScores };
  }, [userProfile]);

  return {
    muscleScores,
    loading: false // No longer loading from external data
  };
} 