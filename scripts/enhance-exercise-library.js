import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXERCISEDB_API_BASE = 'https://exercisedb.p.rapidapi.com';
const API_KEY = process.env.RAPIDAPI_KEY;

// Enhanced muscle mappings for specific exercises
const ENHANCED_MUSCLE_MAPPINGS = {
  // Lower trap exercises that are often mislabeled
  'scapular retraction': {
    target: 'lower traps',
    secondaryMuscles: ['rhomboids', 'middle traps']
  },
  'prone y raise': {
    target: 'lower traps',
    secondaryMuscles: ['rhomboids', 'rear deltoids']
  },
  'wall slide': {
    target: 'lower traps',
    secondaryMuscles: ['rhomboids', 'serratus anterior']
  },
  'band pull apart': {
    target: 'lower traps',
    secondaryMuscles: ['rhomboids', 'rear deltoids']
  },
  
  // Serratus anterior exercises
  'push-up plus': {
    target: 'serratus anterior',
    secondaryMuscles: ['pectorals', 'triceps']
  },
  'scapular protraction': {
    target: 'serratus anterior',
    secondaryMuscles: ['pectorals']
  },
  'wall slide with protraction': {
    target: 'serratus anterior',
    secondaryMuscles: ['lower traps', 'rhomboids']
  },
  
  // Rotator cuff exercises
  'external rotation': {
    target: 'rotator cuff',
    secondaryMuscles: ['rear deltoids']
  },
  'internal rotation': {
    target: 'rotator cuff',
    secondaryMuscles: ['pectorals']
  },
  'supraspinatus': {
    target: 'rotator cuff',
    secondaryMuscles: ['deltoids']
  },
  'infraspinatus': {
    target: 'rotator cuff',
    secondaryMuscles: ['rear deltoids']
  },
  'teres minor': {
    target: 'rotator cuff',
    secondaryMuscles: ['rear deltoids']
  },
  'subscapularis': {
    target: 'rotator cuff',
    secondaryMuscles: ['pectorals']
  }
};

// Exercise name patterns that should be enhanced
const EXERCISE_PATTERNS = {
  'lower trap': 'lower traps',
  'lower trapezius': 'lower traps',
  'upper trap': 'upper traps',
  'upper trapezius': 'upper traps',
  'serratus': 'serratus anterior',
  'rotator': 'rotator cuff',
  'scapular retraction': 'lower traps',
  'scapular protraction': 'serratus anterior',
  'push-up plus': 'serratus anterior',
  'external rotation': 'rotator cuff',
  'internal rotation': 'rotator cuff'
};

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

// Save enhanced library
function saveEnhancedLibrary(exercises, filename = 'exercises-enhanced.json') {
  const outputPath = path.join(__dirname, '..', 'src', 'data', filename);
  fs.writeFileSync(outputPath, JSON.stringify(exercises, null, 2));
  console.log(`💾 Enhanced library saved to: ${outputPath}`);
}

// Apply enhanced muscle mappings
function applyEnhancedMappings(exercises) {
  let enhancedCount = 0;
  
  const enhanced = exercises.map(exercise => {
    let modified = false;
    const enhanced = { ...exercise };
    
    // Check for specific exercise patterns
    const exerciseName = exercise.name.toLowerCase();
    
    // Apply pattern-based enhancements
    for (const [pattern, targetMuscle] of Object.entries(EXERCISE_PATTERNS)) {
      if (exerciseName.includes(pattern.toLowerCase())) {
        if (enhanced.target !== targetMuscle) {
          enhanced.target = targetMuscle;
          modified = true;
        }
      }
    }
    
    // Apply specific exercise enhancements
    for (const [exercisePattern, mapping] of Object.entries(ENHANCED_MUSCLE_MAPPINGS)) {
      if (exerciseName.includes(exercisePattern.toLowerCase())) {
        enhanced.target = mapping.target;
        if (mapping.secondaryMuscles) {
          enhanced.secondaryMuscles = mapping.secondaryMuscles;
        }
        modified = true;
        break;
      }
    }
    
    if (modified) {
      enhancedCount++;
    }
    
    return enhanced;
  });
  
  return { enhanced, enhancedCount };
}

// Create a mapping file for custom enhancements
function createEnhancementMapping(exercises) {
  const enhancements = {};
  
  exercises.forEach(exercise => {
    const exerciseName = exercise.name.toLowerCase();
    
    // Check if this exercise should be enhanced
    for (const [pattern, targetMuscle] of Object.entries(EXERCISE_PATTERNS)) {
      if (exerciseName.includes(pattern.toLowerCase())) {
        enhancements[exercise.id] = {
          originalTarget: exercise.target,
          enhancedTarget: targetMuscle,
          reason: `Pattern match: ${pattern}`
        };
        break;
      }
    }
    
    // Check for specific exercise enhancements
    for (const [exercisePattern, mapping] of Object.entries(ENHANCED_MUSCLE_MAPPINGS)) {
      if (exerciseName.includes(exercisePattern.toLowerCase())) {
        enhancements[exercise.id] = {
          originalTarget: exercise.target,
          enhancedTarget: mapping.target,
          secondaryMuscles: mapping.secondaryMuscles,
          reason: `Specific enhancement: ${exercisePattern}`
        };
        break;
      }
    }
  });
  
  return enhancements;
}

