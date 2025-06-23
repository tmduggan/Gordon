import React, { useMemo } from 'react';
import MuscleMap from './MuscleMap';
import useAuthStore from '../../store/useAuthStore';
import { muscleMapping } from '../../utils/muscleMapping';

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
        if (libraryScores[libraryMuscle]) {
          totalScore += libraryScores[libraryMuscle];
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