import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChefHat, Plus, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import useCart from '../../hooks/useCart';
import useFoodSearch from '../../hooks/useFoodSearch';
import useLibrary from '../../hooks/useLibrary';
import { getFoodMacros } from '../../utils/dataUtils';
import FoodSearch from '../shared/Search/FoodSearch';

export default function RecipeCreator({ onRecipeCreated, userProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeItems, setRecipeItems] = useState([]);
  const [currentFood, setCurrentFood] = useState(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [servings, setServings] = useState(1);

  const foodLibrary = useLibrary('food');
  const search = useFoodSearch(foodLibrary, userProfile);
  const foodCart = useCart('food');

  const handleAddFood = () => {
    if (currentFood && currentQuantity > 0) {
      const newItem = {
        id: currentFood.id || currentFood.food_name,
        name: currentFood.food_name || currentFood.name,
        quantity: currentQuantity,
        unit: currentFood.serving_unit || 'serving',
        macros: getFoodMacros(currentFood),
        isRecipe: currentFood.isRecipe || false,
      };

      setRecipeItems([...recipeItems, newItem]);
      setCurrentFood(null);
      setCurrentQuantity(1);
      search.setSearchQuery('');
    }
  };

  const handleRemoveFood = (index) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = () => {
    if (recipeName.trim() && recipeItems.length > 0 && servings > 0) {
      const recipe = {
        id: `recipe_${Date.now()}`,
        name: recipeName.trim(),
        createdAt: new Date().toISOString(),
        servings: servings,
        items: recipeItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unit: item.unit,
          isRecipe: item.isRecipe || false,
        })),
      };
      onRecipeCreated(recipe);
      setIsOpen(false);
      setRecipeName('');
      setRecipeItems([]);
      setServings(1);
      foodCart.clearCart();
      foodCart.addToCart(recipe, 1);
    }
  };

  const handleFoodSelect = (food) => {
    setCurrentFood(food);
  };

  const calculateTotalMacros = () => {
    return recipeItems.reduce((total, item) => {
      let macros = item.macros;

      // If this is a recipe ingredient, calculate its macros based on the recipe
      if (item.isRecipe) {
        const recipe = userProfile?.recipes?.find((r) => r.id === item.id);
        if (recipe) {
          const recipeMacros = recipe.items.reduce(
            (recipeTotal, ingredient) => {
              const food = foodLibrary.items.find(
                (f) => f.id === ingredient.id
              );
              if (!food) return recipeTotal;

              const foodMacros = getFoodMacros(food);
              const scaledQty =
                (ingredient.quantity / (recipe.servings || 1)) * item.quantity;

              return {
                calories:
                  recipeTotal.calories + foodMacros.calories * scaledQty,
                protein: recipeTotal.protein + foodMacros.protein * scaledQty,
                carbs: recipeTotal.carbs + foodMacros.carbs * scaledQty,
                fat: recipeTotal.fat + foodMacros.fat * scaledQty,
                fiber: recipeTotal.fiber + foodMacros.fiber * scaledQty,
              };
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
          );

          macros = recipeMacros;
        }
      }

      return {
        calories: (total.calories || 0) + (macros.calories || 0),
        protein: (total.protein || 0) + (macros.protein || 0),
        carbs: (total.carbs || 0) + (macros.carbs || 0),
        fat: (total.fat || 0) + (macros.fat || 0),
        fiber: (total.fiber || 0) + (macros.fiber || 0),
      };
    }, {});
  };

  const totalMacros = calculateTotalMacros();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <ChefHat className="h-4 w-4 mr-2" />
          Create Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Recipe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Recipe Name
            </label>
            <Input
              placeholder="e.g., Chicken and Rice Bowl"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />
          </div>

          {/* Add Food Items */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Add Ingredients</label>

            {/* Food Search */}
            <FoodSearch
              searchQuery={search.searchQuery}
              setSearchQuery={search.setSearchQuery}
              searchResults={search.searchResults}
              handleApiSearch={search.handleApiSearch}
              handleSelect={handleFoodSelect}
              isLoading={search.searchLoading}
              userProfile={userProfile}
              togglePin={() => {}}
              getFoodMacros={getFoodMacros}
              placeholder="Search for foods to add..."
            />

            {/* Current Food Selection */}
            {currentFood && (
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {currentFood.food_name || currentFood.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getFoodMacros(currentFood).calories} cal | P:{' '}
                      {getFoodMacros(currentFood).protein}g | C:{' '}
                      {getFoodMacros(currentFood).carbs}g | F:{' '}
                      {getFoodMacros(currentFood).fat}g
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={currentQuantity}
                      onChange={(e) =>
                        setCurrentQuantity(parseFloat(e.target.value) || 0)
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">
                      {currentFood.serving_unit || 'serving'}
                    </span>
                    <Button size="sm" onClick={handleAddFood}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Recipe Items List */}
            {recipeItems.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Recipe Ingredients
                </label>
                {recipeItems.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.quantity} {item.unit} |{item.macros.calories}{' '}
                          cal | P: {item.macros.protein}g | C:{' '}
                          {item.macros.carbs}g | F: {item.macros.fat}g
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFood(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Total Macros */}
            {recipeItems.length > 0 && (
              <Card className="p-3 bg-gray-50">
                <div className="text-sm font-medium mb-2">
                  Total Recipe Macros:
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: {Math.round(totalMacros.calories)}</div>
                  <div>Protein: {Math.round(totalMacros.protein)}g</div>
                  <div>Carbs: {Math.round(totalMacros.carbs)}g</div>
                  <div>Fat: {Math.round(totalMacros.fat)}g</div>
                  {totalMacros.fiber && (
                    <div>Fiber: {Math.round(totalMacros.fiber)}g</div>
                  )}
                </div>
              </Card>
            )}
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

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRecipe}
              disabled={!recipeName.trim() || recipeItems.length === 0}
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
