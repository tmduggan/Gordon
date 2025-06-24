import React from 'react';
import NutritionLabel from "../nutrition/NutritionLabel";

/**
 * Food-specific tooltip content component
 * Displays food information in the tooltip
 */
export function FoodTooltipContent({ item }) {
  return (
    <div className="mb-2">
      <div className="font-semibold text-base mb-1 text-center">
        {item.food_name || item.label || item.name}
        {item.serving_qty && item.serving_unit && (
          <span className="block text-xs font-normal text-gray-600 mt-0.5">
            {item.serving_qty} {item.serving_unit}
            {item.serving_weight_grams ? ` (${item.serving_weight_grams}g)` : ''}
          </span>
        )}
      </div>
      <NutritionLabel food={item} />
    </div>
  );
} 