import type { FoodLog, NutritionGoals } from '../types';

interface MealSuggestionRequest {
  foodLog: FoodLog[];
  nutritionGoals: NutritionGoals;
}

interface MealSuggestionResponse {
  suggestion: string;
}

interface ErrorResponse {
  error: string;
}

export async function getNextMealSuggestion({ 
  foodLog, 
  nutritionGoals 
}: MealSuggestionRequest): Promise<string> {
  const response = await fetch(
    'https://us-central1-food-tracker-19c9d.cloudfunctions.net/groqSuggestMeal',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodLog, nutritionGoals }),
    }
  );
  
  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to get suggestion');
  }
  
  const data: MealSuggestionResponse = await response.json();
  return data.suggestion;
} 