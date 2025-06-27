import React, { useMemo } from 'react';
import MuscleMap from './MuscleMap';
import useAuthStore from '../../../store/useAuthStore';
import { muscleMapping } from '../../../utils/muscleMapping';
import { getMuscleScore } from '../../../services/gamification/muscleScoreService';

export default function MuscleChartDisplay({ className = "" }) {
  const { userProfile } = useAuthStore();

  const { normalizedScores, rawScores } = useMemo(() => {
    const libraryScores = userProfile?.muscleScores || {};
    
    // Map library muscle scores to SVG muscle scores
    const svgScores = {};
    
    // For each SVG muscle group, sum up scores from all mapped library muscles
    Object.entries(muscleMapping).forEach(([svgMuscle, libraryMuscles]) => {
      let totalScore = 0;
      libraryMuscles.forEach(libraryMuscle => {
        // Use lifetime score for the muscle chart display
        const score = getMuscleScore(libraryScores, libraryMuscle, 'lifetime');
        if (score > 0) {
          totalScore += score;
        }
      });
      if (totalScore > 0) {
        svgScores[svgMuscle] = totalScore;
      }
    });

    const normalized = { ...svgScores };
    const maxScore = Math.max(...Object.values(normalized).filter(v => typeof v === 'number'), 1);
    
    if (maxScore > 0) {
      for (const muscle in normalized) {
        normalized[muscle] = (normalized[muscle] || 0) / maxScore;
      }
    }

    return { normalizedScores: normalized, rawScores: svgScores };
  }, [userProfile]);

  return (
    <div className={`w-full aspect-[5/3] ${className}`}>
      <MuscleMap 
        muscleScores={normalizedScores}
        rawMuscleScores={rawScores}
      />
    </div>
  );
} 