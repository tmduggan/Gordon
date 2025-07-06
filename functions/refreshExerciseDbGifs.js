const admin = require('firebase-admin');
const fetch = require('node-fetch');

async function refreshExerciseDbGifsCore(apiKey) {
  console.log('Refreshing ExerciseDB GIFs with optimized approach...');
  
  try {
    // Get existing exercises from Firestore first
    const exerciseLibraryRef = admin.firestore().collection('exerciseLibrary');
    const snapshot = await exerciseLibraryRef.get();
    const existingExercises = snapshot.docs.map(doc => ({ 
      docId: doc.id, 
      exerciseId: doc.data().id,
      ...doc.data() 
    }));
    
    console.log(`[DEBUG] Found ${existingExercises.length} existing exercises in Firestore`);
    
    if (existingExercises.length === 0) {
      console.log('No existing exercises found, skipping GIF refresh');
      return 0;
    }

    // Update GIF URLs for existing exercises only
    const now = Date.now();
    const updates = [];
    
    for (const exercise of existingExercises) {
      if (exercise.exerciseId) {
        const exId = String(exercise.exerciseId);
        const gifUrl_1080 = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exId}&resolution=1080&rapidapi-key=${apiKey}&t=${now}`;
        const gifUrl_360 = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exId}&resolution=360&rapidapi-key=${apiKey}&t=${now}`;
        
        updates.push({ 
          docRef: exerciseLibraryRef.doc(exercise.docId), 
          data: { gifUrl_1080, gifUrl_360 } 
        });
      }
    }
    
    console.log(`[DEBUG] Prepared updates for ${updates.length} exercises`);

    // Batch update in chunks
    const batchSize = 500;
    let totalUpdated = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = admin.firestore().batch();
      const chunk = updates.slice(i, i + batchSize);
      
      chunk.forEach(({ docRef, data }) => {
        batch.set(docRef, data, { merge: true });
      });
      
      await batch.commit();
      totalUpdated += chunk.length;
      console.log(`[DEBUG] Updated batch ${Math.floor(i / batchSize) + 1}: ${chunk.length} exercises`);
    }

    console.log(`GIF refresh complete. Updated ${totalUpdated} exercises.`);
    return totalUpdated;
    
  } catch (error) {
    console.error('Error in refreshExerciseDbGifsCore:', error);
    throw error;
  }
}

// Alternative: Fetch with reasonable limits if you need to sync new exercises
async function fetchLimitedExercises(apiKey, maxExercises = 100) {
  const allExercises = [];
  let offset = 0;
  const limit = 10;
  let attempts = 0;
  const maxAttempts = Math.ceil(maxExercises / limit);
  
  console.log(`[DEBUG] Fetching up to ${maxExercises} exercises`);
  
  while (allExercises.length < maxExercises && attempts < maxAttempts) {
    try {
      console.log(`[DEBUG] Fetching batch: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const exercises = await response.json();
      
      if (exercises.length === 0) {
        console.log(`[DEBUG] No more exercises found, stopping`);
        break;
      }
      
      allExercises.push(...exercises);
      offset += limit;
      attempts++;
      
      console.log(`[DEBUG] Total exercises collected: ${allExercises.length}`);
      
      // Shorter delay since we're limiting requests
      if (allExercises.length < maxExercises) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`[ERROR] Failed to fetch exercises at offset ${offset}:`, error.message);
      break;
    }
  }
  
  return allExercises.slice(0, maxExercises);
}

// Function to sync new exercises (separate from GIF refresh)
async function syncNewExercises(apiKey, maxNew = 50) {
  console.log('Syncing new exercises...');
  
  const exerciseLibraryRef = admin.firestore().collection('exerciseLibrary');
  const snapshot = await exerciseLibraryRef.get();
  const existingIds = new Set(snapshot.docs.map(doc => String(doc.data().id)).filter(Boolean));
  
  console.log(`[DEBUG] Found ${existingIds.size} existing exercise IDs`);
  
  const newExercises = await fetchLimitedExercises(apiKey, maxNew + existingIds.size);
  const exercisesToAdd = newExercises.filter(ex => ex.id && !existingIds.has(String(ex.id)));
  
  console.log(`[DEBUG] Found ${exercisesToAdd.length} new exercises to add`);
  
  if (exercisesToAdd.length === 0) {
    return 0;
  }
  
  const now = Date.now();
  const batch = admin.firestore().batch();
  
  exercisesToAdd.slice(0, maxNew).forEach(exercise => {
    const exId = String(exercise.id);
    const docRef = exerciseLibraryRef.doc();
    const data = {
      ...exercise,
      gifUrl_1080: `https://exercisedb.p.rapidapi.com/image?exerciseId=${exId}&resolution=1080&rapidapi-key=${apiKey}&t=${now}`,
      gifUrl_360: `https://exercisedb.p.rapidapi.com/image?exerciseId=${exId}&resolution=360&rapidapi-key=${apiKey}&t=${now}`,
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    batch.set(docRef, data);
  });
  
  await batch.commit();
  console.log(`Added ${exercisesToAdd.length} new exercises`);
  return exercisesToAdd.length;
}

module.exports = refreshExerciseDbGifsCore;