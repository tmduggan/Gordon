import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Special case mapping for problematic entries
const specialCaseMap = {
  '🍌': 'banana',
  'banana': 'banana',
  '300g berries': 'berries',
  'fried egg': 'fried eggs',
  'fried egg 🍳': 'fried eggs',
  '3 fried eggs': 'fried eggs',
  '100g sauteed green beans': 'sauteed green beans',
};

// Helper to normalize food names (remove emoji, lowercase, trim)
function normalizeName(name) {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  // Remove emoji and extra spaces
  n = n.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  // Remove leading numbers/units (e.g., '300g berries' -> 'berries')
  n = n.replace(/^(\d+\s*[a-zA-Z]+\s*)/, '').trim();
  // Check special case map
  if (specialCaseMap[n]) return specialCaseMap[n];
  return n;
}

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function convertEntries() {
  try {
    // Load exported entries and foods
    const entriesData = JSON.parse(fs.readFileSync('./entries_export_2025-06-11T16-48-09-058Z.json', 'utf8'));
    const foodsSnapshot = await db.collection('foods').get();
    const foods = {};
    foodsSnapshot.forEach(doc => {
      const norm = normalizeName(doc.data().label);
      foods[norm] = { id: doc.id, ...doc.data() };
    });

    const foodLogs = [];
    for (const [entryId, entry] of Object.entries(entriesData)) {
      // Normalize entry food name
      const entryName = normalizeName(entry.label || entry.food);
      let food = foods[entryName];
      // Regex-based fallback for eggs and banana
      if (!food) {
        if (/egg/i.test(entryName)) {
          food = foods['fried eggs'] || { id: 'CDBklRr8E1uLE6GSq4iC', units: 'egg' };
        } else if (/banana/i.test(entryName)) {
          food = foods['banana'] || { id: 'oiykmplTbDBwxsLYAv0w', units: 'g' };
        }
      }
      if (!food) {
        console.warn(`No food found for entry: ${entry.label || entry.food}`);
        continue;
      }
      // Use entry's quantity/serving, fallback to 1
      let serving = entry.serving || entry.quantity || 1;
      let units = food.units || 'serving';
      foodLogs.push({
        foodId: food.id,
        timestamp: entry.timestamp,
        serving,
        units
      });
    }

    // Write to JSON file
    fs.writeFileSync('foodLog_import.json', JSON.stringify(foodLogs, null, 2));
    console.log(`Converted ${foodLogs.length} entries to foodLog_import.json`);
  } catch (error) {
    console.error('Conversion error:', error);
  } finally {
    await admin.app().delete();
  }
}

convertEntries(); 