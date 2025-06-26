import React, { useState, useCallback, useRef, useEffect } from 'react';
import MacroDisplay from '../nutrition/MacroDisplay';
import ServingSizeEditor from '../nutrition/ServingSizeEditor';
import { getFoodMacros } from '../../utils/dataUtils';
import { Button } from '@/components/ui/button';
import { XCircle, Info, ChefHat } from 'lucide-react';
import ExerciseLogInputs from '../exercise/ExerciseLogInputs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import NutritionLabel from '../nutrition/NutritionLabel';
import { Badge } from '@/components/ui/badge';

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

export default function CartRow({ item, updateCartItem, removeFromCart, logData, onLogDataChange }) {
  // Check if the item is a food item by looking for a unique property like 'label'.
  const isFoodItem = 'label' in item;
  const isMobile = useIsMobile();

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
    if (!isMobile) return null;
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Info className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-auto max-w-sm p-0">
          {renderTooltipContent(item)}
        </DialogContent>
      </Dialog>
    );
  };

  if (isFoodItem) {
    const currentUnitRef = useRef(item.units);
    useEffect(() => {
      currentUnitRef.current = item.units;
    }, [item.units]);
    const handleServingChange = useCallback(({ quantity, units, scaledNutrition }) => {
      updateCartItem(item.id, { quantity, units, ...scaledNutrition });
    }, [updateCartItem, item.id]);
    return (
      <tr className="border-b align-top">
        <td colSpan="3" className="py-2 px-1">
          <div className="flex flex-col gap-1">
            <ServingSizeEditor food={item} onUpdate={handleServingChange} />
            <div className="flex items-center gap-1">
              <span className="font-semibold text-xs sm:text-sm">{item.label}</span>
              {item.isRecipeItem && (
                <Badge variant="outline" className="text-xs">
                  <ChefHat className="h-3 w-3 mr-1" />
                  {item.recipeName}
                </Badge>
              )}
              <InfoDialog item={item} isFood={true} />
            </div>
          </div>
        </td>
        <td className="p-2 text-center align-middle">
          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} title="Remove item">
            <XCircle className="h-5 w-5 text-red-500" />
          </Button>
        </td>
      </tr>
    );
  } else {
    // Render exercise item row
    const { name, id } = item;
    const itemLogData = logData && logData[id] ? logData[id] : {};
    const handleLogChange = (newValues) => {
      onLogDataChange(id, newValues);
    };
    return (
      <tr className="border-b align-top">
        <td colSpan="5" className="py-2 px-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{name}</span>
              <InfoDialog item={item} isFood={false} />
            </div>
            <ExerciseLogInputs
              exercise={item}
              logData={itemLogData}
              onLogDataChange={handleLogChange}
            />
          </div>
        </td>
        <td className="p-2 text-center align-middle">
          <Button variant="ghost" size="icon" onClick={() => removeFromCart(id)} title="Remove item">
            <XCircle className="h-5 w-5 text-red-500" />
          </Button>
        </td>
      </tr>
    );
  }
} 