import React from 'react';
import ExerciseLogInputs from './ExerciseLogInputs';
import RemoveFromCartButton from "../Cart/RemoveFromCartButton";

export default function ExerciseCartRow({ exercise, logData: sets, onLogDataChange, onRemove, expectedScore }) {
  const handleSetChange = (index, newLogData) => {
    const newSets = sets.map((set, i) => (i === index ? { ...set, ...newLogData } : set));
    onLogDataChange(newSets);
  };

  const addSet = () => {
    const newSets = [...sets, {
      weight: exercise.equipment === 'bodyweight' ? 0 : '',
      reps: '',
      duration: '',
    }];
    onLogDataChange(newSets);
  };

  const removeSet = (index) => {
    if (sets.length > 1) {
      const newSets = sets.filter((_, i) => i !== index);
      onLogDataChange(newSets);
    }
  };

  return (
    <div className="p-2 flex gap-4">
      <div className="w-1/3">
        <p className="font-semibold">{exercise.name}</p>
        <p className="text-sm text-gray-600">{exercise.category} &middot; {exercise.equipment}</p>
      </div>
      <div className="w-2/3 flex flex-col gap-2">
        {sets.map((set, index) => (
          <div key={index} className="flex items-center gap-2">
            <ExerciseLogInputs
              exercise={exercise}
              logData={set}
              onLogDataChange={(newLogData) => handleSetChange(index, newLogData)}
            />
            {sets.length > 1 && (
              <button onClick={() => removeSet(index)} className="text-red-500 hover:text-red-700 text-xs">
                REMOVE
              </button>
            )}
          </div>
        ))}
        <div className="flex justify-between items-center mt-1">
            <button onClick={addSet} className="text-blue-500 hover:text-blue-700 text-sm font-semibold self-start">
                + ADD SET
            </button>
            {expectedScore > 0 && (
                <div className="text-sm font-bold text-green-600">
                    Expected Points: {expectedScore}
                </div>
            )}
        </div>
      </div>
      <div className="w-auto">
        <RemoveFromCartButton onClick={onRemove} />
      </div>
    </div>
  );
} 