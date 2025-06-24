import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CartRow from './CartRow';
import CartHead from './CartHead';
import { getFoodMacros } from '../../utils/dataUtils';
import { calculateWorkoutScore } from '../../services/scoringService';

const CartMacroSummary = ({ items }) => {
    const totals = items.reduce((acc, item) => {
        // Use the scaled nutrition values that are stored directly on the item
        // (calculated by ServingSizeEditor) instead of recalculating with getFoodMacros
        const calories = item.calories || 0;
        const fat = item.fat || 0;
        const carbs = item.carbs || 0;
        const protein = item.protein || 0;
        
        acc.calories += calories;
        acc.fat += fat;
        acc.carbs += carbs;
        acc.protein += protein;
        return acc;
    }, { calories: 0, fat: 0, carbs: 0, protein: 0 });

    const MacroPill = ({ label, value, unit, className }) => (
        <div className={`text-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>
            <div>{label}</div>
            <div className="font-bold">{value}{unit}</div>
        </div>
    );

    return (
        <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 text-center">Cart Totals</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MacroPill label="Calories" value={Math.round(totals.calories)} unit="" className="bg-orange-100 text-orange-800" />
                <MacroPill label="Protein" value={Math.round(totals.protein)} unit="g" className="bg-sky-100 text-sky-800" />
                <MacroPill label="Carbs" value={Math.round(totals.carbs)} unit="g" className="bg-lime-100 text-lime-800" />
                <MacroPill label="Fat" value={Math.round(totals.fat)} unit="g" className="bg-amber-100 text-amber-800" />
            </div>
        </div>
    );
};

const CartExerciseSummary = ({ items, logData, history, library, userProfile }) => {
    const totalScore = items.reduce((acc, item) => {
        const workoutData = logData[item.id] || {};
        const exerciseDetails = library.find(e => e.id === item.id) || {};
        
        const score = calculateWorkoutScore(
            { ...workoutData, timestamp: new Date() }, // Pass a dummy timestamp
            history,
            exerciseDetails,
            userProfile
        );
        return acc + score;
    }, 0);

    // Calculate breakdown for tooltip
    const scoreBreakdown = items.map(item => {
        const workoutData = logData[item.id] || {};
        const exerciseDetails = library.find(e => e.id === item.id) || {};
        
        const score = calculateWorkoutScore(
            { ...workoutData, timestamp: new Date() },
            history,
            exerciseDetails,
            userProfile
        );
        
        return {
            name: item.name,
            score,
            hasData: !!(workoutData.weight || workoutData.reps || workoutData.duration)
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
                            <div key={index} className="flex justify-between text-xs">
                                <span className="truncate max-w-[150px]">{item.name}</span>
                                <span className={`font-medium ${item.hasData ? 'text-green-600' : 'text-gray-400'}`}>
                                    {item.hasData ? `+${item.score}` : 'No data'}
                                </span>
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
  logData,
  userWorkoutHistory,
  exerciseLibrary,
  userProfile,
  ...rest
}) {
  if (items.length === 0) {
    return null;
  }

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
                    library={exerciseLibrary}
                    userProfile={userProfile}
                />
            )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <table className="w-full text-sm">
          <CartHead type={type} />
          <tbody className="divide-y">
            {items.map((item, index) => (
              <CartRow
                key={item.id || `${item.label}-${item.units}-${index}`}
                item={item}
                type={type}
                {...rest}
              />
            ))}
          </tbody>
        </table>
      </CardContent>
      {type === 'food' && <CartMacroSummary items={items} />}
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4">
        <div>{footerControls}</div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button variant="outline" onClick={clearCart} className="w-1/2 sm:w-auto">Clear</Button>
          <Button onClick={logCart} className="w-1/2 sm:w-auto">Log Items</Button>
        </div>
      </CardFooter>
    </Card>
  );
} 