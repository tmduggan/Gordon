const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Helper: Load all exercises from exerciseLibrary
async function loadExerciseLibrary() {
  const snapshot = await db.collection('exerciseLibrary').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Helper: Load all workout logs for a user
async function loadWorkoutLogs(userId) {
  const snapshot = await db.collection('users').doc(userId).collection('workoutLog').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Helper: Get all users (assume only one user for this script)
async function getFirstUserId() {
  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) throw new Error('No users found');
  return usersSnap.docs[0].id;
}

// Helper: Calculate muscle reps for a period
dateDiffInDays = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));

function getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, timePeriod, referenceDate = new Date()) {
  const muscleName = muscle.toLowerCase().trim();
  let totalReps = 0;
  let cutoffDate = new Date(0);
  if (timePeriod !== 'lifetime') {
    const days = { today: 0, '3day': 3, '7day': 7 };
    if (days[timePeriod] !== undefined) {
      cutoffDate = new Date(referenceDate.getTime() - days[timePeriod] * 24 * 60 * 60 * 1000);
    }
  }
  workoutLogs.forEach(log => {
    const logDate = log.timestamp && log.timestamp._seconds
      ? new Date(log.timestamp._seconds * 1000)
      : (log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp));
    if (logDate >= cutoffDate) {
      const exercise = exerciseLibrary.find(e => e.id === log.exerciseId);
      if (!exercise) return;
      let reps = 0;
      if (log.sets && log.sets.length > 0) {
        reps = log.sets.reduce((sum, set) => sum + (parseInt(set.reps) || 0), 0);
      } else if (log.reps) {
        reps = parseInt(log.reps) || 0;
      }
      const targetMuscles = exercise.target ? exercise.target.split(',').map(m => m.trim().toLowerCase()) : [];
      const secondaryMuscles = exercise.secondaryMuscles ?
        (Array.isArray(exercise.secondaryMuscles)
          ? exercise.secondaryMuscles.flatMap(m => m.split(',').map(s => s.trim().toLowerCase()))
          : exercise.secondaryMuscles.split(',').map(m => m.trim().toLowerCase()))
        : [];
      const allMuscles = [...targetMuscles, ...secondaryMuscles];
      if (allMuscles.includes(muscleName)) {
        totalReps += reps;
      }
    }
  });
  return totalReps;
}

// Main migration function
async function updateMuscleScores() {
  const userId = await getFirstUserId();
  console.log('Updating muscle scores for user:', userId);
  const exerciseLibrary = await loadExerciseLibrary();
  const workoutLogs = await loadWorkoutLogs(userId);

  // Get all unique muscles from the exercise library
  const allMuscles = new Set();
  exerciseLibrary.forEach(exercise => {
    if (exercise.target) {
      exercise.target.split(',').forEach(m => allMuscles.add(m.trim().toLowerCase()));
    }
    if (exercise.secondaryMuscles) {
      if (Array.isArray(exercise.secondaryMuscles)) {
        exercise.secondaryMuscles.forEach(m => m.split(',').forEach(s => allMuscles.add(s.trim().toLowerCase())));
      } else {
        exercise.secondaryMuscles.split(',').forEach(m => allMuscles.add(m.trim().toLowerCase()));
      }
    }
  });

  // Calculate scores for each muscle
  const muscleScores = {};
  for (const muscle of allMuscles) {
    muscleScores[muscle] = {
      today: getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, 'today'),
      '3day': getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, '3day'),
      '7day': getMuscleRepsForPeriod(workoutLogs, exerciseLibrary, muscle, '7day'),
    };
  }

  // Update user profile
  await db.collection('users').doc(userId).update({ muscleScores });
  console.log('Muscle scores updated for user:', userId);
}

updateMuscleScores().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error updating muscle scores:', err);
  process.exit(1);
}); 