import React, { useState, useCallback, useRef, useEffect } from 'react';
import MacroDisplay from '../nutrition/MacroDisplay';
import ServingSizeEditor from '../nutrition/ServingSizeEditor';
import { getFoodMacros } from '../../utils/dataUtils';

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
      <td className="text-center py-2 px-1">
        <button className="text-red-500 hover:text-red-700" onClick={() => removeFromCart(item.label, item.units)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </button>
      </td>
    </tr>
  );
} 