import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const MuscleGroupProgress = ({ logs = [], exerciseLibrary = [], muscleScores = {} }) => {
  // Use muscleScores from userProfile as the source of truth
  const progressByMuscle = muscleGroups.reduce((acc, muscle) => {
    acc[muscle] = muscleScores[muscle] || 0;
    return acc;
  }, {});

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Helper to get up to 5 recent logs for a muscle
  const getRecentLogsForMuscle = (muscle) => {
    const recentLogs = logs.filter(log => {
      const exercise = exerciseLibrary.find(ex => ex.id === log.exerciseId);
      if (!exercise || !exercise.target) return false;
      const group = targetToGroupMap[exercise.target.toLowerCase()];
      return group === muscle;
    });
    // Sort by timestamp descending
    recentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return recentLogs.slice(0, 5).map(log => {
      const exercise = exerciseLibrary.find(ex => ex.id === log.exerciseId);
      return {
        name: exercise?.name || 'Unknown',
        date: new Date(log.timestamp).toLocaleDateString(),
        score: log.score
      };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Muscle Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
        {muscleGroups.map(muscle => {
          const currentProgress = progressByMuscle[muscle] || 0;
          const goal = weeklyGoals[muscle] || weeklyGoals.Default;
          const progressPercentage = Math.min((currentProgress / goal) * 100, 100);
          const recentLogs = getRecentLogsForMuscle(muscle);

          return (
            <Tooltip key={muscle}>
              <TooltipTrigger asChild>
                <div className="grid grid-cols-5 items-center gap-4 cursor-pointer">
                  <span className="col-span-1 font-medium">{muscle}</span>
                  <div className="col-span-4 flex items-center gap-2">
                      <Progress value={progressPercentage} className="w-full" />
                      <span className="text-xs text-gray-500 min-w-max">{currentProgress} / {goal} XP</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="text-sm font-semibold mb-1">Recent logs for {muscle}:</div>
                {recentLogs.length === 0 ? (
                  <div className="text-xs text-gray-500">No recent logs.</div>
                ) : (
                  <ul className="text-xs space-y-1">
                    {recentLogs.map((log, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{log.name}</span> — {log.score} XP <span className="text-gray-400">({log.date})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default MuscleGroupProgress; 