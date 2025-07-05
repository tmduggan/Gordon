import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getNextMealSuggestion } from '@/services/AISuggestionService';
import { parseNutritionString } from '@/services/nutrition/nutritionStringParser';
import React, { useState } from 'react';
import type { Food, Log, UserProfile } from '../../types';

interface NutritionGoals {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  [key: string]: any;
}

interface ParsedFood {
  qty: number;
  unit: string;
  name: string;
}

interface SuggestedFoodsCardProps {
  foodLog: Log[];
  nutritionGoals: NutritionGoals;
  onAddFoods: (foods: ParsedFood[]) => void;
  handleNutrientsAdd?: (foods: ParsedFood[]) => void;
  usage: number;
  onUsage: () => void;
  isAdmin?: boolean;
  onResetUsage?: () => void;
}

export default function SuggestedFoodsCard({
  foodLog,
  nutritionGoals,
  onAddFoods,
  handleNutrientsAdd,
  usage,
  onUsage,
  isAdmin,
  onResetUsage,
}: SuggestedFoodsCardProps) {
  const [suggestion, setSuggestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleBuildNextMeal = async (): Promise<void> => {
    if (usage >= 3) return;
    setLoading(true);
    const result = await getNextMealSuggestion({ foodLog, nutritionGoals });
    setSuggestion(result);
    setLoading(false);
    onUsage();
  };

  const handleAddToCart = (): void => {
    if (!suggestion) return;
    const parsedFoods: ParsedFood[] = parseNutritionString(suggestion);
    if (handleNutrientsAdd) {
      handleNutrientsAdd(parsedFoods);
    } else {
      onAddFoods(parsedFoods);
    }
  };

  return (
    <Card>
      <CardHeader>Suggested Foods</CardHeader>
      <CardContent>
        <div>
          <div>
            <strong>Uses today:</strong> {usage} / 3
            {isAdmin && (
              <Button
                onClick={onResetUsage}
                size="sm"
                style={{ marginLeft: 8 }}
              >
                Reset
              </Button>
            )}
          </div>
          {suggestion ? (
            <div>
              <div style={{ margin: '12px 0' }}>{suggestion}</div>
              <Button onClick={handleAddToCart}>Add to cart</Button>
            </div>
          ) : (
            <Button
              onClick={handleBuildNextMeal}
              disabled={usage >= 3}
              {...(loading ? { 'data-loading': true } : {})}
            >
              {loading ? 'Building...' : 'Build next meal'}
            </Button>
          )}
          {usage >= 3 && (
            <div style={{ color: 'red', marginTop: 8 }}>
              Daily limit reached
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 