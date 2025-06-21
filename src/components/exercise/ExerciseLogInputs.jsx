import React from 'react';

const ExerciseLogInputs = ({ exercise, logData, onLogDataChange }) => {

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onLogDataChange({ ...logData, [name]: value });
  };

  const isStrength = !exercise.category || exercise.category.toLowerCase() !== 'cardio';
  const isBodyweight = exercise.equipment === 'body weight';

  return (
    <div className="flex items-center gap-2">
      {isStrength ? (
        <>
          {!isBodyweight && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Weight (lbs)</label>
              <input
                type="number"
                name="weight"
                placeholder="e.g., 135"
                value={logData.weight || ''}
                onChange={handleInputChange}
                className="w-24 border rounded px-2 py-1 text-sm"
              />
            </div>
          )}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Reps</label>
            <input
              type="number"
              name="reps"
              placeholder="e.g., 10"
              value={logData.reps || ''}
              onChange={handleInputChange}
              className="w-24 border rounded px-2 py-1 text-sm"
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Duration (min)</label>
          <input
            type="number"
            name="duration"
            placeholder="e.g., 30"
            value={logData.duration || ''}
            onChange={handleInputChange}
            className="w-24 border rounded px-2 py-1 text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default ExerciseLogInputs; 