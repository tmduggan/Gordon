import React, { useState, useCallback, useRef, useEffect } from 'react';
import MacroDisplay from '../nutrition/MacroDisplay';
import ServingSizeEditor from '../nutrition/ServingSizeEditor';
import { getFoodMacros } from '../../utils/dataUtils';
import { Button } from '@/components/ui/button';
import { XCircle, Info } from 'lucide-react';
import ExerciseLogInputs from '../exercise/ExerciseLogInputs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import NutritionLabel from '../nutrition/NutritionLabel';
import ExerciseInfoCard from '../exercise/ExerciseInfoCard';

export default function CartRow({ item, updateCartItem, removeFromCart, logData, onLogDataChange }) {
  // Check if the item is a food item by looking for a unique property like 'label'.
  const isFoodItem = 'label' in item;

  const InfoDialog = ({ item, isFood }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Info className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-auto max-w-sm p-0">
        {isFood ? <NutritionLabel food={item} /> : <ExerciseInfoCard exercise={item} />}
      </DialogContent>
    </Dialog>
  );

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