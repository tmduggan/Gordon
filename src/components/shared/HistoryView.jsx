import React from 'react';
import MacroDisplay from '../nutrition/MacroDisplay';
import { getFoodMacros } from '../../utils/dataUtils';
import { formatSmartDate } from '../../utils/timeUtils';
import ScoreDisplay from '../gamification/ScoreDisplay';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { X } from 'lucide-react';
import NutritionLabel from '../nutrition/NutritionLabel';
import { calculateDailyTotals, groupLogsByDate } from '../../services/nutrition/dailyTotalsService';
import { getExerciseName } from '../../services/exercise/exerciseService';

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
                    className={`h-2.5 rounded-full ${isOver ? 'bg-status-error' : 'bg-primary'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

const FoodLogRow = ({ log, food, updateLog, deleteLog }) => (
    <tr className="border-b hover:bg-gray-50">
        <td className="py-2 px-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="cursor-default">{food.label}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <NutritionLabel food={food} />
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </td>
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
        <MacroDisplay macros={getFoodMacros(food)} format="table-row-cells" />
        <td className="text-center py-2 px-1">
            {log.xp && (
                <span className="text-sm font-medium text-green-600">+{log.xp}</span>
            )}
        </td>
        <td className="text-center py-2 px-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteLog(log.id)}>
                <X className="h-4 w-4 text-red-500" />
            </Button>
        </td>
    </tr>
);

const ExerciseLogRow = ({ log, getExerciseName, deleteLog }) => (
    <tr className="border-b hover:bg-gray-50">
        <td className="py-2 px-1">{getExerciseName(log.exerciseId)}</td>
        <td className="py-2 px-1">{log.category}</td>
        <td className="py-2 px-1">{log.duration ? `${log.duration} min` : (log.sets?.[0] ? `${log.sets[0].weight}lbs x ${log.sets[0].reps}` : 'N/A')}</td>
        <td className="py-2 px-1">{log.score}</td>
        <td className="text-center py-2 px-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteLog(log.id)}>
                <X className="h-4 w-4 text-red-500" />
            </Button>
        </td>
    </tr>
);

export default function HistoryView({ type, logs, ...props }) {
    if (type === 'food') {
        const { getFoodById, updateLog, deleteLog } = props;
        const groupedLogs = groupLogsByDate(logs, formatSmartDate);

        if (logs.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>No food logged for today.</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                    <div key={date}>
                        <h2 className="font-bold text-lg mb-2">{date}</h2>
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
                                    <th className="text-center py-2 px-1 font-semibold">XP</th>
                                    <th className="py-2 px-1"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {dateLogs.map((log) => {
                                    const food = getFoodById(log.foodId);
                                    return food ? <FoodLogRow key={log.id} log={log} food={food} updateLog={updateLog} deleteLog={deleteLog} /> : null;
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        );
    }

    // Exercise history view
    const { exerciseLibrary, deleteLog } = props;
    const groupedLogs = groupLogsByDate(logs, formatSmartDate);

    if (logs.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No exercises logged for today.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                <div key={date}>
                    <h2 className="font-bold text-lg mb-2">{date}</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-1 font-semibold">Exercise</th>
                                <th className="text-left py-2 px-1 font-semibold">Category</th>
                                <th className="text-left py-2 px-1 font-semibold">Details</th>
                                <th className="text-left py-2 px-1 font-semibold">Score</th>
                                <th className="py-2 px-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {dateLogs.map((log) => (
                                <ExerciseLogRow 
                                    key={log.id} 
                                    log={log} 
                                    getExerciseName={(id) => getExerciseName(id, exerciseLibrary?.items || [])}
                                    deleteLog={deleteLog} 
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
} 