import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const foodLog = JSON.parse(fs.readFileSync('./exports/foodLog_for_import.json'));

async function importFoodLog() {
  let count = 0;
  for (const [id, data] of Object.entries(foodLog)) {
    await db.collection('foodLog').doc(id).set(data, { merge: true });
    console.log(`Imported: ${id}`);
    count++;
  }
  console.log(`✅ Imported ${count} food log entries!`);
}

importFoodLog(); 