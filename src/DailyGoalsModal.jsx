import React, { useState } from 'react';

const defaultMacros = { carbs: 40, fat: 25, protein: 35 };
const macroEmojis = { carbs: '🍞', fat: '🥑', protein: '🍗', fiber: '🌱' };

function calculateFiber(calories) {
  // 14g per 1000 kcal is a common guideline
  return Math.round((calories / 1000) * 14);
}

function calculateGrams(calories, macros) {
  // macros: {carbs, fat, protein} in %
  return {
    carbs: Math.round((calories * macros.carbs / 100) / 4),
    fat: Math.round((calories * macros.fat / 100) / 9),
    protein: Math.round((calories * macros.protein / 100) / 4),
  };
}

export default function DailyGoalsModal({ onClose, initialGoals = { calories: 2300, ...defaultMacros }, onSave }) {
  // If initialGoals has grams, convert to % for modal display
  const [calories, setCalories] = useState(initialGoals.calories);
  const [macros, setMacros] = useState(() => {
    if (initialGoals.carbs <= 100 && initialGoals.fat <= 100 && initialGoals.protein <= 100) {
      // Looks like percentages
      return {
        carbs: initialGoals.carbs,
        fat: initialGoals.fat,
        protein: initialGoals.protein,
      };
    } else {
      // Convert grams to % for modal
      return {
        carbs: Math.round((initialGoals.carbs * 4 / initialGoals.calories) * 100),
        fat: Math.round((initialGoals.fat * 9 / initialGoals.calories) * 100),
        protein: Math.round((initialGoals.protein * 4 / initialGoals.calories) * 100),
      };
    }
  });

  const totalPercent = macros.carbs + macros.fat + macros.protein;
  const fiber = calculateFiber(calories);
  const grams = calculateGrams(calories, macros);

  const handleMacroChange = (macro, value) => {
    let v = parseInt(value, 10);
    if (isNaN(v)) v = 0;
    setMacros({ ...macros, [macro]: v });
  };

  const handleArrow = (macro, delta) => {
    setMacros(m => ({ ...m, [macro]: Math.max(0, m[macro] + delta) }));
  };

  const handleSave = () => {
    if (totalPercent !== 100) {
      alert('Macros must add up to 100%.');
      return;
    }
    onSave && onSave({
      calories,
      carbs: grams.carbs,
      fat: grams.fat,
      protein: grams.protein,
      fiber,
      macroPercents: { ...macros },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Daily Goals</h2>
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium mb-1 text-center">Calories</label>
            <div className="flex items-center justify-center">
              <input
                type="number"
                className="w-20 border rounded px-2 py-1 text-center text-lg"
                value={calories}
                min={0}
                max={9999}
                onChange={e => setCalories(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-center">Macros (%)</label>
            <div className="grid grid-cols-3 gap-2">
              {['carbs', 'fat', 'protein'].map(macro => (
                <div key={macro} className="flex flex-col items-center">
                  <span className="capitalize mb-1">{macroEmojis[macro]} {macro}</span>
                  <div className="flex items-center gap-1">
                    <button
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => handleArrow(macro, -1)}
                      type="button"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="w-12 border rounded text-center"
                      value={macros[macro]}
                      min={0}
                      max={100}
                      onChange={e => handleMacroChange(macro, e.target.value)}
                    />
                    <button
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => handleArrow(macro, 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{grams[macro]}g</div>
                </div>
              ))}
            </div>
            <div className={`text-xs text-center mt-1 font-semibold ${totalPercent === 100 ? 'text-green-600' : 'text-red-600'}`}>Total: {totalPercent}%</div>
          </div>
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium mb-1 text-center">{macroEmojis.fiber} Recommended Fiber</label>
            <div className="w-24 border rounded px-2 py-1 bg-gray-100 text-gray-700 text-center mx-auto">{fiber} g</div>
            <div className="text-xs text-gray-500 mt-1 text-center">(Based on 14g per 1000 kcal)</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 