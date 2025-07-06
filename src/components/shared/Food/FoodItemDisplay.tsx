import React from 'react';
import { Button } from '@/components/ui/button';

export interface FoodItem {
  id?: string;
  food_name?: string;
  label?: string;
  name?: string;
  brand_name?: string;
  photo?: { thumb?: string };
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

interface FoodItemDisplayProps {
  food: FoodItem;
  context?: 'cart' | 'search' | 'log' | 'recipe' | 'other';
  onRemove?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  showActions?: boolean;
  quantity?: number;
  unit?: string;
  calories?: number;
  children?: React.ReactNode;
}

const FoodItemDisplay: React.FC<FoodItemDisplayProps> = ({
  food,
  context = 'other',
  onRemove,
  onPin,
  isPinned,
  showActions = true,
  quantity,
  unit,
  calories,
  children,
}) => {
  const name = food.food_name || food.label || food.name || '';
  const brand = food.brand_name || '';
  const thumb = food.photo && typeof food.photo.thumb === 'string' && food.photo.thumb ? food.photo.thumb : undefined;
  const servingQty = food.serving_qty || quantity;
  const servingUnit = food.serving_unit || unit;
  const cal = typeof calories === 'number' ? calories : food.calories || food.macros?.calories || 0;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Image */}
      {thumb ? (
        <img src={thumb} alt={name} className="h-7 w-7 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="h-7 w-7 bg-gray-100 rounded flex-shrink-0" />
      )}
      {/* Main info */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center min-w-0">
          <span className="truncate font-medium text-sm">{name}</span>
          {isPinned && (
            <span className="ml-1 text-xs text-yellow-500" title="Pinned">📌</span>
          )}
        </div>
        <div className="flex items-center min-h-[18px] text-xs text-gray-500">
          {brand && <span>{brand}</span>}
          {servingQty && servingUnit && (
            <span className="ml-1">{servingQty} {servingUnit}</span>
          )}
        </div>
      </div>
      {/* Calories */}
      <div className="flex flex-col items-end justify-center min-w-[60px]">
        <span className="flex items-baseline">
          <span className="font-mono text-base text-right">{cal}</span>
          <span className="ml-1 text-xs text-gray-500">cal</span>
        </span>
      </div>
      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1 ml-2">
          {onPin && (
            <Button variant="ghost" size="icon" onClick={onPin} className="h-6 w-6">
              {isPinned ? 'Unpin' : 'Pin'}
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6 text-red-500">
              ✕
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default FoodItemDisplay; 