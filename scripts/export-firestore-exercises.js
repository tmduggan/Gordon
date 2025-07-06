import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your service account key
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found. Please download it from Firebase Console and place it in the project root.');
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportExercises() {
  const snapshot = await db.collection('exerciseLibrary').get();
  const exercises = [];
  snapshot.forEach(doc => {
    exercises.push(doc.data());
  });
  const outPath = path.join(__dirname, '..', 'src', 'data', 'exercises.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(exercises, null, 2));
  console.log(`✅ Exported ${exercises.length} exercises to ${outPath}`);
  process.exit(0);
}

exportExercises(); 