import type { Food } from '../types';

interface FoodLibrary {
  items: Food[];
}

interface FoodItem {
  id: string;
  type?: string;
  items?: any[];
}

// Returns true if the item is a valid food (in foodLibrary) or a valid nested recipe (type === 'recipe' and has items array)
export function isValidFoodItem(item: FoodItem | null | undefined, foodLibrary: FoodLibrary): boolean {
  if (!item || !item.id) return false;
  if (item.type === 'recipe' && Array.isArray(item.items)) return true; // nested recipe
  return foodLibrary.items.some((food) => food.id === item.id);
} 