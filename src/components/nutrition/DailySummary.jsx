import React from 'react';
import useHistory from '../../hooks/fetchHistory';
import useAuthStore from '../../store/useAuthStore';
import { foodTimePeriods } from '../../utils/timeUtils';
import { getFoodMacros } from '../../utils/dataUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Moon, Sun } from 'lucide-react';

const Fact = ({ label, value, indent = false, isBold = false, isPreview = false }) => (
    <div className={`flex justify-between py-0.5 border-t border-gray-400 ${indent ? 'pl-4' : ''} ${isPreview ? 'text-gray-500' : ''}`}>
        <span className={isBold ? 'font-bold' : ''}>{label}</span>
        <span>{value}</span>
    </div>
);

const MealNutritionLabel = ({ meal, macros, previewMacros, foods, cartFoods }) => {
    return (
        <div className="w-64 p-2 bg-white text-black border-2 border-black font-sans text-sm rounded-md">
            <h1 className="text-2xl font-extrabold tracking-tight">Nutrition Facts</h1>
            <div className="border-b-4 border-black -mx-2"></div>
            <div className="py-1">
                <p className="font-semibold">{meal}</p>
            </div>
            <div className="flex justify-between items-baseline border-b-8 border-black py-1 -mx-2 px-2">
                <p className="font-bold text-base">Calories</p>
                <p className="text-3xl font-extrabold">{Math.round(macros.calories)}</p>
            </div>
            
            <Fact label="Total Fat" value={`${Math.round(macros.fat)}g`} isBold />
            {previewMacros.fat > 0 && <Fact label="Preview Fat" value={`+${Math.round(previewMacros.fat)}g`} indent isPreview />}
            
            <Fact label="Total Carbohydrate" value={`${Math.round(macros.carbs)}g`} isBold />
            {previewMacros.carbs > 0 && <Fact label="Preview Carbs" value={`+${Math.round(previewMacros.carbs)}g`} indent isPreview />}

            <Fact label="Protein" value={`${Math.round(macros.protein)}g`} isBold />
            {previewMacros.protein > 0 && <Fact label="Preview Protein" value={`+${Math.round(previewMacros.protein)}g`} indent isPreview />}
            
            <div className="border-t-4 border-black mt-2 -mx-2"></div>

            {foods.length > 0 && (
                <div className="mt-2">
                    <p className="font-semibold text-xs">Logged in this meal:</p>
                    <div className="text-xs space-y-1 mt-1">
                        {foods.map((food, index) => (
                            <div key={index} className="text-gray-700">
                                • {food.label || food.food_name} ({food.serving} serving)
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {cartFoods.length > 0 && (
                <div className="mt-2">
                    <p className="font-semibold text-xs text-gray-500">In Cart (Preview):</p>
                    <div className="text-xs space-y-1 mt-1">
                        {cartFoods.map((food, index) => (
                            <div key={index} className="text-gray-500">
                                • {food.label || food.food_name} ({food.quantity} serving)
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MacroBar = ({ macro, value, goal, color, opacity = 1 }) => {
    const percentage = goal > 0 ? (value / goal) * 100 : 0;
    
    return (
        <div 
            className="w-full"
            style={{ height: `${percentage}%`, backgroundColor: color, opacity: opacity }}
            title={`${macro}: ${Math.round(value)} / ${goal}g (${Math.round(percentage)}%)`}
        />
    );
};

const DailySummary = ({ foodLibrary, cart = [], cartTimePeriod }) => {
    const { user, userProfile } = useAuthStore();
    const { logs } = useHistory('food');
    
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);

    const goals = userProfile?.goals || { calories: 2000, protein: 150, carbs: 200, fat: 60 };

    const getMealPeriod = (date) => {
        const hour = new Date(date).getHours();
        if (hour < 6) return "Early Morning";
        if (hour < 10) return "Breakfast";
        if (hour < 12) return "Brunch";
        if (hour < 16) return "Lunch";
        if (hour < 19) return "Supper";
        return "Dinner";
    }

    const meals = Object.keys(foodTimePeriods).reduce((acc, period) => {
        acc[period] = { protein: 0, carbs: 0, fat: 0, calories: 0, foods: [] };
        return acc;
    }, {});

    todayLogs.forEach(log => {
        const mealPeriod = getMealPeriod(log.timestamp);
        const foodDetails = foodLibrary.find(f => f.id === log.foodId);

        if (foodDetails) {
            const macros = getFoodMacros(foodDetails);
            
            if (meals[mealPeriod]) {
                const scaledMacros = {
                    protein: macros.protein * (log.serving || 1),
                    carbs: macros.carbs * (log.serving || 1),
                    fat: macros.fat * (log.serving || 1),
                    calories: macros.calories * (log.serving || 1),
                };

                meals[mealPeriod].protein += scaledMacros.protein;
                meals[mealPeriod].carbs += scaledMacros.carbs;
                meals[mealPeriod].fat += scaledMacros.fat;
                meals[mealPeriod].calories += scaledMacros.calories;
                
                meals[mealPeriod].foods.push({
                    ...foodDetails,
                    serving: log.serving || 1
                });
            }
        }
    });

    const previewMeals = Object.keys(foodTimePeriods).reduce((acc, period) => {
        acc[period] = { protein: 0, carbs: 0, fat: 0, calories: 0 };
        return acc;
    }, {});

    if (cart.length > 0 && cartTimePeriod && previewMeals[cartTimePeriod]) {
        cart.forEach(cartItem => {
            const foodDetails = foodLibrary.find(f => f.id === cartItem.id);
            if (foodDetails) {
                const macros = getFoodMacros(foodDetails);
                const quantity = cartItem.quantity || 1;
                previewMeals[cartTimePeriod].protein += macros.protein * quantity;
                previewMeals[cartTimePeriod].carbs += macros.carbs * quantity;
                previewMeals[cartTimePeriod].fat += macros.fat * quantity;
                previewMeals[cartTimePeriod].calories += macros.calories * quantity;
            }
        });
    }

    return (
        <Card className="mb-4">
            <CardContent className="relative flex justify-around items-end h-48 gap-2 pt-10 rounded-lg overflow-hidden bg-[linear-gradient(to_right,theme(colors.slate.900),theme(colors.sky.400),theme(colors.yellow.300),theme(colors.sky.400),theme(colors.slate.900))]">
                <Moon className="absolute top-3 left-3 h-6 w-6 text-white" />
                <Sun className="absolute top-3 left-1/2 -translate-x-1/2 h-8 w-8 text-white" />
                <Moon className="absolute top-3 right-3 h-6 w-6 text-white" />
                <TooltipProvider>
                    {Object.entries(meals).map(([meal, mealData]) => {
                        const previewData = previewMeals[meal];
                        const cartFoodsForMeal = meal === cartTimePeriod ? cart : [];

                        return (
                            <Tooltip key={meal}>
                                <TooltipTrigger asChild>
                                    <div className="z-10 flex flex-col h-full w-1/6 items-center cursor-pointer">
                                        <div className="relative w-8 h-full bg-gray-200/50 rounded-t-lg overflow-hidden flex flex-col-reverse">
                                            {/* Logged Bars */}
                                            <MacroBar macro="Protein" value={mealData.protein} goal={goals.protein} color="#ef4444" />
                                            <MacroBar macro="Carbs" value={mealData.carbs} goal={goals.carbs} color="#3b82f6" />
                                            <MacroBar macro="Fat" value={mealData.fat} goal={goals.fat} color="#facc15" />
                                            {/* Preview Bars */}
                                            <MacroBar macro="Protein" value={previewData.protein} goal={goals.protein} color="#ef4444" opacity={0.5} />
                                            <MacroBar macro="Carbs" value={previewData.carbs} goal={goals.carbs} color="#3b82f6" opacity={0.5} />
                                            <MacroBar macro="Fat" value={previewData.fat} goal={goals.fat} color="#facc15" opacity={0.5} />
                        </div>
                                        <p className="text-xs mt-1 text-center font-semibold text-white mix-blend-difference">{meal}</p>
                                        <p className="text-xs text-white mix-blend-difference">{Math.round(mealData.calories)} cal</p>
                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <MealNutritionLabel 
                                        meal={meal} 
                                        macros={mealData} 
                                        previewMacros={previewData}
                                        foods={mealData.foods}
                                        cartFoods={cartFoodsForMeal}
                                    />
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </CardContent>
        </Card>
    );
};

export default DailySummary; 