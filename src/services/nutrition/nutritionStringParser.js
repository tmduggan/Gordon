// Nutrition String Parser
// Parses input like: '150g grilled chicken, 100g quinoa, 50g steamed broccoli, 20g almonds'
// Returns: [{ qty: 150, unit: 'g', name: 'grilled chicken' }, ...]

export function parseNutritionString(input) {
  if (!input || typeof input !== 'string') return [];
  // Split by commas for each food item
  const items = input.split(',').map(item => item.trim()).filter(Boolean);
  const results = [];
  const regex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(.+)$/;

  for (const item of items) {
    const match = item.match(regex);
    if (match) {
      const qty = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      const name = match[3].trim().toLowerCase();
      results.push({ qty, unit, name });
    } else {
      // If parsing fails, treat the whole item as a name (fallback)
      results.push({ qty: 1, unit: '', name: item.toLowerCase() });
    }
  }
  return results;
} 