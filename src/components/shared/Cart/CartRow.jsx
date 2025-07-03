import React, { useState, useCallback, useRef, useEffect } from 'react';
import MacroDisplay from '../../nutrition/MacroDisplay';
import ServingSizeEditor from '../../nutrition/ServingSizeEditor';
import { getFoodMacros } from '../../../utils/dataUtils';
import { Button } from '@/components/ui/button';
import { XCircle, Info, ChefHat, MoreVertical } from 'lucide-react';
import ExerciseLogInputs from '../../exercise/ExerciseLogInputs';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NutritionLabel from '../../nutrition/NutritionLabel';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { ExerciseTooltipContent } from '../../exercise/ExerciseTooltip';
import { Input } from '@/components/ui/input';

// Mobile detection (same as WorkoutSuggestions)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

// Tooltip content (same as WorkoutSuggestions)
function renderTooltipContent(exercise) {
  return (
    <div className="max-w-xs">
      <div className="font-semibold text-base mb-2">
        {exercise.name}
      </div>
      {exercise.description && (
        <div className="mb-3">
          <div className="font-medium text-sm mb-1 text-blue-600">Description:</div>
          <p className="text-sm text-gray-700 leading-relaxed">{exercise.description}</p>
        </div>
      )}
      {exercise.instructions && Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
        <div className="mb-3">
          <div className="font-medium text-sm mb-1 text-green-600">Instructions:</div>
          <ol className="text-sm text-gray-700 space-y-1">
            {exercise.instructions.map((instruction, index) => (
              <li key={index} className="leading-relaxed">
                {index + 1}. {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2">
        <span>Target: {exercise.target}</span>
        {exercise.equipment && <span>Equipment: {exercise.equipment}</span>}
        {exercise.category && <span>Type: {exercise.category}</span>}
      </div>
    </div>
  );
}

export default function CartRow({ item, updateCartItem, removeFromCart, logData, onLogDataChange, userWorkoutHistory }) {
  // Check if the item is a food item by looking for a unique property like 'label'.
  const isFoodItem = 'label' in item;
  const isMobile = useIsMobile();
  const [showConfirm, setShowConfirm] = useState(false);
  const isRecipe = item.type === 'recipe';

  const InfoDialog = ({ item, isFood }) => {
    if (isFood) {
      return (
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
    }
    // Only show on mobile for exercises
    if (!isFood && isMobile) {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-auto max-w-sm p-0">
            <ExerciseTooltipContent exercise={item} />
          </DialogContent>
        </Dialog>
      );
    }
    return null;
  };

  // Remove exercise with confirmation
  const handleRemoveExercise = () => {
    setShowConfirm(false);
    removeFromCart(item.id);
  };

  if (isRecipe) {
    // Render recipe row: show name and servings input only
    return (
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{item.name}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.servings}
                  onChange={e => updateCartItem(item.id, { servings: parseFloat(e.target.value) || 1 })}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">servings</span>
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
          </div>
        </CardContent>
      </Card>
    );
  } else if (isFoodItem) {
    const currentUnitRef = useRef(item.units);
    useEffect(() => {
      currentUnitRef.current = item.units;
    }, [item.units]);
    const handleServingChange = useCallback(({ quantity, units, scaledNutrition }) => {
      updateCartItem(item.id, { quantity, units, ...scaledNutrition });
    }, [updateCartItem, item.id]);
    
    return (
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Serving Size Editor */}
            <ServingSizeEditor food={item} onUpdate={handleServingChange} />
            
            {/* Food Info Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{item.label}</span>
                {item.isRecipeItem && (
                  <Badge variant="outline" className="text-xs">
                    <ChefHat className="h-3 w-3 mr-1" />
                    {item.recipeName}
                  </Badge>
                )}
                <InfoDialog item={item} isFood={true} />
              </div>
              
              {/* Remove Button */}
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
    // Render exercise item
    const { name, id } = item;
    const itemLogData = logData && logData[id] ? logData[id] : {};
    const handleLogChange = (id, newValues) => {
      onLogDataChange(id, newValues);
    };
    
    // Find last set for this exercise from userWorkoutHistory
    let lastSetPlaceholder = null;
    if (Array.isArray(userWorkoutHistory)) {
      const lastLog = userWorkoutHistory.find(log => log.exerciseId === id && Array.isArray(log.sets) && log.sets.length > 0);
      if (lastLog) {
        const lastSet = lastLog.sets[lastLog.sets.length - 1];
        if (lastSet) {
          lastSetPlaceholder = { weight: lastSet.weight, reps: lastSet.reps };
        }
      }
    }
    
    return (
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Exercise Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{name}</span>
                <InfoDialog item={item} isFood={false} />
              </div>
              
              {/* Exercise Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowConfirm(true)} className="text-red-600">
                    Remove Exercise
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Exercise Log Inputs */}
            <ExerciseLogInputs
              exercise={item}
              logData={itemLogData}
              onLogDataChange={handleLogChange}
              lastSetPlaceholder={lastSetPlaceholder}
            />
          </div>
        </CardContent>
        
        {/* Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Exercise?</DialogTitle>
            </DialogHeader>
            <div className="mb-4">Are you sure you want to remove this exercise and all its sets from your cart?</div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRemoveExercise}>Remove</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }
} 