import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, ChefHat } from 'lucide-react';
import Search from '../shared/Search/Search';
import useLibrary from '../../hooks/useLibrary';
import useSearch from '../../hooks/useSearch';
import { getFoodMacros } from '../../utils/dataUtils';

export default function RecipeCreator({ onRecipeCreated, userProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeItems, setRecipeItems] = useState([]);
  const [currentFood, setCurrentFood] = useState(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  
  const foodLibrary = useLibrary('food');
  const search = useSearch('food', foodLibrary, userProfile);

  const handleAddFood = () => {
    if (currentFood && currentQuantity > 0) {
      const newItem = {
        id: currentFood.id || currentFood.food_name,
        name: currentFood.food_name || currentFood.name,
        quantity: currentQuantity,
        unit: currentFood.serving_unit || 'serving',
        macros: getFoodMacros(currentFood)
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
    if (recipeName.trim() && recipeItems.length > 0) {
      const recipe = {
        id: `recipe_${Date.now()}`,
        name: recipeName.trim(),
        items: recipeItems,
        createdAt: new Date().toISOString(),
        totalMacros: recipeItems.reduce((total, item) => {
          const macros = item.macros;
          return {
            calories: (total.calories || 0) + (macros.calories || 0),
            protein: (total.protein || 0) + (macros.protein || 0),
            carbs: (total.carbs || 0) + (macros.carbs || 0),
            fat: (total.fat || 0) + (macros.fat || 0),
            fiber: (total.fiber || 0) + (macros.fiber || 0)
          };
        }, {})
      };
      
      onRecipeCreated(recipe);
      setIsOpen(false);
      setRecipeName('');
      setRecipeItems([]);
    }
  };

  const handleFoodSelect = (food) => {
    setCurrentFood(food);
  };

  const calculateTotalMacros = () => {
    return recipeItems.reduce((total, item) => {
      const macros = item.macros;
      return {
        calories: (total.calories || 0) + (macros.calories || 0),
        protein: (total.protein || 0) + (macros.protein || 0),
        carbs: (total.carbs || 0) + (macros.carbs || 0),
        fat: (total.fat || 0) + (macros.fat || 0),
        fiber: (total.fiber || 0) + (macros.fiber || 0)
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
            <label className="text-sm font-medium mb-2 block">Recipe Name</label>
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
            <Search
              type="food"
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
              filters={search.filters}
              setFilters={search.setFilters}
            />

            {/* Current Food Selection */}
            {currentFood && (
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{currentFood.food_name || currentFood.name}</div>
                    <div className="text-sm text-gray-500">
                      {getFoodMacros(currentFood).calories} cal | 
                      P: {getFoodMacros(currentFood).protein}g | 
                      C: {getFoodMacros(currentFood).carbs}g | 
                      F: {getFoodMacros(currentFood).fat}g
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={currentQuantity}
                      onChange={(e) => setCurrentQuantity(parseFloat(e.target.value) || 0)}
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
                <label className="text-sm font-medium">Recipe Ingredients</label>
                {recipeItems.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.quantity} {item.unit} | 
                          {item.macros.calories} cal | 
                          P: {item.macros.protein}g | 
                          C: {item.macros.carbs}g | 
                          F: {item.macros.fat}g
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
                <div className="text-sm font-medium mb-2">Total Recipe Macros:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: {Math.round(totalMacros.calories)}</div>
                  <div>Protein: {Math.round(totalMacros.protein)}g</div>
                  <div>Carbs: {Math.round(totalMacros.carbs)}g</div>
                  <div>Fat: {Math.round(totalMacros.fat)}g</div>
                  {totalMacros.fiber && <div>Fiber: {Math.round(totalMacros.fiber)}g</div>}
                </div>
              </Card>
            )}
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