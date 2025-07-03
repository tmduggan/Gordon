#!/usr/bin/env node

/**
 * Test script for Groq API integration
 * Run this to test your Groq API setup
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
dotenv.config();

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (one level up from scripts/)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = 'llama3-8b-8192';

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not found in environment variables');
  console.log('Please set your Groq API key:');
  console.log('export GROQ_API_KEY=your_api_key_here');
  process.exit(1);
}

async function testGroqAPI() {
  console.log('🧪 Testing Groq API Integration...\n');

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    const basicResponse = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with "Groq API is working correctly!"'
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Basic connectivity test passed');
    console.log(`Response: ${basicResponse.data.choices[0].message.content}`);
    console.log(`Tokens used: ${JSON.stringify(basicResponse.data.usage)}\n`);

    // Test 2: Workout suggestion prompt
    console.log('2️⃣ Testing workout suggestion prompt...');
    const workoutData = {
      exerciseHistory: [
        { date: '2024-01-01', exercise: 'push-ups', sets: 3, reps: 10 },
        { date: '2024-01-02', exercise: 'squats', sets: 3, reps: 15 }
      ],
      equipment: ['body weight', 'dumbbell'],
      userLevel: 'beginner',
      muscleAnalysis: { 'chest': 0.3, 'legs': 0.5, 'core': 0.2 }
    };

    const workoutPrompt = `You are an expert fitness coach creating personalized workout plans. Analyze the user's exercise history and suggest a balanced 3-exercise workout for today.

USER CONTEXT:
- Past 7 days exercise history: ${JSON.stringify(workoutData.exerciseHistory)}
- Available equipment: ${JSON.stringify(workoutData.equipment)}
- Current fitness level: ${workoutData.userLevel}
- Recent muscle focus: ${JSON.stringify(workoutData.muscleAnalysis)}

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

    const workoutResponse = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: workoutPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Workout suggestion test passed');
    console.log(`Response: ${workoutResponse.data.choices[0].message.content.substring(0, 200)}...`);
    console.log(`Tokens used: ${JSON.stringify(workoutResponse.data.usage)}\n`);

    // Test 3: Nutrition suggestion prompt
    console.log('3️⃣ Testing nutrition suggestion prompt...');
    const nutritionData = {
      foodHistory: [
        { date: '2024-01-01', food: 'oatmeal', calories: 150, protein: 5, carbs: 25, fat: 3 },
        { date: '2024-01-02', food: 'chicken breast', calories: 200, protein: 30, carbs: 0, fat: 5 }
      ],
      nutritionGoals: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
      dietaryPreferences: ['high protein', 'low carb'],
      restrictions: ['nuts'],
      currentTotals: { calories: 800, protein: 45, carbs: 80, fat: 25 }
    };

    const nutritionPrompt = `You are a nutritionist creating personalized daily meal plans. Analyze the user's food history and suggest a balanced nutrition plan for today.

USER CONTEXT:
- Past 7 days food history: ${JSON.stringify(nutritionData.foodHistory)}
- Daily nutrition goals: ${JSON.stringify(nutritionData.nutritionGoals)}
- Dietary preferences: ${JSON.stringify(nutritionData.dietaryPreferences)}
- Food allergies/restrictions: ${JSON.stringify(nutritionData.restrictions)}
- Current daily totals: ${JSON.stringify(nutritionData.currentTotals)}

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

    const nutritionResponse = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: nutritionPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Nutrition suggestion test passed');
    console.log(`Response: ${nutritionResponse.data.choices[0].message.content.substring(0, 200)}...`);
    console.log(`Tokens used: ${JSON.stringify(nutritionResponse.data.usage)}\n`);

    // Calculate total cost
    const totalInputTokens = basicResponse.data.usage.prompt_tokens + 
                           workoutResponse.data.usage.prompt_tokens + 
                           nutritionResponse.data.usage.prompt_tokens;
    const totalOutputTokens = basicResponse.data.usage.completion_tokens + 
                            workoutResponse.data.usage.completion_tokens + 
                            nutritionResponse.data.usage.completion_tokens;

    console.log('💰 Cost Analysis:');
    console.log(`Total Input Tokens: ${totalInputTokens}`);
    console.log(`Total Output Tokens: ${totalOutputTokens}`);
    console.log(`Estimated Cost: $${((totalInputTokens * 0.05 / 1000000) + (totalOutputTokens * 0.10 / 1000000)).toFixed(6)}`);
    console.log('\n🎉 All tests passed! Groq API is ready for integration.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testGroqAPI(); 