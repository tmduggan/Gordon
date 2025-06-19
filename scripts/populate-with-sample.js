// Script to populate exerciseLibrary collection with sample data
// This bypasses API calls and authentication issues by using sample data

import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Use the same Firebase config as the app
const firebaseConfig = {
  apiKey: "AIzaSyBuxTa1BC-QdKY4DtMWKzNNorjHfkbEXik",
  authDomain: "food-tracker-19c9d.firebaseapp.com",
  projectId: "food-tracker-19c9d",
  storageBucket: "food-tracker-19c9d.appspot.com",
  messagingSenderId: "961928172022",
  appId: "1:961928172022:web:9a85ac5ae45a10de35b7d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample exercise data from apiReturnStructure.json
const sampleExercises = [
  {
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "gifUrl": "https://v2.exercisedb.io/image/TlETElKG-cme2H",
    "id": "0024",
    "name": "barbell bench front squat",
    "target": "quads",
    "secondaryMuscles": ["hamstrings", "glutes", "calves"],
    "instructions": [
      "Start by standing with your feet shoulder-width apart and the barbell resting on your upper chest, just below your collarbone.",
      "Hold the barbell with an overhand grip, keeping your elbows up and your upper arms parallel to the ground.",
      "Lower your body down into a squat position by bending at the knees and hips, keeping your back straight and your chest up.",
      "Pause for a moment at the bottom of the squat, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "description": "The barbell bench front squat is a compound lower body exercise that targets the quadriceps, with secondary emphasis on the hamstrings, glutes, and calves. It requires holding a barbell in the front rack position and performing a squat, demanding good core stability, balance, and mobility.",
    "difficulty": "intermediate",
    "category": "strength"
  },
  {
    "bodyPart": "chest",
    "equipment": "barbell",
    "gifUrl": "https://v2.exercisedb.io/image/8DybE1ln2WAE-s",
    "id": "0025",
    "name": "barbell bench press",
    "target": "pectorals",
    "secondaryMuscles": ["triceps", "shoulders"],
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Grasp the barbell with an overhand grip slightly wider than shoulder-width apart.",
      "Lift the barbell off the rack and hold it directly above your chest with your arms fully extended.",
      "Lower the barbell slowly towards your chest, keeping your elbows tucked in.",
      "Pause for a moment when the barbell touches your chest.",
      "Push the barbell back up to the starting position by extending your arms.",
      "Repeat for the desired number of repetitions."
    ],
    "description": "The barbell bench press is a classic compound exercise that primarily targets the pectoral muscles, while also engaging the triceps and shoulders. It is performed by lying on a bench and pressing a barbell up and down in a controlled manner.",
    "difficulty": "intermediate",
    "category": "strength"
  },
  {
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "gifUrl": "https://v2.exercisedb.io/image/D2lfEXMy1FEw2i",
    "id": "0026",
    "name": "barbell bench squat",
    "target": "quads",
    "secondaryMuscles": ["glutes", "hamstrings", "calves"],
    "instructions": [
      "Set up a barbell on a squat rack at chest height.",
      "Stand facing away from the rack, with your feet shoulder-width apart.",
      "Bend your knees and lower your body down into a squat position, keeping your back straight and chest up.",
      "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Lift the barbell off the rack and step back, ensuring your feet are still shoulder-width apart.",
      "Lower your body down into a squat, keeping your knees in line with your toes.",
      "Pause for a moment at the bottom, then push through your heels to return to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "description": "The barbell bench squat is a compound lower body exercise that primarily targets the quadriceps, while also engaging the glutes, hamstrings, and calves. It involves squatting with a barbell, requiring good technique and strength.",
    "difficulty": "intermediate",
    "category": "strength"
  },
  {
    "bodyPart": "upper arms",
    "equipment": "barbell",
    "gifUrl": "https://v2.exercisedb.io/image/u0JXM6Tk9gzTPV",
    "id": "0030",
    "name": "barbell close-grip bench press",
    "target": "triceps",
    "secondaryMuscles": ["chest", "shoulders"],
    "instructions": [
      "Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.",
      "Grasp the barbell with a close grip, slightly narrower than shoulder-width apart.",
      "Unrack the barbell and lower it slowly towards your chest, keeping your elbows close to your body.",
      "Pause for a moment when the barbell touches your chest.",
      "Push the barbell back up to the starting position, fully extending your arms.",
      "Repeat for the desired number of repetitions."
    ],
    "description": "The barbell close-grip bench press is a compound exercise primarily targeting the triceps, with secondary emphasis on the chest and shoulders. It is performed by lying on a bench, gripping the barbell with a close grip, and pressing the weight up and down while keeping the elbows close to the body.",
    "difficulty": "intermediate",
    "category": "strength"
  },
  {
    "bodyPart": "chest",
    "equipment": "barbell",
    "gifUrl": "https://v2.exercisedb.io/image/ymk7PvhHVdQpbj",
    "id": "0047",
    "name": "barbell incline bench press",
    "target": "pectorals",
    "secondaryMuscles": ["shoulders", "triceps"],
    "instructions": [
      "Set up an incline bench at a 45-degree angle.",
      "Lie down on the bench with your feet flat on the ground.",
      "Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.",
      "Unrack the barbell and lower it slowly towards your chest, keeping your elbows at a 45-degree angle.",
      "Pause for a moment at the bottom, then push the barbell back up to the starting position.",
      "Repeat for the desired number of repetitions."
    ],
    "description": "The barbell incline bench press is a compound upper-body exercise that targets the upper portion of the pectoral muscles, with secondary emphasis on the shoulders and triceps. It is performed on an incline bench using a barbell, making it a staple in strength training routines for developing chest size and strength.",
    "difficulty": "intermediate",
    "category": "strength"
  }
];

// Error handling function
function handleError(error, context) {
  console.error(`❌ Error in ${context}:`, error);
  console.error('Error message:', error.message);
}

// Save exercise to Firestore with error handling
async function saveExerciseToLibrary(exercise) {
  try {
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
      source: 'sample-data'
    });
    
    console.log(`✅ Exercise saved to library: ${exercise.name}`);
    return true;
    
  } catch (error) {
    handleError(error, `saving exercise ${exercise.name}`);
    return false;
  }
}

// Populate exercise library with sample data
async function populateExerciseLibrary() {
  console.log('🚀 Starting exercise library population with sample data...');
  
  try {
    console.log(`📋 Found ${sampleExercises.length} sample exercises`);
    
    // Save exercises to Firestore
    console.log('\n💾 Saving exercises to Firestore...');
    let savedCount = 0;
    let skippedCount = 0;
    
    for (const exercise of sampleExercises) {
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
    console.log(`📈 Total processed: ${sampleExercises.length} exercises`);
    
    if (savedCount > 0) {
      console.log('\n🎉 Success! You can now test the exercise search in your app.');
      console.log('💡 Go to the Exercise tab and search for: bench, squat, press');
    }
    
  } catch (error) {
    handleError(error, 'population process');
  }
}

console.log('🎯 Exercise Library Population Script (Sample Data)');
console.log('📝 Using sample exercise data from apiReturnStructure.json');
console.log('');

// Run the population script
populateExerciseLibrary().then(() => {
  console.log('\n🎉 Exercise library population complete!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Population failed:', error);
  process.exit(1);
}); 