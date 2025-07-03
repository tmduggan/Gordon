#!/usr/bin/env node

/**
 * Simple test script for Groq API integration
 * Run this to test your Groq API setup
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (one level up from scripts/)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = 'llama3-8b-8192';

console.log('🔍 Checking environment...');
console.log(`API Key found: ${GROQ_API_KEY ? '✅ Yes' : '❌ No'}`);

if (!GROQ_API_KEY) {
  console.error('\n❌ GROQ_API_KEY not found!');
  console.log('\nPlease check:');
  console.log('1. You have a .env file in your project root');
  console.log('2. The .env file contains: GROQ_API_KEY=your_actual_key_here');
  console.log('3. The .env file is not in .gitignore (it should be, but make sure it exists)');
  process.exit(1);
}

async function testGroqAPI() {
  console.log('\n🧪 Testing Groq API Integration...\n');

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

    // Test 2: Simple workout suggestion
    console.log('2️⃣ Testing workout suggestion prompt...');
    const workoutPrompt = `You are a fitness coach. Suggest 3 exercises for a beginner with bodyweight equipment only. Respond in JSON format:
{
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": 10,
      "reasoning": "Why this exercise"
    }
  ]
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
        max_tokens: 500,
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

    // Calculate total cost
    const totalInputTokens = basicResponse.data.usage.prompt_tokens + workoutResponse.data.usage.prompt_tokens;
    const totalOutputTokens = basicResponse.data.usage.completion_tokens + workoutResponse.data.usage.completion_tokens;

    console.log('💰 Cost Analysis:');
    console.log(`Total Input Tokens: ${totalInputTokens}`);
    console.log(`Total Output Tokens: ${totalOutputTokens}`);
    console.log(`Estimated Cost: $${((totalInputTokens * 0.05 / 1000000) + (totalOutputTokens * 0.10 / 1000000)).toFixed(6)}`);
    console.log('\n🎉 All tests passed! Groq API is ready for integration.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 This usually means your API key is invalid. Please check:');
      console.log('1. The API key in your .env file is correct');
      console.log('2. You copied the full API key from Groq dashboard');
      console.log('3. The API key doesn\'t have extra spaces or characters');
    }
    process.exit(1);
  }
}

// Run the test
testGroqAPI(); 