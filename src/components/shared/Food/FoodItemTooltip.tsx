import React, { useState, useRef } from 'react';
import NutritionLabel from '@/components/nutrition/NutritionLabel';
import type { FoodItem } from './FoodItemDisplay';

interface FoodItemTooltipProps {
  food: FoodItem;
  children: React.ReactNode; // the trigger (usually name/image)
}

const FoodItemTooltip: React.FC<FoodItemTooltipProps> = ({ food, children }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile detection (same as ExerciseTooltip)
  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };
  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  // Mobile tap handler
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setVisible((v) => !v);
  };

  return (
    <span
      className="relative"
      onMouseEnter={!isMobile ? showTooltip : undefined}
      onMouseLeave={!isMobile ? hideTooltip : undefined}
      onTouchStart={isMobile ? handleTouchStart : undefined}
    >
      {children}
      {visible && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-80 max-w-xs bg-white border border-gray-300 rounded shadow-lg p-3 text-sm" style={{ top: '100%' }}>
          {/* Image */}
          {food.photo?.thumb && (
            <img src={food.photo.thumb} alt={food.food_name || food.label || food.name} className="w-20 h-20 object-cover rounded mb-2 mx-auto" />
          )}
          {/* Name and brand */}
          <div className="font-bold text-base text-center mb-1">{food.food_name || food.label || food.name}</div>
          {food.brand_name && <div className="text-xs text-gray-500 text-center mb-1">{food.brand_name}</div>}
          {/* Serving size */}
          {food.serving_qty && food.serving_unit && (
            <div className="text-xs text-gray-500 text-center mb-1">
              Serving: {food.serving_qty} {food.serving_unit}
            </div>
          )}
          {/* Calories/macros summary */}
          <div className="flex justify-center gap-3 text-xs mb-2">
            {food.calories !== undefined && <span>Cal: <b>{food.calories}</b></span>}
            {food.macros?.protein !== undefined && <span>P: <b>{food.macros.protein}g</b></span>}
            {food.macros?.carbs !== undefined && <span>C: <b>{food.macros.carbs}g</b></span>}
            {food.macros?.fat !== undefined && <span>F: <b>{food.macros.fat}g</b></span>}
          </div>
          {/* Nutrition label */}
          <NutritionLabel food={food} />
        </div>
      )}
    </span>
  );
};

export default FoodItemTooltip; 