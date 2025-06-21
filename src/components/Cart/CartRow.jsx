import React, { useState, useCallback, useRef, useEffect } from 'react';
import MacroDisplay from '../nutrition/MacroDisplay';
import ServingSizeEditor from '../nutrition/ServingSizeEditor';
import { getFoodMacros } from '../../utils/dataUtils';
import RemoveFromCartButton from './RemoveFromCartButton';

export default function CartRow({ item, updateCartItem, removeFromCart }) {
  // The macros displayed in the row will now be based on the editor's state.
  const [scaledMacros, setScaledMacros] = useState(() => getFoodMacros(item));

  // Use a ref to track the "current" unit for the update operation.
  // This makes the callback below stable, preventing re-renders.
  const currentUnitRef = useRef(item.units);
  useEffect(() => {
    currentUnitRef.current = item.units;
  }, [item.units]);

  // When the serving size or quantity changes, update the cart state.
  const handleServingChange = useCallback(({ quantity, units, scaledNutrition }) => {
    // Use the ref's value to identify the item to prevent dependency changes.
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
        <RemoveFromCartButton onClick={() => removeFromCart(item.label, item.units)} />
      </td>
    </tr>
  );
} 