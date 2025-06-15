import fs from 'fs';

// Helper to normalize food names for document IDs
function normalizeFoodId(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '') // remove punctuation
    .trim()
    .replace(/\s+/g, '_')      // replace spaces with underscores
    .slice(0, 32);              // truncate to 32 chars
}

// Nutrition fields to include
const nutritionFields = [
  'calories', 'fat', 'carbs', 'protein', 'fiber',
  'sodium', 'potassium', 'vitamin_c', 'vitamin_b6', 'iron'
];

// Read the exported foods
const inputPath = './exports/foods.json';
const outputPath = './exports/foods_for_import.json';
const foodsRaw = JSON.parse(fs.readFileSync(inputPath));

const foodsForImport = {};

for (const [oldId, food] of Object.entries(foodsRaw)) {
  const id = normalizeFoodId(food.label);
  // Nutrition block, fill missing with 0
  const nutrition = {};
  nutritionFields.forEach(field => {
    nutrition[field] = food[field] !== undefined ? food[field] : 0;
  });
  // Default serving
  let defaultServing = { label: `1 ${food.units || 'serving'}`, grams: food.serving || 0 };
  // If units is grams, use serving as grams, else leave as is
  if ((food.units || '').toLowerCase() === 'g') {
    defaultServing = { label: `${food.serving}g`, grams: food.serving };
  }
  // Tags: start with empty, can expand later
  const tags = [];
  foodsForImport[id] = {
    label: food.label,
    default_serving: defaultServing,
    base_unit: 'g',
    base_amount: 100,
    nutrition,
    tags
  };
}

fs.writeFileSync(outputPath, JSON.stringify(foodsForImport, null, 2));
console.log(`✅ Converted foods to new import format: ${outputPath}`); 