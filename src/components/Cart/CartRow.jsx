import React, { useState, useCallback, useRef, useEffect } from 'react';
import MacroDisplay from '../nutrition/MacroDisplay';
import ServingSizeEditor from '../nutrition/ServingSizeEditor';
import { getFoodMacros } from '../../utils/dataUtils';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import ExerciseLogInputs from '../exercise/ExerciseLogInputs';

export default function CartRow({ item, updateCartItem, removeFromCart, logData, onLogDataChange }) {
  // Check if the item is a food item by looking for a unique property like 'label'.
  const isFoodItem = 'label' in item;

  if (isFoodItem) {
    const [scaledMacros, setScaledMacros] = useState(() => getFoodMacros(item));
    const currentUnitRef = useRef(item.units);

    useEffect(() => {
      currentUnitRef.current = item.units;
    }, [item.units]);

    const handleServingChange = useCallback(({ quantity, units, scaledNutrition }) => {
      updateCartItem(item.label, currentUnitRef.current, { quantity, units });
      setScaledMacros(scaledNutrition);
    }, [updateCartItem, item.label]);

    return (
      <tr className="border-b align-top">
        <td className="py-2 px-1 font-semibold">{item.label}</td>
        <td colSpan="2" className="py-2 px-1">
          <ServingSizeEditor food={item} onChange={handleServingChange} />
        </td>
        <MacroDisplay macros={scaledMacros} format="table-row-cells" />
        <td className="p-2 text-center align-middle">
          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.label, item.units)} title="Remove item">
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
        <td className="py-2 px-1 font-semibold">{name}</td>
        <td colSpan="4" className="py-2 px-1">
          <ExerciseLogInputs 
            exercise={item}
            logData={itemLogData} 
            onLogDataChange={handleLogChange}
          />
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