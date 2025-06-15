import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const foods = JSON.parse(fs.readFileSync('./exports/foods_for_import.json'));

async function importFoods() {
  for (const [id, data] of Object.entries(foods)) {
    await db.collection('foods').doc(id).set(data, { merge: true });
    console.log(`Imported: ${id}`);
  }
  console.log('✅ All foods imported!');
}

importFoods(); 