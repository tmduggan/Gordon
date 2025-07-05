import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';
import useLibrary from '../../../hooks/useLibrary';
import { calculateExerciseScore } from '../../../services/exercise/exerciseService';
import {
  calculateFoodGroupMultiplier,
  calculateFoodXP,
} from '../../../services/gamification/foodScoringService';
import { calculateStreakBonuses } from '../../../services/gamification/levelService';
import {
  analyzeLaggingMuscles,
  calculateLaggingMuscleBonus,
} from '../../../services/gamification/suggestionService';
import useAuthStore from '../../../store/useAuthStore';
import { getFoodMacros } from '../../../utils/dataUtils';
import SaveCartAsRecipe from '../../nutrition/SaveCartAsRecipe';
import ExerciseCartRow from './ExerciseCartRow';
import FoodCartRow from './FoodCartRow';

const CartMacroSummary = ({ items }) => {
  const foodLibrary = useLibrary('food');
  const { userProfile } = useAuthStore();

  const calculateRecipeMacros = (recipe, servings) => {
    const recipeServings = recipe.servings || 1;
    let totalMacros = { calories: 0, fat: 0, carbs: 0, protein: 0 };

    recipe.items.forEach((ingredient) => {
      if (ingredient.isRecipe) {
        // Handle nested recipe
        const nestedRecipe = userProfile?.recipes?.find(
          (r) => r.id === ingredient.id
        );
        if (nestedRecipe) {
          const nestedScaledQty =
            (ingredient.quantity / recipeServings) * servings;
          const nestedMacros = calculateRecipeMacros(
            nestedRecipe,
            nestedScaledQty
          );
          totalMacros.calories += nestedMacros.calories;
          totalMacros.fat += nestedMacros.fat;
          totalMacros.carbs += nestedMacros.carbs;
          totalMacros.protein += nestedMacros.protein;
        }
      } else {
        // Regular food ingredient
        const food = foodLibrary.items.find((f) => f.id === ingredient.id);
        if (!food) return;
        const macros = getFoodMacros(food);
        const scaledQty = (ingredient.quantity / recipeServings) * servings;
        totalMacros.calories += (macros.calories || 0) * scaledQty;
        totalMacros.fat += (macros.fat || 0) * scaledQty;
        totalMacros.carbs += (macros.carbs || 0) * scaledQty;
        totalMacros.protein += (macros.protein || 0) * scaledQty;
      }
    });

    return totalMacros;
  };

  const totals = items.reduce(
    (acc, item) => {
      if (
        item.type === 'recipe' &&
        item.recipe &&
        item.recipe.items &&
        item.recipe.servings
      ) {
        // Expand recipe ingredients (including nested recipes)
        const servings = item.servings || 1;
        const recipeMacros = calculateRecipeMacros(item.recipe, servings);
        acc.calories += recipeMacros.calories;
        acc.fat += recipeMacros.fat;
        acc.carbs += recipeMacros.carbs;
        acc.protein += recipeMacros.protein;
      } else {
        // Regular food item
        acc.calories += item.calories || 0;
        acc.fat += item.fat || 0;
        acc.carbs += item.carbs || 0;
        acc.protein += item.protein || 0;
      }
      return acc;
    },
    { calories: 0, fat: 0, carbs: 0, protein: 0 }
  );

  const MacroPill = ({ label, value, unit, className }) => (
    <div
      className={`text-center rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      <div>{label}</div>
      <div className="font-bold">
        {value}
        {unit}
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      <h4 className="text-sm font-semibold mb-2 text-center">Cart Totals</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MacroPill
          label="Calories"
          value={Math.round(totals.calories)}
          unit=""
          className="bg-orange-100 text-orange-800"
        />
        <MacroPill
          label="Protein"
          value={Math.round(totals.protein)}
          unit="g"
          className="bg-sky-100 text-sky-800"
        />
        <MacroPill
          label="Carbs"
          value={Math.round(totals.carbs)}
          unit="g"
          className="bg-lime-100 text-lime-800"
        />
        <MacroPill
          label="Fat"
          value={Math.round(totals.fat)}
          unit="g"
          className="bg-amber-100 text-amber-800"
        />
      </div>
    </div>
  );
};

const CartFoodSummary = ({ items }) => {
  const totalXP = items.reduce((acc, item) => {
    const xp = calculateFoodXP(
      item,
      item.quantity || 1,
      item.units || item.serving_unit
    );
    return acc + xp;
  }, 0);

  // Calculate breakdown for tooltip
  const xpBreakdown = items.map((item) => {
    const baseXP = calculateFoodXP(
      item,
      item.quantity || 1,
      item.units || item.serving_unit
    );
    const multiplier = calculateFoodGroupMultiplier(item);
    const multiplierBonus = Math.round(baseXP * (multiplier - 1));

    const lines = [{ xp: baseXP, label: 'Base XP' }];

    if (multiplierBonus > 0) {
      lines.push({ xp: multiplierBonus, label: 'Food group bonus' });
    }

    return {
      name: item.label || item.food_name,
      lines: lines,
      totalXP: baseXP + multiplierBonus,
    };
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <span className="font-semibold">Total XP:</span>
            <span className="text-lg font-bold text-primary">{totalXP}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold text-sm">Cart Breakdown:</div>
            {xpBreakdown.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="truncate max-w-[180px] font-medium text-xs mb-1">
                  {item.name}
                </div>
                <div className="text-xs text-gray-700">
                  {item.lines.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        fontFamily: 'monospace',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          minWidth: 36,
                          textAlign: 'right',
                          color: '#059669',
                          fontWeight: 600,
                        }}
                      >
                        +{line.xp}
                      </span>
                      <span style={{ marginLeft: 4, minWidth: 24 }}>XP</span>
                      <span style={{ marginLeft: 8 }}>{line.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Total:</span>
                <span className="text-green-600">+{totalXP}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const CartExerciseSummary = ({
  items,
  logData,
  history,
  library = [],
  userProfile,
}) => {
  // Ensure library is always an array to prevent undefined.find errors
  const safeLibrary = Array.isArray(library) ? library : [];
  
  // Calculate XP for each exercise in the cart
  let totalScore = 0;
  const scoreBreakdown = items.map((item) => {
    const workoutData = logData[item.id] || {};
    const exerciseDetails = safeLibrary.find((e) => e.id === item.id) || {};
    let lines = [];
    let hasData = false;
    if (workoutData.sets && Array.isArray(workoutData.sets)) {
      hasData = workoutData.sets.some(
        (set) => set && (set.weight || set.reps || set.duration)
      );
    }
    if (workoutData.duration) {
      hasData = true;
    }
    if (!hasData) {
      return {
        name: item.name,
        lines: ['No data'],
        hasData: false,
      };
    }

    // Calculate XP for each set or duration
    let xpLines = [];
    let exerciseScore = 0;
    if (workoutData.sets && workoutData.sets.length > 0) {
      workoutData.sets.forEach((set, idx) => {
        const setData = { ...set };
        const setScore = calculateExerciseScore(
          { sets: [setData] },
          exerciseDetails
        );
        exerciseScore += setScore;
        const weight = set.weight || 0;
        const reps = set.reps || 0;
        if (weight || reps) {
          xpLines.push({ xp: setScore, label: `${weight} lbs × ${reps} reps` });
        }
      });
    } else if (workoutData.duration) {
      const durationScore = calculateExerciseScore(
        { duration: workoutData.duration },
        exerciseDetails
      );
      exerciseScore += durationScore;
      xpLines.push({ xp: durationScore, label: `${workoutData.duration} min` });
    }
    totalScore += exerciseScore;
    return {
      name: item.name,
      lines: xpLines,
      hasData: true,
    };
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <span className="font-semibold">Total XP:</span>
            <span className="text-lg font-bold text-primary">{totalScore}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold text-sm">Cart Breakdown:</div>
            {scoreBreakdown.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="truncate max-w-[180px] font-medium text-xs mb-1">
                  {item.name}
                </div>
                <div className="text-xs text-gray-700">
                  {item.lines.length === 0 ? (
                    <div>No data</div>
                  ) : (
                    item.lines.map((line, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          fontFamily: 'monospace',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            minWidth: 36,
                            textAlign: 'right',
                            color: '#059669',
                            fontWeight: 600,
                          }}
                        >
                          +{line.xp}
                        </span>
                        <span style={{ marginLeft: 4, minWidth: 24 }}>XP</span>
                        <span style={{ marginLeft: 8 }}>{line.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Total:</span>
                <span className="text-green-600">+{totalScore}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function CartContainer({
  title,
  type,
  items,
  footerControls,
  logCart,
  clearCart,
  icon,
  logData = {},
  userWorkoutHistory,
  exerciseLibrary = [],
  library = [],
  userProfile,
  onRecipeCreated,
  onLogDataChange,
  ...rest
}) {
  if (items.length === 0) {
    return null;
  }

  // Use library prop if provided, otherwise fall back to exerciseLibrary
  const exerciseLibraryData = library.length > 0 ? library : exerciseLibrary;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          {icon ? (
            <span className="text-4xl">{icon}</span>
          ) : (
            <CardTitle>{title}</CardTitle>
          )}
          {type === 'exercise' && (
            <CartExerciseSummary
              items={items}
              logData={logData}
              history={userWorkoutHistory}
              library={exerciseLibraryData}
              userProfile={userProfile}
            />
          )}
          {type === 'food' && <CartFoodSummary items={items} />}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {items.map((item, index) =>
            type === 'food' || item.type === 'recipe' || 'label' in item ? (
              <FoodCartRow
                key={item.id || `${item.label}-${item.units}-${index}`}
                item={item}
                type={type}
                logData={logData}
                onLogDataChange={onLogDataChange}
                isRecipe={item.type === 'recipe'}
                {...rest}
              />
            ) : (
              <ExerciseCartRow
                key={item.id || `${item.name}-${index}`}
                item={item}
                type={type}
                logData={logData}
                onLogDataChange={onLogDataChange}
                userWorkoutHistory={userWorkoutHistory}
                {...rest}
              />
            )
          )}
        </div>
      </CardContent>
      {type === 'food' && <CartMacroSummary items={items} />}
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4">
        <div className="flex items-center gap-2">
          {footerControls}
          {type === 'food' && onRecipeCreated && (
            <SaveCartAsRecipe cart={items} onRecipeCreated={onRecipeCreated} />
          )}
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            onClick={clearCart}
            className="w-1/2 sm:w-auto"
          >
            Clear
          </Button>
          <Button onClick={logCart} className="w-1/2 sm:w-auto">
            Log Items
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
