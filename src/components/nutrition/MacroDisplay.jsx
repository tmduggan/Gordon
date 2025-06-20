import React from 'react';

/**
 * A centralized component for displaying macronutrient information
 * in various formats throughout the application.
 * @param {object} macros - An object with calorie, fat, carb, protein, and fiber values.
 * @param {string} format - Controls the display style ('inline-text', 'stacked', 'table-row-cells').
 * @param {React.ReactNode} children - Optional content, like a food name, to display with the macros.
 */
const MacroDisplay = ({ macros, format = 'inline-text', children }) => {
  if (!macros) return null;

  const { calories, fat, carbs, protein, fiber } = macros;

  switch (format) {
    case 'inline-text':
      return (
        <div className="flex justify-between items-center w-full">
          <span>{children}</span>
          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
            <span title="Calories" className="mr-2">🔥{calories}</span>
            <span title="Fat" className="mr-2">🥑{fat}g</span>
            <span title="Carbs" className="mr-2">🍞{carbs}g</span>
            <span title="Protein">🍗{protein}g</span>
          </span>
        </div>
      );
    
    case 'stacked':
      return (
        <div>
          <strong className="block">{children}</strong>
          <span className="text-xs text-gray-600">
            <span title="Calories" className="mr-2">🔥{calories}</span>
            <span title="Fat" className="mr-2">🥑{fat}g</span>
            <span title="Carbs" className="mr-2">🍞{carbs}g</span>
            <span title="Protein">🍗{protein}g</span>
          </span>
        </div>
      );

    case 'table-row-cells':
      return (
        <>
          <td className="text-right py-2 px-1">{calories}</td>
          <td className="text-right py-2 px-1">{fat}</td>
          <td className="text-right py-2 px-1">{carbs}</td>
          <td className="text-right py-2 px-1">{protein}</td>
          <td className="text-right py-2 px-1">{fiber}</td>
        </>
      );
    
    default:
      return null;
  }
};

export default MacroDisplay; 