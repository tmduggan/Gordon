import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const newFoods = JSON.parse(fs.readFileSync('./exports/foods_for_import.json'));
const newIds = new Set(Object.keys(newFoods));

async function deleteOldFoods() {
  const snapshot = await db.collection('foods').get();
  let deleted = 0;
  for (const doc of snapshot.docs) {
    if (!newIds.has(doc.id)) {
      await doc.ref.delete();
      console.log(`Deleted old food: ${doc.id}`);
      deleted++;
    }
  }
  console.log(`✅ Deleted ${deleted} old foods.`);
}

deleteOldFoods(); 