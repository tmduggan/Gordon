import React from 'react';

export default function ExercisePreview({ exercise }) {
  // This component will render the specific preview for an exercise item
  // in the search results, showing muscle groups, etc.
  return (
    <span>
      {exercise.label}
      {/* Placeholder for muscle group display */}
    </span>
  );
} 