// Script to populate exerciseLibrary collection using Firebase Admin SDK
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const EXERCISE_DB_BASE_URL = 'https://exercisedb.p.rapidapi.com';
const API_KEY = '3c9d909f7cmsh41ac528c20d2fa5p1cfdb4jsnab216ecf29e8';

// Initialize Firebase Admin SDK
// Note: You'll need to download your Firebase Admin SDK service account key
// from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccountPath = path.join(process.cwd(), 'firebase-admin-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase Admin SDK key not found!');
  console.log('📝 To get your Firebase Admin SDK key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save the JSON file as "firebase-admin-key.json" in the project root');
  console.log('4. Run this script again');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Error handling function
function handleError(error, context) {
  console.error(`❌ Error in ${context}:`, error);
  
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  } else if (error.request) {
    console.error('Network error - no response received');
  } else {
    console.error('Error message:', error.message);
  }
}

// Test API call with error handling
async function testExerciseDBAPI(query = 'bench') {
  console.log(`🔍 Testing ExerciseDB API with query: "${query}"`);
  
  try {
    const response = await fetch(`${EXERCISE_DB_BASE_URL}/exercises/name/${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API Response received: ${data.length} exercises found`);
    
    if (data.length === 0) {
      console.log('⚠️ No exercises found for this query');
      return [];
    }
    
    // Validate data structure
    const sampleExercise = data[0];
    console.log('\n📋 Exercise Structure Validation:');
    console.log('✅ ID:', sampleExercise.id);
    console.log('✅ Name:', sampleExercise.name);
    console.log('✅ Body Part:', sampleExercise.bodyPart);
    console.log('✅ Target:', sampleExercise.target);
    console.log('✅ Equipment:', sampleExercise.equipment);
    console.log('✅ Difficulty:', sampleExercise.difficulty);
    console.log('✅ Category:', sampleExercise.category);
    console.log('✅ Secondary Muscles:', sampleExercise.secondaryMuscles);
    console.log('✅ Instructions:', sampleExercise.instructions?.length || 0, 'steps');
    console.log('✅ Description:', sampleExercise.description ? 'Present' : 'Missing');
    console.log('✅ GIF URL:', sampleExercise.gifUrl ? 'Present' : 'Missing');
    
    return data;
    
  } catch (error) {
    handleError(error, 'API call');
    return [];
  }
}

// Save exercise to Firestore with error handling
async function saveExerciseToLibrary(exercise) {
  try {
    // Check if exercise already exists
    const exerciseRef = db.collection('exerciseLibrary').doc(exercise.id);
    const exerciseDoc = await exerciseRef.get();
    
    if (exerciseDoc.exists) {
      console.log(`⚠️ Exercise already exists: ${exercise.name}`);
      return false;
    }
    
    // Save the complete exercise object with all fields
    await exerciseRef.set({
      ...exercise,
      savedAt: new Date().toISOString(),
      source: 'exercisedb'
    });
    
    console.log(`✅ Exercise saved to library: ${exercise.name}`);
    return true;
    
  } catch (error) {
    handleError(error, `saving exercise ${exercise.name}`);
    return false;
  }
}

// Populate exercise library
async function populateExerciseLibrary(query = 'bench') {
  console.log('🚀 Starting exercise library population...');
  
  try {
    // Test API call
    const exercises = await testExerciseDBAPI(query);
    
    if (exercises.length === 0) {
      console.log('❌ No exercises to save');
      return;
    }
    
    // Save exercises to Firestore
    console.log('\n💾 Saving exercises to Firestore...');
    let savedCount = 0;
    let skippedCount = 0;
    
    for (const exercise of exercises) {
      const saved = await saveExerciseToLibrary(exercise);
      if (saved) {
        savedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Population Summary:`);
    console.log(`✅ Saved: ${savedCount} exercises`);
    console.log(`⚠️ Skipped: ${skippedCount} exercises (already existed)`);
    console.log(`📈 Total processed: ${exercises.length} exercises`);
    
  } catch (error) {
    handleError(error, 'population process');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const query = args[0] || 'bench';

console.log('🎯 Exercise Library Population Script (Admin SDK)');
console.log(`📝 Query: "${query}"`);
console.log('');

// Run the population script
populateExerciseLibrary(query).then(() => {
  console.log('\n🎉 Exercise library population complete!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Population failed:', error);
  process.exit(1);
}); 