import { Button } from '@/components/ui/button';
import { Check, Trash, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import SwipeToDelete from 'react-swipe-to-delete-component';
import 'react-swipe-to-delete-component/dist/swipe-to-delete.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

const ExerciseLogInputs = ({
  exercise,
  logData,
  onLogDataChange,
  lastSetPlaceholder,
}) => {
  const isCardio =
    exercise.category && exercise.category.toLowerCase() === 'cardio';
  const isStrength = !isCardio;
  const isBodyweight = exercise.equipment === 'body weight';
  const isMobile = useIsMobile();

  // Initialize sets from logData or with a default first set if none exist.
  const [sets, setSets] = useState(
    logData?.sets && logData.sets.length > 0
      ? logData.sets.map((set) => ({ ...set, completed: false }))
      : [{ weight: '', reps: '', completed: false }]
  );

  // When sets change, update the parent component's state.
  useEffect(() => {
    if (isStrength) {
      onLogDataChange(exercise.id, { ...logData, sets });
    }
  }, [sets, isStrength]);

  const handleSetChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const addSet = () => {
    setSets([...sets, { weight: '', reps: '', completed: false }]);
  };

  const removeSet = (index) => {
    // Prevent removing the last set
    if (sets.length === 1) return;
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
  };

  const toggleCompleted = (index) => {
    const newSets = [...sets];
    newSets[index].completed = !newSets[index].completed;
    setSets(newSets);
  };

  const handleDurationChange = (e) => {
    const prevValue = logData?.duration;
    onLogDataChange(exercise.id, { ...logData, duration: e.target.value });
  };

  if (isCardio) {
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

  // Render sets with swipe-to-delete on mobile, no remove button on desktop
  const renderSet = (set, index) => (
    <div
      key={index}
      className={`flex items-end gap-2 p-1 rounded bg-white ${set.completed ? 'bg-status-success' : ''}`}
    >
      {!isBodyweight && (
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Weight (lbs)</label>
          <input
            type="number"
            placeholder={
              set.weight === '' &&
              lastSetPlaceholder &&
              lastSetPlaceholder.weight
                ? `${lastSetPlaceholder.weight}`
                : 'e.g., 135'
            }
            value={set.weight}
            onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
            className={`w-24 border rounded px-2 py-1 text-sm ${set.weight === '' && lastSetPlaceholder && lastSetPlaceholder.weight ? 'placeholder-gray-400' : ''}`}
            style={{ color: set.weight === '' ? '#9ca3af' : undefined }}
          />
        </div>
      )}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Reps</label>
        <input
          type="number"
          placeholder={
            set.reps === '' && lastSetPlaceholder && lastSetPlaceholder.reps
              ? `${lastSetPlaceholder.reps}`
              : 'e.g., 10'
          }
          value={set.reps}
          onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
          className={`w-24 border rounded px-2 py-1 text-sm ${set.reps === '' && lastSetPlaceholder && lastSetPlaceholder.reps ? 'placeholder-gray-400' : ''}`}
          style={{ color: set.reps === '' ? '#9ca3af' : undefined }}
        />
      </div>
      <Button
        type="button"
        variant={set.completed ? 'default' : 'outline'}
        size="icon"
        className={`h-8 w-8 ${set.completed ? 'bg-status-success text-status-success' : ''}`}
        onClick={() => toggleCompleted(index)}
        title={set.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        <Check className="h-4 w-4" />
      </Button>
      {/* Remove set button only on desktop */}
      {!isMobile && sets.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => removeSet(index)}
          title="Remove set"
        >
          <X className="h-4 w-4 text-red-500" />
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div>
        {sets.map((set, index) => {
          // Disable swipe if set is completed (checked), or if only one set remains
          const disableSwipe = set.completed || sets.length === 1;
          return (
            <SwipeToDelete
              key={index}
              onDelete={() => removeSet(index)}
              height={64}
              transitionDuration={250}
              rtl={false}
              disabled={disableSwipe}
              deleteSwipe={0.85}
              deleteComponent={
                <div className="flex items-center justify-end h-full pr-6 bg-red-500 text-white rounded">
                  <Trash className="h-6 w-6" />
                </div>
              }
            >
              {renderSet(set, index)}
            </SwipeToDelete>
          );
        })}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSet}
            className="w-full"
          >
            Add Set
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sets.map((set, index) => renderSet(set, index))}
      <Button type="button" variant="outline" size="sm" onClick={addSet}>
        Add Set
      </Button>
    </div>
  );
};

export default ExerciseLogInputs;
