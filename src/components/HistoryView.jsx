import React from 'react';
import MacroDisplay from './nutrition/MacroDisplay';
import { getFoodMacros } from '../utils/dataUtils';
import { getTimeSegment } from '../utils/timeUtils';
import ScoreDisplay from './ScoreDisplay';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Helper for rendering progress bars in the food summary
const renderFoodProgressBar = (label, value, goal) => {
    const percentage = goal > 0 ? (value / goal) * 100 : 0;
    const isOver = percentage > 100;

    return (
        <div className="text-sm">
            <div className="flex justify-between mb-1">
                <span className="font-medium capitalize">{label}</span>
                <span>{value.toFixed(0)} / {goal}g</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full ${isOver ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

// Helper to calculate daily totals for food logs
const calculateDailyTotals = (logsArr, getFoodById) => {
    const totals = { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 };
    const allLogs = Object.values(logsArr).flat();

    allLogs.forEach(log => {
        const food = getFoodById(log.foodId);
        if (food) {
            const foodMacros = getFoodMacros(food);
            totals.calories += (foodMacros.calories || 0) * log.serving;
            totals.fat += (foodMacros.fat || 0) * log.serving;
            totals.carbs += (foodMacros.carbs || 0) * log.serving;
            totals.protein += (foodMacros.protein || 0) * log.serving;
            totals.fiber += (foodMacros.fiber || 0) * log.serving;
        }
    });
    return totals;
};

export default function HistoryView({ type, ...props }) {

    if (type === 'food') {
        const { goals, logsByDate, getFoodById, updateLog, deleteLog } = props;
        const noLogs = Object.keys(logsByDate).every(k => logsByDate[k].length === 0);
        const dailyTotals = calculateDailyTotals(logsByDate, getFoodById);

        return (
            <div className="bg-white rounded-lg shadow p-4 mt-4">
                {/* Food Summary */}
                <h3 className="text-lg font-semibold mb-4">Daily Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {renderFoodProgressBar("calories", dailyTotals.calories, goals.calories)}
                    {renderFoodProgressBar("fat", dailyTotals.fat, goals.fat)}
                    {renderFoodProgressBar("carbs", dailyTotals.carbs, goals.carbs)}
                    {renderFoodProgressBar("protein", dailyTotals.protein, goals.protein)}
                    {renderFoodProgressBar("fiber", dailyTotals.fiber, goals.fiber)}
                </div>

                {/* Food Log Table */}
                <h3 className="text-lg font-semibold mb-4">Today's Log</h3>
                {noLogs ? (
                    <div className="text-center py-4 text-gray-500">No foods logged for today.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            {/* Table Head */}
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-1 font-semibold">Food</th>
                                    <th className="text-left py-2 px-1 font-semibold">Qty</th>
                                    <th className="text-left py-2 px-1 font-semibold">Unit</th>
                                    <TooltipProvider>
                                        <th className="text-right py-2 px-1 font-semibold">
                                            <Tooltip><TooltipTrigger asChild><span>🔥</span></TooltipTrigger><TooltipContent><p>Calories</p></TooltipContent></Tooltip>
                                        </th>
                                        <th className="text-right py-2 px-1 font-semibold">
                                            <Tooltip><TooltipTrigger asChild><span>🥑</span></TooltipTrigger><TooltipContent><p>Fat</p></TooltipContent></Tooltip>
                                        </th>
                                        <th className="text-right py-2 px-1 font-semibold">
                                            <Tooltip><TooltipTrigger asChild><span>🍞</span></TooltipTrigger><TooltipContent><p>Carbs</p></TooltipContent></Tooltip>
                                        </th>
                                        <th className="text-right py-2 px-1 font-semibold">
                                            <Tooltip><TooltipTrigger asChild><span>🍗</span></TooltipTrigger><TooltipContent><p>Protein</p></TooltipContent></Tooltip>
                                        </th>
                                        <th className="text-right py-2 px-1 font-semibold">
                                            <Tooltip><TooltipTrigger asChild><span>🌱</span></TooltipTrigger><TooltipContent><p>Fiber</p></TooltipContent></Tooltip>
                                        </th>
                                    </TooltipProvider>
                                    <th className="py-2 px-1"></th>
                                </tr>
                            </thead>
                            {/* Table Body */}
                            <tbody>
                                {Object.entries(logsByDate).map(([segment, logs]) => (
                                    <React.Fragment key={segment}>
                                        {logs.length > 0 && (
                                            <tr><td colSpan="9" className="py-2 px-1 font-bold bg-gray-50 text-gray-700">{segment}</td></tr>
                                        )}
                                        {logs.map(log => {
                                            const food = getFoodById(log.foodId);
                                            if (!food) return null;
                                            const displayMacros = {
                                                calories: Math.round(getFoodMacros(food).calories * log.serving),
                                                fat: Math.round(getFoodMacros(food).fat * log.serving),
                                                carbs: Math.round(getFoodMacros(food).carbs * log.serving),
                                                protein: Math.round(getFoodMacros(food).protein * log.serving),
                                                fiber: Math.round(getFoodMacros(food).fiber * log.serving),
                                            };
                                            return (
                                                <tr key={log.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-2 px-1">{food.label}</td>
                                                    <td className="py-2 px-1">
                                                        <Input 
                                                          type="number" 
                                                          className="w-20 h-8" 
                                                          value={log.serving} 
                                                          onChange={(e) => updateLog(log.id, 'serving', parseFloat(e.target.value) || 0)} 
                                                          step="0.1"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-1">{log.units}</td>
                                                    <MacroDisplay macros={displayMacros} format="table-row-cells" />
                                                    <td className="text-center py-2 px-1">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteLog(log.id)}>
                                                            <span className="text-red-500">×</span>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    if (type === 'exercise') {
        const { enrichedAndGroupedLogs, deleteExerciseLog } = props;
        return (
            <div className="bg-white rounded-lg shadow p-4 overflow-auto">
                {/* Exercise Summary */}
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">Workout History</h3>
                    <ScoreDisplay type="exercise" />
                </div>

                {/* Exercise Log Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-2 text-left font-medium">Exercise</th>
                                <th className="p-2 text-left font-medium">Category</th>
                                <th className="p-2 text-left font-medium">Duration (min)</th>
                                <th className="p-2 text-left font-medium">Score</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {Object.entries(enrichedAndGroupedLogs).map(([date, dateGroup]) => (
                                <React.Fragment key={date}>
                                    <tr className="bg-gray-100"><td colSpan="5" className="p-2 font-semibold">{date} (Total Duration: {dateGroup.totalDuration.toFixed(1)} min)</td></tr>
                                    {Object.entries(dateGroup.segments).map(([segment, segmentGroup]) => (
                                        <React.Fragment key={segment}>
                                            <tr className="bg-gray-50 font-medium"><td colSpan="5" className="px-4 py-1 text-gray-700">{segment} (Duration: {segmentGroup.totalDuration.toFixed(1)} min)</td></tr>
                                            {segmentGroup.logs.map(log => (
                                                <tr key={log.id}>
                                                    <td className="p-2">{log.exerciseName}</td>
                                                    <td className="p-2">{log.category}</td>
                                                    <td className="p-2">{log.duration?.toFixed(1) ?? 'N/A'}</td>
                                                    <td className="p-2">{log.score}</td>
                                                    <td className="p-2 text-center">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteExerciseLog(log.id)}>
                                                            <span className="text-red-500">×</span>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return null;
} 