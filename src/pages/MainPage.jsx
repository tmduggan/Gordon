import React from 'react';
import ExercisePage from './ExercisePage';
import FoodPage from './FoodPage';

export default function MainPage({ type }) {
  if (type === 'food') {
    return <FoodPage />;
  }
  return <ExercisePage />;
}
