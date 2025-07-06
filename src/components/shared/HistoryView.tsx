import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { X } from 'lucide-react';
import React, { useState } from 'react';
import { getExerciseName } from '../../services/exercise/exerciseService';
import {
  calculateDailyTotals,
  groupLogsByDate,
} from '../../services/nutrition/dailyTotalsService';
import { getFoodMacros } from '../../utils/dataUtils';
import { formatSmartDate } from '../../utils/timeUtils';
import ScoreDisplay from '../gamification/ScoreDisplay';
import MacroDisplay from '../nutrition/MacroDisplay';
import NutritionLabel from '../nutrition/NutritionLabel';
import type { FoodLog, ExerciseLog, Food, DailyTotals, Exercise } from '../../types';
import FoodItemDisplay from './Food/FoodItemDisplay';
import FoodItemTooltip from './Food/FoodItemTooltip';
import { normalizeFoodForDisplay } from '../../utils/foodUtils';

interface FoodLogRowProps {
  log: FoodLog;
  food: Food;
  updateLog: (id: string, field: string, value: number) => void;
  deleteLog: (id: string) => void;
  disableDelete?: boolean;
}

interface ExerciseLogRowProps {
  log: ExerciseLog;
  getExerciseName: (exerciseId: string, exerciseLibrary: Exercise[]) => string;
  deleteLog: (id: string) => void;
  exerciseLibrary?: Exercise[];
}

interface RecipeGroup {
  type: 'recipe';
  recipeId: string;
  recipeName: string;
  recipeLoggedServings: number;
  recipeServings: number;
  logs: FoodLog[];
  groupKey: string;
}

interface SingleLogGroup {
  type: 'single';
  log: FoodLog;
}

type LogGroup = RecipeGroup | SingleLogGroup;

interface HistoryViewProps {
  type: 'food' | 'exercise';
  logs: FoodLog[] | ExerciseLog[];
  getFoodById?: (id: string) => Food;
  updateLog?: (id: string, field: string, value: number) => void;
  deleteLog?: (id: string) => void;
  disableDelete?: boolean;
}

