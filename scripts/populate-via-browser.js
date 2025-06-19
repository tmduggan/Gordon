// Script to populate exerciseLibrary collection - run this in browser console
// This avoids Firebase authentication restrictions by using the existing app's auth

const EXERCISE_DB_BASE_URL = 'https://exercisedb.p.rapidapi.com';
const API_KEY = '3c9d909f7cmsh41ac528c20d2fa5p1cfdb4jsnab216ecf29e8';

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

// Save exercise to Firestore using the app's existing Firebase instance
async function saveExerciseToLibrary(exercise) {
  try {
    // Use the existing Firebase instance from the app
    const { db } = await import('../src/firebase.js');
    const { doc, setDoc, getDoc } = await import('firebase/firestore');
    
    // Check if exercise already exists
    const exerciseRef = doc(db, 'exerciseLibrary', exercise.id);
    const exerciseDoc = await getDoc(exerciseRef);
    
    if (exerciseDoc.exists()) {
      console.log(`⚠️ Exercise already exists: ${exercise.name}`);
      return false;
    }
    
    // Save the complete exercise object with all fields
    await setDoc(exerciseRef, {
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

// Make functions available globally for browser console
window.populateExerciseLibrary = populateExerciseLibrary;
window.testExerciseDBAPI = testExerciseDBAPI;

console.log('🎯 Exercise Library Population Script Loaded!');
console.log('📝 Available functions:');
console.log('  - populateExerciseLibrary(query) - Populate library with exercises');
console.log('  - testExerciseDBAPI(query) - Test API call only');
console.log('');
console.log('💡 Example usage:');
console.log('  populateExerciseLibrary("bench")');
console.log('  populateExerciseLibrary("squat")');
console.log('  populateExerciseLibrary("push")'); 