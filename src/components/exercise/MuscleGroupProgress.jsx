import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const muscleGroups = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs'
];

const MuscleGroupProgress = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {muscleGroups.map(muscle => (
          <div key={muscle} className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 font-medium">{muscle}</span>
            <div className="col-span-3">
              <Progress value={33} className="w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MuscleGroupProgress; 