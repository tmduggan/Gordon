import React from 'react';
import FoodPage from './FoodPage';
import ExercisePage from './ExercisePage';

export default function MainPage({ type }) {
    if (type === 'food') {
        return <FoodPage />;
    }
    return <ExercisePage />;
} 