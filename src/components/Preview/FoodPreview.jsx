import React from 'react';

export default function FoodPreview({ food }) {
  // This component will render the specific preview for a food item
  // in the search results, showing macros.
  return (
    <span>
      {food.label}
      {/* Placeholder for macro display */}
    </span>
  );
} 