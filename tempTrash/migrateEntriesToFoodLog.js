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

async function migrateEntries() {
  try {
    // Load exported entries and foods
    const entriesData = JSON.parse(fs.readFileSync('./entries_export_2025-06-11T16-48-09-058Z.json', 'utf8'));
    const foodsSnapshot = await db.collection('foods').get();
    const foods = {};
    foodsSnapshot.forEach(doc => {
      foods[doc.data().label] = { id: doc.id, ...doc.data() };
    });

    const foodLogs = [];
    for (const [entryId, entry] of Object.entries(entriesData)) {
      // Find food by label
      const food = foods[entry.label] || foods[entry.food];
      if (!food) {
        console.warn(`No food found for entry: ${entry.label || entry.food}`);
        continue;
      }
      // Determine serving and units
      let serving = entry.serving || entry.quantity || 1;
      let units = entry.units || food.units || 'serving';
      // Build new log
      foodLogs.push({
        foodId: food.id,
        timestamp: entry.timestamp,
        serving,
        units
      });
    }

    // Upload to foodLog collection
    const foodLogRef = db.collection('foodLog');
    const uploadPromises = foodLogs.map(log => foodLogRef.add(log));
    await Promise.all(uploadPromises);
    console.log(`Migrated ${foodLogs.length} entries to foodLog collection.`);
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await admin.app().delete();
  }
}

migrateEntries(); 