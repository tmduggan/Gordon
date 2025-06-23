import React, { useMemo } from 'react';
import MuscleMap from '../components/exercise/MuscleMap';
import { Card, CardContent } from '@/components/ui/card';
import useAuthStore from '../store/useAuthStore';
import { muscleMapping } from '../utils/muscleMapping';

export default function MuscleChartPage() {
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
    <div>
      <h1 className="text-2xl font-bold mb-4">Muscle Chart</h1>
      
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full" style={{ paddingTop: '100%' }}>
            <div className="absolute top-0 left-0 w-full h-full">
              <MuscleMap 
                muscleScores={normalizedScores}
                rawMuscleScores={rawScores}
              />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">This chart visualizes your training volume by muscle group. The more you train a muscle, the deeper the shade of red.</p>
        </CardContent>
      </Card>
    </div>
  );
} 