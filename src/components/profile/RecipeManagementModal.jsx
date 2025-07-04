import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Edit, Trash2, Save, X, Plus } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import useAuthStore from '../../store/useAuthStore';
import useLibrary from '../../hooks/useLibrary';
import { getFoodMacros } from '../../utils/dataUtils';
import FoodCartRow from '../shared/Cart/FoodCartRow';
import { isValidFoodItem } from '../../utils/isValidFoodItem';

export default function RecipeManagementModal({ open, onOpenChange }) {
  const { userProfile, updateRecipe, deleteRecipe } = useAuthStore();
  const { toast } = useToast();
  const foodLibrary = useLibrary('food');
  
  const [recipes, setRecipes] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editName, setEditName] = useState('');
  const [editServings, setEditServings] = useState(1);

  // Load recipes with calculated macros
  useEffect(() => {
    if (userProfile?.recipes) {
      const recipesWithMacros = userProfile.recipes.map(recipe => {
        const calculateRecipeMacros = (recipeItems) => {
          return recipeItems.reduce((total, item) => {
            if (item.isRecipe) {
              // Handle nested recipe
              const nestedRecipe = userProfile.recipes.find(r => r.id === item.id);
              if (nestedRecipe) {
                const nestedMacros = calculateRecipeMacros(nestedRecipe.items);
                const scaledQty = item.quantity / (recipe.servings || 1);
                return {
                  calories: total.calories + (nestedMacros.calories * scaledQty),
                  protein: total.protein + (nestedMacros.protein * scaledQty),
                  carbs: total.carbs + (nestedMacros.carbs * scaledQty),
                  fat: total.fat + (nestedMacros.fat * scaledQty),
                  fiber: total.fiber + (nestedMacros.fiber * scaledQty)
                };
              }
            } else {
              // Regular food ingredient
              const food = foodLibrary.items.find(f => f.id === item.id);
              if (!food) return total;
              
              const macros = getFoodMacros(food);
              const scaledQty = item.quantity / (recipe.servings || 1);
              
              return {
                calories: total.calories + (macros.calories * scaledQty),
                protein: total.protein + (macros.protein * scaledQty),
                carbs: total.carbs + (macros.carbs * scaledQty),
                fat: total.fat + (macros.fat * scaledQty),
                fiber: total.fiber + (macros.fiber * scaledQty)
              };
            }
            return total;
          }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
        };

        const totalMacros = calculateRecipeMacros(recipe.items);

        return {
          ...recipe,
          totalMacros,
          items: recipe.items.map(item => ({
            ...item,
            name: item.isRecipe 
              ? userProfile.recipes.find(r => r.id === item.id)?.name || item.id
              : foodLibrary.items.find(f => f.id === item.id)?.food_name || item.id
          }))
        };
      });
      setRecipes(recipesWithMacros);
    }
  }, [userProfile?.recipes, foodLibrary.items]);

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setEditName(recipe.name);
    setEditServings(recipe.servings || 1);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Recipe name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedRecipe = {
        ...editingRecipe,
        name: editName.trim(),
        servings: editServings
      };
      
      await updateRecipe(updatedRecipe);
      setEditingRecipe(null);
      setEditName('');
      setEditServings(1);
      
      toast({
        title: "Recipe Updated",
        description: `Recipe "${editName}" has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update recipe.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecipe = async (recipe) => {
    if (window.confirm(`Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`)) {
      try {
        await deleteRecipe(recipe.id);
        toast({
          title: "Recipe Deleted",
          description: `Recipe "${recipe.name}" has been deleted.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete recipe.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingRecipe(null);
    setEditName('');
    setEditServings(1);
  };

  if (recipes.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Recipe Management
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <ChefHat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recipes Yet</h3>
            <p className="text-gray-500">
              Create your first recipe to start managing your custom meals!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Recipe Management ({recipes.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingRecipe?.id === recipe.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Recipe name"
                          className="font-medium"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Servings:</span>
                          <Input
                            type="number"
                            min="1"
                            value={editServings}
                            onChange={(e) => setEditServings(parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </div>
                      </div>
                    ) : (
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <ChefHat className="h-3 w-3 mr-1" />
                        {recipe.servings || 1} serving{recipe.servings !== 1 ? 's' : ''}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Created {new Date(recipe.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {editingRecipe?.id === recipe.id ? (
                      <>
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditRecipe(recipe)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteRecipe(recipe)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  {/* Render each ingredient using FoodCartRow for consistent display */}
                  {recipe.items
                    .filter(ingredient => isValidFoodItem(ingredient, foodLibrary))
                    .map((ingredient, idx) => (
                      <FoodCartRow
                        key={ingredient.id || idx}
                        item={ingredient}
                        updateCartItem={undefined}
                        removeFromCart={undefined}
                        logData={undefined}
                        onLogDataChange={undefined}
                        userWorkoutHistory={undefined}
                      />
                    ))}
                </div>
                {/* Optionally, display total macros here */}
                <div className="mt-2 text-xs text-gray-600">
                  Total: {Math.round(recipe.totalMacros.calories)} cal, {Math.round(recipe.totalMacros.protein)}g protein, {Math.round(recipe.totalMacros.carbs)}g carbs, {Math.round(recipe.totalMacros.fat)}g fat
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 