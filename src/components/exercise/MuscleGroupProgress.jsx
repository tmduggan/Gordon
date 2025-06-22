import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const muscleGroups = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs'
];

const weeklyGoals = {
  Chest: 500, Back: 500, Shoulders: 300, Biceps: 200, Triceps: 200,
  Quads: 600, Hamstrings: 400, Glutes: 400, Calves: 150, Abs: 250,
  Default: 200 // Fallback goal
};

const targetToGroupMap = {
  'pectorals': 'Chest', 'chest': 'Chest',
  'lats': 'Back', 'traps': 'Back', 'back': 'Back',
  'delts': 'Shoulders', 'shoulders': 'Shoulders',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'quads': 'Quads', 'quadriceps': 'Quads',
  'hamstrings': 'Hamstrings',
  'glutes': 'Glutes',
  'calves': 'Calves',
  'abdominals': 'Abs', 'abs': 'Abs', 'core': 'Abs',
};

const MuscleGroupProgress = ({ logs = [], exerciseLibrary = [] }) => {
  const progressByMuscle = muscleGroups.reduce((acc, muscle) => {
    acc[muscle] = 0;
    return acc;
  }, {});

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  if (logs.length > 0 && exerciseLibrary.length > 0) {
    const recentLogs = logs.filter(log => new Date(log.timestamp) > oneWeekAgo);
    
    recentLogs.forEach(log => {
      const exercise = exerciseLibrary.find(ex => ex.id === log.exerciseId);
      if (exercise && exercise.target) {
        const group = targetToGroupMap[exercise.target.toLowerCase()];
        if (group && progressByMuscle.hasOwnProperty(group)) {
          progressByMuscle[group] += log.score;
        }
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Muscle Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {muscleGroups.map(muscle => {
          const currentProgress = progressByMuscle[muscle] || 0;
          const goal = weeklyGoals[muscle] || weeklyGoals.Default;
          const progressPercentage = Math.min((currentProgress / goal) * 100, 100);

          return (
            <div key={muscle} className="grid grid-cols-5 items-center gap-4">
              <span className="col-span-1 font-medium">{muscle}</span>
              <div className="col-span-4 flex items-center gap-2">
                  <Progress value={progressPercentage} className="w-full" />
                  <span className="text-xs text-gray-500 min-w-max">{currentProgress} / {goal} XP</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MuscleGroupProgress; 