import GroqService from '../../functions/groq-service';

export async function getNextMealSuggestion({ foodLog, nutritionGoals }) {
  const prompt = `
You are a nutritionist. Based on the user's food log for today and their nutrition goals, suggest the next meal in the format: [qty,measurement,food], e.g. "100g oatmeal, 50g berries".
Use grams for all quantities. Suggest 2-4 foods that help balance macros and fill gaps. Only output the meal suggestion, no extra text.

User food log so far: ${foodLog}
Nutrition goals: ${nutritionGoals}
Current time: ${new Date().toLocaleTimeString()}
  `;
  const response = await GroqService.makeRequest(prompt, { maxTokens: 100 });
  return response.content.trim();
} 