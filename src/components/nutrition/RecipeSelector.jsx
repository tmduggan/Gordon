import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChefHat, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function RecipeSelector({ recipes = [], onSelectRecipe, onDeleteRecipe }) {
  if (recipes.length === 0) {
    return (
      <Card className="p-6 text-center">
        <ChefHat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Recipes Yet</h3>
        <p className="text-gray-500">
          Create your first recipe to quickly log your favorite meals!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ChefHat className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-medium">Your Recipes</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recipes.map((recipe) => (
          <Card 
            key={recipe.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 relative group"
            onClick={() => onSelectRecipe(recipe)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium truncate">
                  {recipe.name}
                </CardTitle>
                {onDeleteRecipe && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecipe(recipe.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                {/* Macro Summary */}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-gray-600">
                    <span className="font-medium">{Math.round(recipe.totalMacros.calories)}</span> cal
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">{Math.round(recipe.totalMacros.protein)}g</span> protein
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">{Math.round(recipe.totalMacros.carbs)}g</span> carbs
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">{Math.round(recipe.totalMacros.fat)}g</span> fat
                  </div>
                </div>
                
                {/* Ingredients Preview */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs text-gray-500 truncate">
                        {recipe.items.slice(0, 3).map(item => item.name).join(', ')}
                        {recipe.items.length > 3 && ` +${recipe.items.length - 3} more`}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-sm">
                        <div className="font-medium mb-1">Ingredients:</div>
                        {recipe.items.map((item, index) => (
                          <div key={index} className="text-xs">
                            • {item.quantity} {item.unit} {item.name}
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Recipe Badge */}
                <Badge variant="outline" className="text-xs">
                  <ChefHat className="h-3 w-3 mr-1" />
                  Recipe
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 