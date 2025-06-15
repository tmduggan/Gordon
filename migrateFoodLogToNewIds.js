import fs from 'fs';

// Load old foodLog and foods mapping
const foodLog = JSON.parse(fs.readFileSync('./exports/foodLog.json'));
const oldFoods = JSON.parse(fs.readFileSync('./exports/foods.json'));
const newFoods = JSON.parse(fs.readFileSync('./exports/foods_for_import_full_updated.json'));

// Build a mapping from old hash food IDs to labels
const oldIdToLabel = {};
for (const [oldId, food] of Object.entries(oldFoods)) {
  oldIdToLabel[oldId] = food.label;
}

// Build a mapping from label (lowercase) to new readable ID
const labelToNewId = {};
for (const [newId, food] of Object.entries(newFoods)) {
  labelToNewId[food.label.toLowerCase()] = newId;
}

const newFoodLog = {};

for (const [oldKey, entry] of Object.entries(foodLog)) {
  let newFoodId = entry.foodId;
  // If foodId is a hash, map to label, then to new ID
  if (oldIdToLabel[entry.foodId]) {
    const label = oldIdToLabel[entry.foodId].toLowerCase();
    if (labelToNewId[label]) {
      newFoodId = labelToNewId[label];
    }
  }
  // New key
  const newKey = `${entry.timestamp}_${newFoodId}`;
  newFoodLog[newKey] = { ...entry, foodId: newFoodId };
}

fs.writeFileSync('./exports/foodLog_for_import.json', JSON.stringify(newFoodLog, null, 2));
console.log('✅ Migrated foodLog to new naming and food IDs: ./exports/foodLog_for_import.json'); 