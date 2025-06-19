// Simple script to test ExerciseDB API without Firebase
const EXERCISE_DB_BASE_URL = 'https://exercisedb.p.rapidapi.com';
const API_KEY = '3c9d909f7cmsh41ac528c20d2fa5p1cfdb4jsnab216ecf29e8';

// Error handling function
function handleError(error, context) {
  console.error(`❌ Error in ${context}:`, error);
  
  if (error.response) {
    // API error response
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  } else if (error.request) {
    // Network error
    console.error('Network error - no response received');
  } else {
    // Other error
    console.error('Error message:', error.message);
  }
}

// Test API call with error handling
async function testExerciseDBAPI(query = 'bench') {
  console.log(`🔍 Testing ExerciseDB API with query: "${query}"`);
  console.log(`🌐 URL: ${EXERCISE_DB_BASE_URL}/exercises/name/${encodeURIComponent(query)}`);
  
  try {
    const response = await fetch(`${EXERCISE_DB_BASE_URL}/exercises/name/${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

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
    
    // Show all exercises found
    console.log('\n📝 All exercises found:');
    data.forEach((exercise, index) => {
      console.log(`${index + 1}. ${exercise.name} (${exercise.target}) - ${exercise.equipment}`);
    });
    
    return data;
    
  } catch (error) {
    handleError(error, 'API call');
    return [];
  }
}

// Test multiple queries
async function runTests() {
  console.log('🧪 Testing ExerciseDB API...\n');
  
  const testQueries = ['bench', 'squat', 'push'];
  
  for (const query of testQueries) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing query: "${query}"`);
    console.log(`${'='.repeat(50)}`);
    
    const results = await testExerciseDBAPI(query);
    
    if (results.length > 0) {
      console.log(`✅ Success! Found ${results.length} exercises for "${query}"`);
    } else {
      console.log(`❌ No results for "${query}"`);
    }
    
    // Wait a bit between requests to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 API testing complete!');
}

// Run the tests
runTests().catch((error) => {
  console.error('\n💥 Testing failed:', error);
  process.exit(1);
}); 