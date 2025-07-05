import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChefHat, Save } from 'lucide-react';
import React, { useState } from 'react';
import useCart from '../../hooks/useCart';

export default function SaveCartAsRecipe({
  cart,
  onRecipeCreated,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(1);
  const foodCart = useCart('food');

  const handleSaveRecipe = () => {
    if (recipeName.trim() && cart.length > 0 && servings > 0) {
      const recipeItems = cart.map((item) => ({
        id: item.id,
        quantity: item.quantity || 1,
        unit: item.serving_unit || item.units || 'serving',
        isRecipe: item.type === 'recipe' || item.isRecipe || false,
      }));
      const recipe = {
        id: `recipe_${Date.now()}`,
        name: recipeName.trim(),
        createdAt: new Date().toISOString(),
        servings: servings,
        items: recipeItems,
      };
      onRecipeCreated(recipe);
      setIsOpen(false);
      setRecipeName('');
      setServings(1);
      foodCart.clearCart();
      foodCart.addToCart(recipe, 1);
    }
  };

  const calculateTotalMacros = () => {
    return cart.reduce(
      (total, item) => ({
        calories: (total.calories || 0) + (item.calories || 0),
        protein: (total.protein || 0) + (item.protein || 0),
        carbs: (total.carbs || 0) + (item.carbs || 0),
        fat: (total.fat || 0) + (item.fat || 0),
        fiber: (total.fiber || 0) + (item.fiber || 0),
      }),
      {}
    );
  };

  const totalMacros = calculateTotalMacros();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || cart.length === 0}
          className="flex items-center gap-2"
        >
          <ChefHat className="h-4 w-4" />
          Save as Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Cart as Recipe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Recipe Name
            </label>
            <Input
              placeholder="e.g., My Custom Meal"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />
          </div>

          {/* Number of Servings Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Number of Servings
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              placeholder="e.g., 4"
            />
          </div>

          {/* Cart Items Preview */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipe Ingredients</label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {cart.map((item, index) => (
                  <Card key={index} className="p-2">
                    <div className="text-sm">
                      <div className="font-medium">
                        {item.food_name || item.label || item.name}
                      </div>
                      <div className="text-gray-500">
                        {item.quantity}{' '}
                        {item.serving_unit || item.units || 'serving'} |
                        {Math.round(item.calories || 0)} cal
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Total Macros */}
          {cart.length > 0 && (
            <Card className="p-3 bg-gray-50">
              <div className="text-sm font-medium mb-2">
                Total Recipe Macros:
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: {Math.round(totalMacros.calories)}</div>
                <div>Protein: {Math.round(totalMacros.protein)}g</div>
                <div>Carbs: {Math.round(totalMacros.carbs)}g</div>
                <div>Fat: {Math.round(totalMacros.fat)}g</div>
                {totalMacros.fiber > 0 && (
                  <div>Fiber: {Math.round(totalMacros.fiber)}g</div>
                )}
              </div>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRecipe}
              disabled={!recipeName.trim() || cart.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Recipe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
