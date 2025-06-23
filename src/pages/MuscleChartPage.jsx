import React, { useState, useMemo } from 'react';
import { muscleMapping } from '../utils/muscleMapping'; // Import the new mapping
import useLibrary from '../hooks/fetchLibrary'; // Custom hook to fetch exercise library
import useHistory from '../hooks/fetchHistory'; // Custom hook to fetch workout history
import MuscleMap from '../components/exercise/MuscleMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Generate a definitive list of all unique SVG IDs from our mapping
const ALL_SVG_MUSCLE_IDS = [...new Set(Object.values(muscleMapping).flat())];

export default function MuscleChartPage() {
  const { data: exerciseLibrary, loading: libraryLoading } = useLibrary();
  const { data: history, loading: historyLoading } = useHistory();
  const [view, setView] = useState('front');

  const { normalizedScores, rawScores } = useMemo(() => {
    const raw = ALL_SVG_MUSCLE_IDS.reduce((acc, id) => {
      acc[id] = 0;
      return acc;
    }, {});

    if (exerciseLibrary && history) {
      const exerciseDetailsMap = exerciseLibrary.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      history.forEach(log => {
        const details = exerciseDetailsMap[log.exerciseId];
        if (!details) return;

        const volume = (log.weight || 0) * (log.reps || 0);
        if (volume === 0) return;

        const processMuscle = (muscleName) => {
          const cleanedName = muscleName.toLowerCase().trim();
          const svgIds = muscleMapping[cleanedName];
          if (svgIds) {
            svgIds.forEach(id => {
              raw[id] = (raw[id] || 0) + volume;
            });
          }
        };

        if (details.target) processMuscle(details.target);
        if (details.secondaryMuscles) details.secondaryMuscles.forEach(processMuscle);
      });
    }

    const normalized = { ...raw };
    const maxScore = Math.max(...Object.values(normalized));
    if (maxScore > 0) {
      for (const muscle in normalized) {
        normalized[muscle] = normalized[muscle] / maxScore;
      }
    }

    return { normalizedScores: normalized, rawScores: raw };
  }, [exerciseLibrary, history]);

  const loading = libraryLoading || historyLoading;

  if (loading) {
    return <div>Analyzing your workout history...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Muscle Chart</h1>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center gap-2 mb-4">
            <Button onClick={() => setView('front')} variant={view === 'front' ? 'default' : 'outline'}>
              Front
            </Button>
            <Button onClick={() => setView('back')} variant={view === 'back' ? 'default' : 'outline'}>
              Back
            </Button>
          </div>
          <div className="relative w-full" style={{ paddingTop: '100%' }}>
            <div className="absolute top-0 left-0 w-full h-full">
              <MuscleMap 
                view={view} 
                muscleScores={normalizedScores}
                rawMuscleScores={rawScores}
                allMuscleIds={ALL_SVG_MUSCLE_IDS}
              />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">This chart visualizes your training volume by muscle group. The more you train a muscle, the deeper the shade of red.</p>
        </CardContent>
      </Card>
    </div>
  );
} 