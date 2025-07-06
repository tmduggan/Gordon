/**
 * Utility functions for food item handling and normalization
 */

export interface NormalizedFoodItem {
  id?: string;
  food_name?: string;
  label?: string;
  name?: string;
  brand_name?: string;
  photo?: { thumb: string };
  serving_qty?: number;
  serving_unit?: string;
  calories?: number;
  macros?: { calories?: number; protein?: number; carbs?: number; fat?: number };
  isRecipe?: boolean;
  items?: Array<any>;
  servings?: number;
  quantity?: number;
  unit?: string;
  [key: string]: any;
}

/**
 * Normalize a food object for consistent display and tooltip usage
 * Ensures consistent property names and photo structure
 */
export function normalizeFoodForDisplay(item: any): NormalizedFoodItem {
  const label = item.label || item.food_name || item.name || '';
  let normalized: NormalizedFoodItem = { ...item, label };
  
  // Normalize photo structure
  if (item.photo && typeof item.photo.thumb === 'string' && item.photo.thumb) {
    normalized.photo = { thumb: item.photo.thumb };
  } else {
    delete normalized.photo;
  }
  
  return normalized;
}

/**
 * Get the display name for a food item, handling different property names
 */
export function getFoodDisplayName(item: any): string {
  return item.food_name || item.label || item.name || '';
}

/**
 * Get the brand name for a food item
 */
export function getFoodBrandName(item: any): string {
  return item.brand_name || '';
}

/**
 * Get the serving information for a food item
 */
export function getFoodServingInfo(item: any): { qty?: number; unit?: string } {
  return {
    qty: item.serving_qty || item.quantity,
    unit: item.serving_unit || item.unit
  };
} 