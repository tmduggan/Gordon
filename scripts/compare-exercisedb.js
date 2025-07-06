import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXERCISEDB_API_BASE = 'https://exercisedb.p.rapidapi.com';
const API_KEY = process.env.RAPIDAPI_KEY; // Set this in your environment

if (!API_KEY) {
  console.error('Please set RAPIDAPI_KEY environment variable');
  process.exit(1);
}

// Helper function to make API requests
async function makeApiRequest(endpoint) {
  const url = `${EXERCISEDB_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Helper function to make API requests (with batching)
async function fetchAllExercisesFromApi() {
  const allExercises = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = `${EXERCISEDB_API_BASE}/exercises?offset=${offset}&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    allExercises.push(...batch);
    offset += batch.length;
    if (batch.length < limit) break;
  }
  return allExercises;
}

// Load local exercise library
function loadLocalLibrary() {
  try {
    const libraryPath = path.join(__dirname, '..', 'src', 'data', 'exercises.json');
    const data = fs.readFileSync(libraryPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading local library:', error.message);
    return [];
  }
}

// Compare exercises
function compareExercises(localExercises, apiExercises) {
  const localIds = new Set(localExercises.map(ex => ex.id));
  const apiIds = new Set(apiExercises.map(ex => ex.id));
  
  const missingFromLocal = apiExercises.filter(ex => !localIds.has(ex.id));
  const missingFromApi = localExercises.filter(ex => !apiIds.has(ex.id));
  const common = localExercises.filter(ex => apiIds.has(ex.id));
  
  return {
    missingFromLocal,
    missingFromApi,
    common,
    stats: {
      localCount: localExercises.length,
      apiCount: apiExercises.length,
      missingFromLocalCount: missingFromLocal.length,
      missingFromApiCount: missingFromApi.length,
      commonCount: common.length
    }
  };
}

// Analyze muscle group differences
function analyzeMuscleGroups(localExercises, apiExercises) {
  const localMuscles = new Set();
  const apiMuscles = new Set();
  
  localExercises.forEach(ex => {
    if (ex.target) localMuscles.add(ex.target);
    if (ex.secondaryMuscles) {
      ex.secondaryMuscles.forEach(m => localMuscles.add(m));
    }
  });
  
  apiExercises.forEach(ex => {
    if (ex.target) apiMuscles.add(ex.target);
    if (ex.secondaryMuscles) {
      ex.secondaryMuscles.forEach(m => apiMuscles.add(m));
    }
  });
  
  const missingFromLocal = [...apiMuscles].filter(m => !localMuscles.has(m));
  const missingFromApi = [...localMuscles].filter(m => !apiMuscles.has(m));
  
  return {
    localMuscles: [...localMuscles].sort(),
    apiMuscles: [...apiMuscles].sort(),
    missingFromLocal,
    missingFromApi
  };
}

// Find exercises that should target specific muscle groups
function findExercisesForMuscleGroup(exercises, muscleGroup) {
  const keywords = {
    'lower traps': ['lower trap', 'lower trapezius', 'scapular retraction', 'rhomboid'],
    'upper traps': ['upper trap', 'upper trapezius', 'shrug'],
    'serratus anterior': ['serratus', 'scapular protraction', 'push-up plus'],
    'rotator cuff': ['rotator', 'external rotation', 'internal rotation', 'supraspinatus', 'infraspinatus', 'teres minor', 'subscapularis']
  };
  
  const targetKeywords = keywords[muscleGroup.toLowerCase()] || [];
  
  return exercises.filter(ex => {
    const name = (ex.name || '').toLowerCase();
    const target = (ex.target || '').toLowerCase();
    let instructions = '';
    if (typeof ex.instructions === 'string') {
      instructions = ex.instructions.toLowerCase();
    } else if (Array.isArray(ex.instructions)) {
      instructions = ex.instructions.join(' ').toLowerCase();
    }
    
    return targetKeywords.some(keyword => 
      name.includes(keyword) || 
      target.includes(keyword) || 
      instructions.includes(keyword)
    );
  });
}

// Main comparison function
async function compareLibraries() {
  console.log('🔍 Comparing local exercise library with ExerciseDB API...\n');
  
  // Load local library
  const localExercises = loadLocalLibrary();
  console.log(`📚 Local library: ${localExercises.length} exercises`);
  
  try {
    // Fetch all exercises from API (batched)
    console.log('🌐 Fetching exercises from ExerciseDB API (batched)...');
    const apiExercises = await fetchAllExercisesFromApi();
    console.log(`📊 API library: ${apiExercises.length} exercises\n`);
    
    // Compare exercises
    const comparison = compareExercises(localExercises, apiExercises);
    
    console.log('📈 COMPARISON STATISTICS:');
    console.log(`   Local exercises: ${comparison.stats.localCount}`);
    console.log(`   API exercises: ${comparison.stats.apiCount}`);
    console.log(`   Missing from local: ${comparison.stats.missingFromLocalCount}`);
    console.log(`   Missing from API: ${comparison.stats.missingFromApiCount}`);
    console.log(`   Common exercises: ${comparison.stats.commonCount}\n`);
    
    // Analyze muscle groups
    const muscleAnalysis = analyzeMuscleGroups(localExercises, apiExercises);
    
    console.log('💪 MUSCLE GROUP ANALYSIS:');
    console.log(`   Local muscle groups: ${muscleAnalysis.localMuscles.length}`);
    console.log(`   API muscle groups: ${muscleAnalysis.apiMuscles.length}`);
    console.log(`   Muscle groups missing from local: ${muscleAnalysis.missingFromLocal.length}`);
    console.log(`   Muscle groups missing from API: ${muscleAnalysis.missingFromApi.length}\n`);
    
    if (muscleAnalysis.missingFromLocal.length > 0) {
      console.log('🔍 MUSCLE GROUPS MISSING FROM LOCAL:');
      muscleAnalysis.missingFromLocal.forEach(muscle => {
        console.log(`   - ${muscle}`);
      });
      console.log();
    }
    
    // Find exercises for specific muscle groups
    const targetMuscles = ['lower traps', 'upper traps', 'serratus anterior', 'rotator cuff'];
    
    console.log('🎯 EXERCISES FOR SPECIFIC MUSCLE GROUPS:');
    targetMuscles.forEach(muscle => {
      const exercises = findExercisesForMuscleGroup(apiExercises, muscle);
      console.log(`\n${muscle.toUpperCase()}:`);
      if (exercises.length > 0) {
        exercises.slice(0, 5).forEach(ex => {
          console.log(`   - ${ex.name} (target: ${ex.target})`);
        });
        if (exercises.length > 5) {
          console.log(`   ... and ${exercises.length - 5} more`);
        }
      } else {
        console.log('   No exercises found');
      }
    });
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      comparison,
      muscleAnalysis,
      targetMuscleExercises: targetMuscles.reduce((acc, muscle) => {
        acc[muscle] = findExercisesForMuscleGroup(apiExercises, muscle);
        return acc;
      }, {})
    };
    
    const reportPath = path.join(__dirname, 'exercisedb-comparison-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Error during comparison:', error.message);
    process.exit(1);
  }
}

// Run the comparison
compareLibraries().catch(console.error); 