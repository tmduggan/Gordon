import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importFoodLog() {
  try {
    const foodLogs = JSON.parse(fs.readFileSync('./foodLog_import.json', 'utf8'));
    const foodLogRef = db.collection('foodLog');
    const uploadPromises = foodLogs.map(log => foodLogRef.add(log));
    await Promise.all(uploadPromises);
    console.log(`Successfully imported ${foodLogs.length} food log entries to foodLog collection.`);
  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await admin.app().delete();
  }
}

importFoodLog(); 