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

async function exportEntries() {
  try {
    console.log("Starting export of entries collection...");
    const entriesRef = db.collection("entries");
    const snapshot = await entriesRef.get();

    if (snapshot.empty) {
      console.log("No documents found in entries collection!");
      return;
    }

    const data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `entries_export_${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Successfully exported ${Object.keys(data).length} entries to ${filename}`);
  } catch (error) {
    console.error("Error exporting entries:", error);
  } finally {
    await admin.app().delete();
  }
}

exportEntries(); 