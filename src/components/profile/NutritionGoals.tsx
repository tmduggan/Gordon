import { Button } from '@/components/ui/button';
import React from 'react';
import type { NutritionGoals as NutritionGoalsType } from '../../types';

interface NutritionGoalsProps {
  goals: NutritionGoalsType;
  setGoals: (goals: NutritionGoalsType) => void;
  onSave: () => void;
  onCancel: () => void;
}

const NutritionGoals: React.FC<NutritionGoalsProps> = ({ goals, setGoals, onSave, onCancel }) => {
  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-2">Daily Nutrition Goals</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(goals).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <label className="capitalize w-20">{key}</label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) =>
                setGoals({ ...goals, [key]: Number(e.target.value) })
              }
              className="border rounded px-2 py-1 w-24"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>Save Nutrition Goals</Button>
      </div>
    </div>
  );
};

export default NutritionGoals; 