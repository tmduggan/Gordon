import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Pattern: ISO timestamp + underscore + readable foodId (letters, underscores)
const newIdPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z_[a-z_]+$/;

async function deleteOldFoodLogEntries() {
  const snapshot = await db.collection('foodLog').get();
  let deleted = 0;
  for (const doc of snapshot.docs) {
    if (!newIdPattern.test(doc.id)) {
      await doc.ref.delete();
      console.log(`Deleted old foodLog entry: ${doc.id}`);
      deleted++;
    }
  }
  console.log(`✅ Deleted ${deleted} old foodLog entries.`);
}

deleteOldFoodLogEntries(); 