// Merge API updates while preserving enhancements
function mergeApiUpdates(localExercises, apiExercises, enhancementMapping) {
  const localById = new Map(localExercises.map(ex => [ex.id, ex]));
  const apiById = new Map(apiExercises.map(ex => [ex.id, ex]));
  
  const merged = [];
  const updated = [];
  const preserved = [];
  
  // Process all exercises
  for (const [id, apiExercise] of apiById) {
    const localExercise = localById.get(id);
    
    if (localExercise) {
      // Exercise exists in both - merge while preserving enhancements
      const mergedExercise = { ...apiExercise };
      
      // Preserve custom enhancements
      if (enhancementMapping[id]) {
        mergedExercise.target = enhancementMapping[id].enhancedTarget;
        if (enhancementMapping[id].secondaryMuscles) {
          mergedExercise.secondaryMuscles = enhancementMapping[id].secondaryMuscles;
        }
        preserved.push(id);
      }
      
      merged.push(mergedExercise);
      
      // Check if there were other updates
      if (JSON.stringify(mergedExercise) !== JSON.stringify(localExercise)) {
        updated.push(id);
      }
    } else {
      // New exercise from API
      merged.push(apiExercise);
    }
  }
  
  // Add local exercises not in API (custom exercises)
  for (const [id, localExercise] of localById) {
    if (!apiById.has(id)) {
      merged.push(localExercise);
    }
  }
  
  return { merged, updated, preserved };
}

// Main enhancement function
async function enhanceLibrary() {
  console.log('🔧 Enhancing exercise library...\n');
  
  // Load current library
  const localExercises = loadLocalLibrary();
  console.log(`📚 Loaded ${localExercises.length} exercises from local library`);
  
  // Apply enhanced mappings
  const { enhanced, enhancedCount } = applyEnhancedMappings(localExercises);
  console.log(`✨ Enhanced ${enhancedCount} exercises with better muscle mappings`);
  
  // Create enhancement mapping
  const enhancementMapping = createEnhancementMapping(enhanced);
  console.log(`📋 Created enhancement mapping for ${Object.keys(enhancementMapping).length} exercises`);
  
  // Save enhanced library
  saveEnhancedLibrary(enhanced, 'exercises-enhanced.json');
  
  // Save enhancement mapping
  const mappingPath = path.join(__dirname, '..', 'src', 'data', 'enhancement-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(enhancementMapping, null, 2));
  console.log(`📋 Enhancement mapping saved to: ${mappingPath}`);
  
  // Show some examples of enhancements
  console.log('\n🎯 EXAMPLE ENHANCEMENTS:');
  Object.entries(enhancementMapping).slice(0, 5).forEach(([id, mapping]) => {
    const exercise = enhanced.find(ex => ex.id === id);
    console.log(`   ${exercise.name}:`);
    console.log(`     Original: ${mapping.originalTarget}`);
    console.log(`     Enhanced: ${mapping.enhancedTarget}`);
    console.log(`     Reason: ${mapping.reason}\n`);
  });
  
  // If API key is available, show merge preview
  if (API_KEY) {
    console.log('🔄 MERGE PREVIEW (with API updates):');
    try {
      const response = await fetch(`${EXERCISEDB_API_BASE}/exercises`, {
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      });
      
      if (response.ok) {
        const apiExercises = await response.json();
        const { merged, updated, preserved } = mergeApiUpdates(enhanced, apiExercises, enhancementMapping);
        
        console.log(`   Total exercises after merge: ${merged.length}`);
        console.log(`   Updated from API: ${updated.length}`);
        console.log(`   Preserved enhancements: ${preserved.length}`);
        console.log(`   New from API: ${merged.length - enhanced.length}`);
        
        // Save merge preview
        const mergePath = path.join(__dirname, '..', 'src', 'data', 'exercises-merged-preview.json');
        fs.writeFileSync(mergePath, JSON.stringify(merged, null, 2));
        console.log(`   Merge preview saved to: ${mergePath}`);
      }
    } catch (error) {
      console.log('   API preview skipped (API key may be invalid)');
    }
  }
  
  console.log('\n✅ Enhancement complete!');
  console.log('📝 Next steps:');
  console.log('   1. Review the enhanced library');
  console.log('   2. Test the muscle mappings');
  console.log('   3. Replace the original library if satisfied');
  console.log('   4. Use the enhancement mapping for future API updates');
}

// Run enhancement
enhanceLibrary().catch(console.error); 