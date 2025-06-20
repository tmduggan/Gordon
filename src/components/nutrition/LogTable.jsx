import React from 'react';
import { getFoodMacros } from '../../utils/dataUtils';
import MacroDisplay from './MacroDisplay';

export default function LogTable({ logsByDate, getFoodById, updateLog, deleteLog }) {
    if (Object.keys(logsByDate).every(k => logsByDate[k].length === 0)) {
        return (
            <div className="text-center py-4 text-gray-500">
                No foods logged for today.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="text-left py-2 px-1 font-semibold">Food</th>
                        <th className="text-left py-2 px-1 font-semibold">Qty</th>
                        <th className="text-left py-2 px-1 font-semibold">Unit</th>
                        <th className="text-right py-2 px-1 font-semibold">🔥</th>
                        <th className="text-right py-2 px-1 font-semibold">🥑</th>
                        <th className="text-right py-2 px-1 font-semibold">🍞</th>
                        <th className="text-right py-2 px-1 font-semibold">🍗</th>
                        <th className="text-right py-2 px-1 font-semibold">🌱</th>
                        <th className="py-2 px-1"></th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(logsByDate).map(([segment, logs]) => (
                        <React.Fragment key={segment}>
                            {logs.length > 0 && (
                                <tr>
                                    <td colSpan="9" className="py-2 px-1 font-bold bg-gray-50 text-gray-700">{segment}</td>
                                </tr>
                            )}
                            {logs.map(log => {
                                const food = getFoodById(log.foodId);
                                if (!food) return null; // Handle case where food might be deleted
                                const macros = getFoodMacros(food);
                                const displayMacros = {
                                    calories: Math.round(macros.calories * log.serving),
                                    fat: Math.round(macros.fat * log.serving),
                                    carbs: Math.round(macros.carbs * log.serving),
                                    protein: Math.round(macros.protein * log.serving),
                                    fiber: Math.round(macros.fiber * log.serving),
                                };

                                return (
                                    <tr key={log.id} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-1">{food.label}</td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="number"
                                                className="w-16 border rounded px-1"
                                                value={log.serving}
                                                onChange={(e) => updateLog(log.id, 'serving', parseFloat(e.target.value) || 0)}
                                                step="0.1"
                                            />
                                        </td>
                                        <td className="py-2 px-1">{log.units}</td>
                                        <MacroDisplay macros={displayMacros} format="table-row-cells" />
                                        <td className="text-center py-2 px-1">
                                            <button className="text-red-500 hover:text-red-700" onClick={() => deleteLog(log.id)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 