// Helper for rendering progress bars in the food summary
const renderFoodProgressBar = (label: string, value: number, goal: number) => {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;
  const isOver = percentage > 100;

  return (
    <div className="text-sm">
      <div className="flex justify-between mb-1">
        <span className="font-medium capitalize">{label}</span>
        <span>
          {value.toFixed(0)} / {goal}g
        </span>
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

const FoodLogRow: React.FC<FoodLogRowProps> = ({ log, food, updateLog, deleteLog, disableDelete }) => {
  const normalizedFood = normalizeFoodForDisplay(food);
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-2 px-1">
        <FoodItemTooltip food={normalizedFood}>
          <FoodItemDisplay
            food={normalizedFood}
            context="log"
            showActions={false}
            calories={getFoodMacros(food).calories}
          />
        </FoodItemTooltip>
      </td>
      <td className="py-2 px-1">
        <Input
          type="number"
          className="w-20 h-8"
          value={log.serving}
          onChange={(e) =>
            updateLog(log.id!, 'serving', parseFloat(e.target.value) || 0)
          }
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
        {!disableDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => deleteLog(log.id!)}
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </td>
    </tr>
  );
};

const ExerciseLogRow: React.FC<ExerciseLogRowProps> = ({ log, getExerciseName, deleteLog, exerciseLibrary = [] }) => (
  <tr className="border-b hover:bg-gray-50">
    <td className="py-2 px-1">{getExerciseName(log.exerciseId, exerciseLibrary)}</td>
    <td className="py-2 px-1">
      {log.duration
        ? `${log.duration} min`
        : log.sets?.[0]
          ? `${log.sets[0].weight}lbs x ${log.sets[0].reps}`
          : 'N/A'}
    </td>
    <td className="py-2 px-1">{log.score}</td>
    <td className="text-center py-2 px-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => deleteLog(log.id!)}
      >
        <X className="h-4 w-4 text-red-500" />
      </Button>
    </td>
  </tr>
);

function groupLogsByRecipe(logs: FoodLog[]): LogGroup[] {
  // Group logs by recipeId+timestamp if present, else by log id
  const groups: LogGroup[] = [];
  const used = new Set<string>();
  const recipeKeySet = new Set<string>();
  
  logs.forEach((log) => {
    if (used.has(log.id!)) return;
    
    const logWithRecipe = log as FoodLog & { recipeId?: string; recipeName?: string; recipeLoggedServings?: number; recipeServings?: number };
    
    if (logWithRecipe.recipeId && logWithRecipe.recipeName) {
      const groupKey = logWithRecipe.recipeId + '-' + new Date(log.timestamp).getTime();
      if (recipeKeySet.has(groupKey)) return; // Prevent duplicate group
      
      // Find all logs with same recipeId, recipeName, and timestamp
      const group = logs.filter(
        (l) => {
          const lWithRecipe = l as FoodLog & { recipeId?: string; recipeName?: string };
          return lWithRecipe.recipeId === logWithRecipe.recipeId &&
            new Date(l.timestamp).getTime() === new Date(log.timestamp).getTime();
        }
      );
      group.forEach((l) => used.add(l.id!));
      groups.push({
        type: 'recipe',
        recipeId: logWithRecipe.recipeId,
        recipeName: logWithRecipe.recipeName,
        recipeLoggedServings: logWithRecipe.recipeLoggedServings || 1,
        recipeServings: logWithRecipe.recipeServings || 1,
        logs: group,
        groupKey,
      });
      recipeKeySet.add(groupKey);
    } else {
      groups.push({ type: 'single', log });
      used.add(log.id!);
    }
  });
  return groups;
}

const HistoryView: React.FC<HistoryViewProps> = ({ type, logs, ...props }) => {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  
  if (type === 'food') {
    const { getFoodById, updateLog, deleteLog } = props as {
      getFoodById: (id: string) => Food;
      updateLog: (id: string, field: string, value: number) => void;
      deleteLog: (id: string) => void;
    };
    
    const foodLogs = logs as FoodLog[];
    const groupedLogs = groupLogsByDate(foodLogs, formatSmartDate);

    if (foodLogs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No food logged for today.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(groupedLogs).map(([date, dateLogs]) => {
          const recipeGroups = groupLogsByRecipe(dateLogs);
          return (
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
                  {recipeGroups.map((group, idx) => {
                    if (group.type === 'recipe') {
                      // Sum macros for the recipe
                      let macros = {
                        calories: 0,
                        fat: 0,
                        carbs: 0,
                        protein: 0,
                        fiber: 0,
                      };
                      let totalXP = 0;
                      
                      group.logs.forEach((log) => {
                        const food = getFoodById(log.foodId);
                        if (food) {
                          const foodMacros = getFoodMacros(food);
                          macros.calories += foodMacros.calories * log.serving;
                          macros.fat += foodMacros.fat * log.serving;
                          macros.carbs += foodMacros.carbs * log.serving;
                          macros.protein += foodMacros.protein * log.serving;
                          macros.fiber += foodMacros.fiber * log.serving;
                          totalXP += log.xp || 0;
                        }
                      });

                      const isExpanded = expandedRecipe === group.groupKey;

                      return (
                        <React.Fragment key={group.groupKey}>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="py-2 px-1">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={() =>
                                    setExpandedRecipe(
                                      isExpanded ? null : group.groupKey
                                    )
                                  }
                                >
                                  {isExpanded ? '−' : '+'}
                                </Button>
                                <span className="font-medium">
                                  {group.recipeName} ({group.recipeLoggedServings}/{group.recipeServings} servings)
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-1">-</td>
                            <td className="py-2 px-1">-</td>
                            <td className="text-right py-2 px-1">
                              {macros.calories.toFixed(0)}
                            </td>
                            <td className="text-right py-2 px-1">
                              {macros.fat.toFixed(1)}
                            </td>
                            <td className="text-right py-2 px-1">
                              {macros.carbs.toFixed(1)}
                            </td>
                            <td className="text-right py-2 px-1">
                              {macros.protein.toFixed(1)}
                            </td>
                            <td className="text-right py-2 px-1">
                              {macros.fiber.toFixed(1)}
                            </td>
                            <td className="text-center py-2 px-1">
                              {totalXP > 0 && (
                                <span className="text-sm font-medium text-green-600">
                                  +{totalXP}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-2 px-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  group.logs.forEach((log) => deleteLog(log.id!));
                                }}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                          {isExpanded &&
                            group.logs.map((log) => {
                              const food = getFoodById(log.foodId);
                              if (!food) return null;
                              return (
                                <FoodLogRow
                                  key={log.id}
                                  log={log}
                                  food={food}
                                  updateLog={updateLog}
                                  deleteLog={deleteLog}
                                  disableDelete={true}
                                />
                              );
                            })}
                        </React.Fragment>
                      );
                    } else {
                      const food = getFoodById(group.log.foodId);
                      if (!food) return null;
                      return (
                        <FoodLogRow
                          key={group.log.id}
                          log={group.log}
                          food={food}
                          updateLog={updateLog}
                          deleteLog={deleteLog}
                        />
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'exercise') {
    const exerciseLogs = logs as ExerciseLog[];
    
    if (exerciseLogs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No exercises logged for today.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-1 font-semibold">Exercise</th>
              <th className="text-left py-2 px-1 font-semibold">Details</th>
              <th className="text-center py-2 px-1 font-semibold">Score</th>
              <th className="py-2 px-1"></th>
            </tr>
          </thead>
          <tbody>
            {exerciseLogs.map((log) => (
              <ExerciseLogRow
                key={log.id}
                log={log}
                getExerciseName={getExerciseName}
                deleteLog={props.deleteLog || (() => {})}
                exerciseLibrary={[]}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

export default HistoryView; 