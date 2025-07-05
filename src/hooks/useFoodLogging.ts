import { useState } from 'react';
import { logFoodEntry } from '../firebase/firestore/logFoodEntry';
import { parseNutritionString } from '../services/nutrition/nutritionStringParser';
import useAuthStore from '../store/useAuthStore';
import { useToast } from './useToast';
import type { 
  Food, 
  CartItem,
  UserProfile,
  Recipe
} from '../types';

interface FoodLibrary {
  items: Food[];
  fetchAndSave: (food: Food) => Promise<string | null>;
}

interface Cart {
  cart: CartItem[];
  addToCart: (item: Food | Recipe, quantity?: number, units?: string) => void;
  clearCart: () => void;
}

interface Search {
  clearSearch?: () => void;
}

interface DateTimePicker {
  getLogTimestamp: () => Date;
}

interface ParsedFood extends Food {
  quantity: number;
  units: string;
}

interface RecipeIngredient {
  id: string;
  quantity: number;
  unit: string;
  isRecipe?: boolean;
}

interface RecipeItem extends Recipe {
  items: RecipeIngredient[];
  servings: number;
}

interface LoggedEntry {
  xp: number;
}

export default function useFoodLogging(
  foodLibrary: FoodLibrary,
  cart: Cart,
  search?: Search,
  dateTimePicker?: DateTimePicker
) {
  const { user, userProfile, addXP } = useAuthStore();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { toast } = useToast();

  const handleSelect = async (food: Food): Promise<void> => {
    let foodToLog = food;
    if ((food as any).isPreview) {
      const savedFood = await foodLibrary.fetchAndSave(food);
      if (savedFood) foodToLog = { ...food, id: savedFood };
    }
    if (
      (foodToLog as any).items &&
      Array.isArray((foodToLog as any).items) &&
      (foodToLog as any).servings
    ) {
      // Add as recipe
      cart.addToCart(foodToLog as RecipeItem, 1);
    } else {
      cart.addToCart(foodToLog);
    }
    if (search && search.clearSearch) {
      search.clearSearch();
    }
  };

  const handleNutrientsAdd = async (foodsOrString: ParsedFood[] | string): Promise<void> => {
    let foods: ParsedFood[] = foodsOrString as ParsedFood[];
    if (typeof foodsOrString === 'string') {
      foods = parseNutritionString(foodsOrString) as ParsedFood[];
    }
    console.log('[handleNutrientsAdd] Adding foods to cart:', foods.length);
    // Add all foods to cart with correct quantities and units
    foods.forEach((food) => {
      cart.addToCart(food, food.quantity, food.units);
    });
    // Show success toast
    if (foods.length === 1) {
      toast({
        title: 'Food Added',
        description: `Added ${foods[0].food_name || (foods[0] as any).label || (foods[0] as any).name} to your cart`,
      });
    } else {
      toast({
        title: 'Foods Added',
        description: `Added ${foods.length} foods to your cart`,
      });
    }
    if (search && search.clearSearch) {
      search.clearSearch();
    }
  };

  const logCart = async (): Promise<void> => {
    if (!dateTimePicker) return;
    
    const timestamp = dateTimePicker.getLogTimestamp();
    let totalXP = 0;

    for (const item of cart.cart) {
      if (
        item.type === 'recipe' &&
        (item as any).recipe &&
        (item as any).recipe.items &&
        (item as any).recipe.servings
      ) {
        // Expand recipe into ingredients per serving
        const recipe = (item as any).recipe as RecipeItem;
        const servingsToLog = (item as any).servings || 1;
        const recipeServings = recipe.servings || 1;
        for (const ingredient of recipe.items) {
          const scaledQuantity =
            (ingredient.quantity / recipeServings) * servingsToLog;

          // Check if this ingredient is itself a recipe
          if (ingredient.isRecipe) {
            const nestedRecipe = userProfile?.recipes?.find(
              (r) => r.id === ingredient.id
            ) as RecipeItem | undefined;
            if (nestedRecipe) {
              // Recursively log the nested recipe
              const nestedServingsToLog = scaledQuantity;
              const nestedRecipeServings = nestedRecipe.servings || 1;
              for (const nestedIngredient of nestedRecipe.items) {
                const nestedScaledQuantity =
                  (nestedIngredient.quantity / nestedRecipeServings) *
                  nestedServingsToLog;
                const food = foodLibrary.items.find(
                  (f) => f.id === nestedIngredient.id
                );
                if (!food) continue;
                try {
                  const loggedEntry = await logFoodEntry(
                    food,
                    user,
                    nestedScaledQuantity,
                    timestamp,
                    nestedIngredient.unit,
                    {
                      recipeId: recipe.id,
                      recipeName: recipe.name,
                      recipeServings: recipe.servings,
                      recipeLoggedServings: servingsToLog,
                      nestedRecipeId: nestedRecipe.id,
                      nestedRecipeName: nestedRecipe.name,
                    }
                  ) as LoggedEntry;
                  totalXP += loggedEntry.xp || 0;
                } catch (error) {
                  console.error(
                    'Error logging nested recipe ingredient:',
                    error,
                    nestedIngredient
                  );
                }
              }
            }
          } else {
            // Regular food ingredient
            const food = foodLibrary.items.find((f) => f.id === ingredient.id);
            if (!food) continue;
            try {
              const loggedEntry = await logFoodEntry(
                food,
                user,
                scaledQuantity,
                timestamp,
                ingredient.unit,
                {
                  recipeId: recipe.id,
                  recipeName: recipe.name,
                  recipeServings: recipe.servings,
                  recipeLoggedServings: servingsToLog,
                }
              ) as LoggedEntry;
              totalXP += loggedEntry.xp || 0;
            } catch (error) {
              console.error(
                'Error logging recipe ingredient:',
                error,
                ingredient
              );
            }
          }
        }
      } else {
        // Regular food item
        let food: Food | null = null;
        if ((item as any).originalFoodId) {
          food = foodLibrary.items.find((f) => f.id === (item as any).originalFoodId);
        }
        if (!food) {
          food = foodLibrary.items.find((f) => f.id === item.id);
        }
        if (!food) {
          const newFoodId = await foodLibrary.fetchAndSave(item as Food);
          if (newFoodId) food = { ...item as Food, id: newFoodId };
          else {
            console.warn('Could not save new food for cart item:', item);
            continue;
          }
        }
        try {
          const loggedEntry = await logFoodEntry(
            food,
            user,
            (item as any).quantity,
            timestamp,
            (item as any).units
          ) as LoggedEntry;
          totalXP += loggedEntry.xp || 0;
        } catch (error) {
          console.error('Error adding food log from cart:', error, item);
        }
      }
    }

    // Add total XP to user's profile
    if (totalXP > 0) {
      await addXP(totalXP);
    }

    cart.clearCart();
  };

  return {
    handleSelect,
    handleNutrientsAdd,
    logCart,
    showAllHistory,
    setShowAllHistory,
  };
} 