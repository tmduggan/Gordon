export async function getNextMealSuggestion({ foodLog, nutritionGoals }) {
  const response = await fetch(
    'https://us-central1-food-tracker-19c9d.cloudfunctions.net/groqSuggestMeal',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodLog, nutritionGoals }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get suggestion');
  }
  const data = await response.json();
  return data.suggestion;
}
