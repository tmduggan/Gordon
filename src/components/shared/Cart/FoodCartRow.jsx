import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChefHat, Info, XCircle } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useLibrary from '../../../hooks/useLibrary';
import useAuthStore from '../../../store/useAuthStore';
import { convertToGrams, getFoodMacros } from '../../../utils/dataUtils';
import MacroDisplay from '../../nutrition/MacroDisplay';
import NutritionLabel from '../../nutrition/NutritionLabel';
import ServingSizeEditor from '../../nutrition/ServingSizeEditor';

export default function FoodCartRow({
  item,
  updateCartItem = () => {},
  removeFromCart = () => {},
  userWorkoutHistory,
}) {
  // Check if the item is a food item by looking for a unique property like 'label'.
  const isFoodItem = 'label' in item;
  const isRecipe = item.type === 'recipe';
  const { userProfile } = useAuthStore();
  const foodLibrary = useLibrary('food');

  const InfoDialog = ({ item }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Info className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-auto max-w-sm p-0">
        <NutritionLabel food={item} />
      </DialogContent>
    </Dialog>
  );

  const getFoodCalories = (food) => {
    const macros = getFoodMacros(food);
    const quantity = food.quantity || 1;
    const units = food.units || food.serving_unit || 'g';
    const grams = convertToGrams(food, quantity, units);
    let caloriesPerGram = 0;
    if (food.serving_weight_grams) {
      const data = food.nutritionix_data || food.nutrition || food;
      caloriesPerGram =
        (data.nf_calories || data.calories || 0) / food.serving_weight_grams;
    } else {
      caloriesPerGram = macros.calories;
    }
    return Math.round(caloriesPerGram * grams);
  };

  const getRecipeCalories = (recipe, servings = 1) => {
    if (!recipe || !recipe.items) return 0;
    const recipeServings = recipe.servings || 1;
    let total = 0;
    recipe.items.forEach((ingredient) => {
      if (ingredient.isRecipe) {
        const nestedRecipe = userProfile?.recipes?.find(
          (r) => r.id === ingredient.id
        );
        if (nestedRecipe) {
          const nestedCals = getRecipeCalories(
            nestedRecipe,
            (ingredient.quantity / recipeServings) * servings
          );
          total += nestedCals;
        }
      } else {
        const food = foodLibrary.items.find((f) => f.id === ingredient.id);
        if (food) {
          total += getFoodCalories({
            ...food,
            quantity: (ingredient.quantity / recipeServings) * servings,
          });
        }
      }
    });
    return Math.round(total);
  };

  if (isRecipe) {
    // Always default to 1 serving (per serving) unless user changes it
    const servings = item.servings || 1;
    const recipe =
      item.recipe || userProfile?.recipes?.find((r) => r.id === item.id);
    // If user hasn't changed servings, show per-serving nutrition
    const calories = recipe ? getRecipeCalories(recipe, servings) : 0;
    return (
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            {/* First row: servings input */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={servings}
                onChange={(e) =>
                  updateCartItem(item.id, {
                    servings: parseFloat(e.target.value) || 1,
                  })
                }
                className="w-20"
              />
              <span className="text-sm text-gray-500">servings</span>
            </div>
            {/* Second row: name left, calories right */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm flex items-center gap-1">
                <ChefHat className="h-4 w-4 text-orange-500" />
                {item.name}
              </span>
              <span className="text-sm font-mono text-gray-700">
                Cal: {calories}
              </span>
            </div>
            {/* Remove button row */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromCart(item.id)}
                title="Remove recipe"
                className="h-8 w-8"
              >
                <XCircle className="h-5 w-5 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } else if (isFoodItem) {
    const currentUnitRef = useRef(item.units);
    useEffect(() => {
      currentUnitRef.current = item.units;
    }, [item.units]);
    const handleServingChange = useCallback(
      ({ quantity, units }) => {
        updateCartItem(item.id, { quantity, units });
      },
      [updateCartItem, item.id]
    );
    const calories = getFoodCalories(item);
    return (
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            {/* Serving Size Editor */}
            <ServingSizeEditor food={item} onUpdate={handleServingChange} />
            {/* Food Info Row: name left, calories right */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{item.label}</span>
                {item.isRecipeItem && (
                  <Badge variant="outline" className="text-xs">
                    <ChefHat className="h-3 w-3 mr-1" />
                    {item.recipeName}
                  </Badge>
                )}
                <InfoDialog item={item} />
              </div>
              <span className="text-sm font-mono text-gray-700">
                Cal: {calories}
              </span>
            </div>
            {/* Remove Button Row */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromCart(item.id)}
                title="Remove item"
                className="h-8 w-8"
              >
                <XCircle className="h-5 w-5 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    // Defensive: if not a food or recipe, render nothing
    return null;
  }
}
