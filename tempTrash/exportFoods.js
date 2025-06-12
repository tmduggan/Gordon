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

async function exportFoods() {
  try {
    console.log("Starting export of foods collection...");
    const foodsRef = db.collection("foods");
    const snapshot = await foodsRef.get();

    if (snapshot.empty) {
      console.log("No documents found in foods collection!");
      return;
    }

    const data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });

    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `foods_export_${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Successfully exported ${Object.keys(data).length} food items to ${filename}`);
  } catch (error) {
    console.error("Error exporting foods:", error);
  } finally {
    // Clean up Firebase Admin
    await admin.app().delete();
  }
}

exportFoods(); 