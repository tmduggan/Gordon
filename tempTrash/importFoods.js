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

async function importFoods() {
  try {
    console.log("Starting import of foods collection...");
    
    // Read the JSON file
    const foodsData = JSON.parse(fs.readFileSync('./foods_export_2025-06-11T16-13-12-765Z.json', 'utf8'));
    
    // Get the foods collection reference
    const foodsRef = db.collection('foods');
    
    // Delete existing documents
    const snapshot = await foodsRef.get();
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    console.log("Deleted existing food items");
    
    // Add new documents
    const addPromises = Object.entries(foodsData).map(([id, data]) => {
      return foodsRef.doc(id).set(data);
    });
    
    await Promise.all(addPromises);
    console.log(`Successfully imported ${Object.keys(foodsData).length} food items`);
    
  } catch (error) {
    console.error("Error importing foods:", error);
  } finally {
    // Clean up Firebase Admin
    await admin.app().delete();
  }
}

importFoods(); 