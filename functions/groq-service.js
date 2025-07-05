// Environment Setup for Cloud Functions v2:
// Set GROQ_API_KEY in Google Cloud Console or use --set-env-vars flag:
// gcloud functions deploy [function-name] --set-env-vars GROQ_API_KEY=your_key_here
const axios = require('axios');
const GROQ_CONFIG = require('./groq-config.js');

class GroqService {
  constructor() {
    // Only use process.env for the API key in Cloud Functions v2
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = GROQ_CONFIG.BASE_URL;
    this.model = GROQ_CONFIG.MODEL;
    this.timeout = GROQ_CONFIG.TIMEOUT;
    this.maxTokens = GROQ_CONFIG.MAX_TOKENS;

    if (!this.apiKey) {
      console.warn('GROQ_API_KEY not found in environment variables');
    }
  }

  /**
   * Make a request to Groq API
   * @param {string} prompt - The prompt to send to the API
   * @param {object} options - Additional options
   * @returns {Promise<object>} - API response
   */
  async makeRequest(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const requestData = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 1,
      stream: false
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return {
        success: true,
        data: response.data,
        usage: response.data.usage,
        content: response.data.choices[0]?.message?.content
      };
    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Generate workout suggestions
   * @param {object} userData - User's exercise history and profile
   * @returns {Promise<object>} - Workout suggestions
   */
  async generateWorkoutSuggestions(userData) {
    const prompt = this.buildWorkoutPrompt(userData);
    return this.makeRequest(prompt, { temperature: 0.8 });
  }

  /**
   * Generate nutrition suggestions
   * @param {object} userData - User's nutrition history and goals
   * @returns {Promise<object>} - Nutrition suggestions
   */
  async generateNutritionSuggestions(userData) {
    const prompt = this.buildNutritionPrompt(userData);
    return this.makeRequest(prompt, { temperature: 0.8 });
  }

  /**
   * Generate achievement goals
   * @param {object} userData - User's current progress and patterns
   * @returns {Promise<object>} - Achievement goals
   */
  async generateAchievementGoals(userData) {
    const prompt = this.buildAchievementPrompt(userData);
    return this.makeRequest(prompt, { temperature: 0.9 });
  }

  /**
   * Build workout suggestion prompt
   * @param {object} userData - User data
   * @returns {string} - Formatted prompt
   */
  buildWorkoutPrompt(userData) {
    const { exerciseHistory, equipment, userLevel, muscleAnalysis } = userData;
    
    return `You are an expert fitness coach creating personalized workout plans. Analyze the user's exercise history and suggest a balanced 3-exercise workout for today.

USER CONTEXT:
- Past 7 days exercise history: ${JSON.stringify(exerciseHistory)}
- Available equipment: ${JSON.stringify(equipment)}
- Current fitness level: ${userLevel}
- Recent muscle focus: ${JSON.stringify(muscleAnalysis)}

REQUIREMENTS:
1. Suggest exactly 3 exercises that balance:
   - Anaerobic strength training (2 exercises)
   - Core stability/mobility (1 exercise - yoga, pilates, bodyweight core work)
2. Prioritize muscles that haven't been trained recently or are lagging
3. Consider equipment availability
4. Include specific sets/reps/duration recommendations
5. Explain the reasoning for each exercise choice

OUTPUT FORMAT:
{
  "workout_plan": {
    "date": "YYYY-MM-DD",
    "exercises": [
      {
        "name": "Exercise Name",
        "category": "strength|core|cardio",
        "target_muscles": ["muscle1", "muscle2"],
        "equipment": "equipment_needed",
        "sets": 3,
        "reps": 12,
        "duration": null,
        "reasoning": "Why this exercise was chosen",
        "difficulty": "beginner|intermediate|advanced"
      }
    ],
    "total_estimated_duration": "45 minutes",
    "focus_areas": ["lagging_muscle1", "lagging_muscle2"],
    "workout_balance": "strength-focused with core stability"
  }
}`;
  }

  /**
   * Build nutrition suggestion prompt
   * @param {object} userData - User data
   * @returns {string} - Formatted prompt
   */
  buildNutritionPrompt(userData) {
    const { foodHistory, nutritionGoals, dietaryPreferences, restrictions, currentTotals } = userData;
    
    return `You are a nutritionist creating personalized daily meal plans. Analyze the user's food history and suggest a balanced nutrition plan for today.

USER CONTEXT:
- Past 7 days food history: ${JSON.stringify(foodHistory)}
- Daily nutrition goals: ${JSON.stringify(nutritionGoals)}
- Dietary preferences: ${JSON.stringify(dietaryPreferences)}
- Food allergies/restrictions: ${JSON.stringify(restrictions)}
- Current daily totals: ${JSON.stringify(currentTotals)}

REQUIREMENTS:
1. Suggest 3-4 meals that balance:
   - Protein-rich foods (prioritize lean sources)
   - Complex carbohydrates
   - Healthy fats
   - Fiber-rich foods
2. Address any nutritional gaps from recent history
3. Stay within daily calorie and macro goals
4. Include specific serving sizes
5. Consider meal timing and user preferences

OUTPUT FORMAT:
{
  "nutrition_plan": {
    "date": "YYYY-MM-DD",
    "meals": [
      {
        "meal": "breakfast|lunch|dinner|snack",
        "foods": [
          {
            "name": "Food Name",
            "serving_size": "1 cup",
            "calories": 250,
            "protein": 15,
            "carbs": 30,
            "fat": 8,
            "fiber": 5,
            "reasoning": "Why this food was chosen"
          }
        ],
        "total_calories": 450,
        "total_protein": 25,
        "total_carbs": 45,
        "total_fat": 15
      }
    ],
    "daily_totals": {
      "calories": 1800,
      "protein": 120,
      "carbs": 200,
      "fat": 60,
      "fiber": 25
    },
    "nutritional_focus": "protein_rich|fiber_boost|vitamin_rich",
    "gaps_addressed": ["vitamin_d", "omega_3", "fiber"]
  }
}`;
  }

  /**
   * Build achievement goals prompt
   * @param {object} userData - User data
   * @returns {string} - Formatted prompt
   */
  buildAchievementPrompt(userData) {
    const { exercisePatterns, nutritionHabits, userLevel, achievementHistory, timeAvailability } = userData;
    
    return `You are a gamification expert creating personalized daily achievement goals. Analyze the user's exercise and nutrition patterns to suggest motivating daily challenges.

USER CONTEXT:
- Recent exercise patterns: ${JSON.stringify(exercisePatterns)}
- Nutrition habits: ${JSON.stringify(nutritionHabits)}
- Current level: ${userLevel}
- Achievement history: ${JSON.stringify(achievementHistory)}
- Available time: ${timeAvailability}

REQUIREMENTS:
1. Create 7 diverse achievement goals covering:
   - Exercise milestones (reps, duration, new exercises)
   - Nutrition targets (macro goals, food variety, hydration)
   - Consistency goals (streaks, daily habits)
   - Personal bests (weight, endurance, flexibility)
2. Make goals challenging but achievable
3. Include XP rewards for each goal
4. Consider user's current progress and limitations
5. Mix short-term and long-term oriented goals

OUTPUT FORMAT:
{
  "daily_achievements": {
    "date": "YYYY-MM-DD",
    "goals": [
      {
        "id": "goal_1",
        "title": "Achievement Title",
        "description": "Detailed description of what needs to be accomplished",
        "category": "exercise|nutrition|consistency|personal_best",
        "target_value": 100,
        "current_value": 0,
        "unit": "reps|minutes|calories|days",
        "xp_reward": 50,
        "difficulty": "easy|medium|hard",
        "motivation": "Why this goal matters for the user",
        "progress_tracking": "How to measure progress"
      }
    ],
    "total_potential_xp": 350,
    "focus_areas": ["strength", "endurance", "nutrition"],
    "motivational_theme": "Building consistency through small wins"
  }
}`;
  }
}

module.exports = GroqService; 