import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getFoodMacros } from '../../utils/dataUtils';

const DailyTotalsCard = ({ logs, goals, getFoodById }) => {
    // Calculate daily totals
    const calculateDailyTotals = () => {
        const totals = { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 };
        
        logs.forEach(log => {
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

    const totals = calculateDailyTotals();
    
    const macroConfig = [
        { key: 'calories', label: '🔥 Calories', goal: goals.calories, color: 'bg-orange-500' },
        { key: 'protein', label: '🍗 Protein', goal: goals.protein, color: 'bg-red-500' },
        { key: 'carbs', label: '🍞 Carbs', goal: goals.carbs, color: 'bg-blue-500' },
        { key: 'fat', label: '🥑 Fat', goal: goals.fat, color: 'bg-yellow-500' },
        { key: 'fiber', label: '🌱 Fiber', goal: goals.fiber, color: 'bg-green-500' },
    ];

    const MacroProgress = ({ config, value, goal }) => {
        const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
        const isOver = value > goal;
        
        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-sm text-muted-foreground">
                        {Math.round(value)} / {goal}{config.key === 'calories' ? '' : 'g'}
                    </span>
                </div>
                <div className="space-y-1">
                    <Progress 
                        value={percentage} 
                        className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{Math.round(percentage)}%</span>
                        {isOver && (
                            <span className="text-red-500">
                                +{Math.round(value - goal)}{config.key === 'calories' ? '' : 'g'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="mb-4">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Daily Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {macroConfig.map((config) => (
                    <MacroProgress
                        key={config.key}
                        config={config}
                        value={totals[config.key]}
                        goal={config.goal}
                    />
                ))}
            </CardContent>
        </Card>
    );
};

export default DailyTotalsCard; 