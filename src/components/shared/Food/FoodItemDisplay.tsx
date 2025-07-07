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

  const formatNumber = (val: any) => {
    if (typeof val === 'number') {
      return Number.isInteger(val) ? val : val.toFixed(2).replace(/\.00$/, '');
    }
    return val;
  };

  return (
    <div className="flex items-center justify-between w-full min-w-0 gap-2">
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
        </div>
        <div className="flex items-center min-h-[18px] text-xs text-gray-500">
          {brand && <span>{brand}</span>}
          {servingQty && servingUnit && (
            <span className="ml-1">{formatNumber(servingQty)} {servingUnit}</span>
          )}
        </div>
      </div>
      {/* Calories and Pin: only show in non-search contexts */}
      {context !== 'search' && (
        <div className="flex flex-row items-center justify-end w-[90px] gap-2 ml-2 text-right">
          <span className="flex items-baseline">
            <span className="font-mono text-base text-right">{formatNumber(cal)}</span>
            <span className="ml-1 text-xs text-gray-500">cal</span>
          </span>
          {showActions && onPin && (
            <Button variant="ghost" size="icon" onClick={onPin} className="h-6 w-6 ml-1">
              <span className="text-lg" title={isPinned ? 'Unpin' : 'Pin'}>
                {isPinned ? '\ud83d\udccc' : '\ud83d\udccd'}
              </span>
            </Button>
          )}
          {showActions && onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6 text-red-500">
              \u2715
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default FoodItemDisplay; 