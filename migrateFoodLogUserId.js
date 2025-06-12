const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Path to your service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const YOUR_UID = 'GLsdSrRYnkM16UnViF2KoCPViTs2'; // Provided UID

async function migrateFoodLog() {
  const snapshot = await db.collection('foodLog').get();
  const batch = db.batch();

  snapshot.forEach(doc => {
    batch.update(doc.ref, { userId: YOUR_UID });
  });

  await batch.commit();
  console.log(`Updated ${snapshot.size} foodLog entries with userId: ${YOUR_UID}`);
  process.exit(0);
}

migrateFoodLog().catch(err => {
  console.error(err);
  process.exit(1);
}); 