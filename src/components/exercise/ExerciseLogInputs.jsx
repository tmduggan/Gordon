import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const ExerciseLogInputs = ({ exercise, logData, onLogDataChange }) => {
  const isStrength = !exercise.category || exercise.category.toLowerCase() !== 'cardio';
  const isBodyweight = exercise.equipment === 'body weight';
  
  // Initialize sets from logData or with a default first set if none exist.
  const [sets, setSets] = useState(logData?.sets && logData.sets.length > 0 ? logData.sets : [{ weight: '', reps: '' }]);

  // When sets change, update the parent component's state.
  useEffect(() => {
    if (isStrength) {
      onLogDataChange({ ...logData, sets });
    }
  }, [sets, isStrength]);

  const handleSetChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const addSet = () => {
    setSets([...sets, { weight: '', reps: '' }]);
  };

  const removeSet = (index) => {
    // Prevent removing the last set
    if (sets.length === 1) return;
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
  };
  
  const handleDurationChange = (e) => {
    onLogDataChange({ ...logData, duration: e.target.value });
  };

  if (!isStrength) {
    return (
      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Duration (min)</label>
        <input
          type="number"
          name="duration"
          placeholder="e.g., 30"
          value={logData?.duration || ''}
          onChange={handleDurationChange}
          className="w-24 border rounded px-2 py-1 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sets.map((set, index) => (
        <div key={index} className="flex items-end gap-2">
          {!isBodyweight && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Weight (lbs)</label>
              <input
                type="number"
                placeholder="e.g., 135"
                value={set.weight}
                onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                className="w-24 border rounded px-2 py-1 text-sm"
              />
            </div>
          )}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Reps</label>
            <input
              type="number"
              placeholder="e.g., 10"
              value={set.reps}
              onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
              className="w-24 border rounded px-2 py-1 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => removeSet(index)}
            disabled={sets.length === 1}
            title="Remove set"
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addSet}>
        Add Set
      </Button>
    </div>
  );
};

export default ExerciseLogInputs; 