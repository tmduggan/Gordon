import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Save, ChefHat } from 'lucide-react';

export default function SaveCartAsRecipe({ cart, onRecipeCreated, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipeName, setRecipeName] = useState('');

  const handleSaveRecipe = () => {
    if (recipeName.trim() && cart.length > 0) {
      // Convert cart items to recipe format
      const recipeItems = cart.map(item => ({
        id: item.id,
        name: item.food_name || item.label || item.name,
        quantity: item.quantity || 1,
        unit: item.serving_unit || item.units || 'serving',
        macros: {
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
          fiber: item.fiber || 0
        }
      }));

      const recipe = {
        id: `recipe_${Date.now()}`,
        name: recipeName.trim(),
        items: recipeItems,
        createdAt: new Date().toISOString(),
        totalMacros: cart.reduce((total, item) => ({
          calories: (total.calories || 0) + (item.calories || 0),
          protein: (total.protein || 0) + (item.protein || 0),
          carbs: (total.carbs || 0) + (item.carbs || 0),
          fat: (total.fat || 0) + (item.fat || 0),
          fiber: (total.fiber || 0) + (item.fiber || 0)
        }), {})
      };
      
      onRecipeCreated(recipe);
      setIsOpen(false);
      setRecipeName('');
    }
  };

  const calculateTotalMacros = () => {
    return cart.reduce((total, item) => ({
      calories: (total.calories || 0) + (item.calories || 0),
      protein: (total.protein || 0) + (item.protein || 0),
      carbs: (total.carbs || 0) + (item.carbs || 0),
      fat: (total.fat || 0) + (item.fat || 0),
      fiber: (total.fiber || 0) + (item.fiber || 0)
    }), {});
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
            <label className="text-sm font-medium mb-2 block">Recipe Name</label>
            <Input
              placeholder="e.g., My Custom Meal"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
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
                      <div className="font-medium">{item.food_name || item.label || item.name}</div>
                      <div className="text-gray-500">
                        {item.quantity} {item.serving_unit || item.units || 'serving'} | 
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
              <div className="text-sm font-medium mb-2">Total Recipe Macros:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: {Math.round(totalMacros.calories)}</div>
                <div>Protein: {Math.round(totalMacros.protein)}g</div>
                <div>Carbs: {Math.round(totalMacros.carbs)}g</div>
                <div>Fat: {Math.round(totalMacros.fat)}g</div>
                {totalMacros.fiber > 0 && <div>Fiber: {Math.round(totalMacros.fiber)}g</div>}
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