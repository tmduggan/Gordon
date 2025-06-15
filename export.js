// export.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const collectionName = process.argv[2];
if (!collectionName) {
  console.error('❌ Please provide a collection name. Example: node export.js foods');
  process.exit(1);
}

async function exportCollection(name) {
  try {
    const snapshot = await db.collection(name).get();
    const out = {};
    snapshot.forEach(doc => {
      out[doc.id] = doc.data();
    });

    fs.writeFileSync(`./exports/${name}.json`, JSON.stringify(out, null, 2));
    console.log(`✅ Exported '${name}' to ./exports/${name}.json`);
  } catch (err) {
    console.error('❌ Failed to export collection:', err);
  }
}

exportCollection(collectionName);
