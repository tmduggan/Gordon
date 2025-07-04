import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getNextMealSuggestion } from '@/services/AISuggestionService';

export default function SuggestedFoodsCard({ foodLog, nutritionGoals, onAddFoods, usage, onUsage, isAdmin, onResetUsage }) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuildNextMeal = async () => {
    if (usage >= 3) return;
    setLoading(true);
    const result = await getNextMealSuggestion({ foodLog, nutritionGoals });
    setSuggestion(result);
    setLoading(false);
    onUsage();
  };

  const handleAddToCart = () => {
    if (!suggestion) return;
    const foods = suggestion.split(',').map(item => item.trim());
    onAddFoods(foods);
  };

  return (
    <Card>
      <CardHeader>Suggested Foods</CardHeader>
      <CardContent>
        <div>
          <div>
            <strong>Uses today:</strong> {usage} / 3
            {isAdmin && (
              <Button onClick={onResetUsage} size="sm" style={{ marginLeft: 8 }}>
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
            <Button onClick={handleBuildNextMeal} disabled={usage >= 3} {...(loading ? { 'data-loading': true } : {})}>
              {loading ? 'Building...' : 'Build next meal'}
            </Button>
          )}
          {usage >= 3 && <div style={{ color: 'red', marginTop: 8 }}>Daily limit reached</div>}
        </div>
      </CardContent>
    </Card>
  );
} 