import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getFoodMacros } from '../../utils/dataUtils';
import { calculateDailyFoodXP, calculateDailyTotals, MICRONUTRIENT_ATTRS } from '../../services/gamification/foodScoringService';

const DailyTotalsCard = ({ logs, goals, getFoodById }) => {
    // Calculate daily totals including micronutrients
    const totals = calculateDailyTotals(logs, getFoodById);
    
    // Calculate daily food XP
    const dailyXP = calculateDailyFoodXP(logs, getFoodById, goals);
    
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

    // Get micronutrients that have values
    const micronutrientsWithValues = Object.entries(totals.micronutrients || {})
        .filter(([label, value]) => value > 0)
        .sort((a, b) => b[1] - a[1]) // Sort by value descending
        .slice(0, 5); // Show top 5

    // Helper to get micronutrient info
    const getMicronutrientInfo = (label) => {
        return MICRONUTRIENT_ATTRS.find(attr => attr.label === label);
    };

    return (
        <Card className="mb-4">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Daily Totals</CardTitle>
                {dailyXP.totalXP > 0 && (
                    <div className="text-sm text-muted-foreground">
                        Today's Food XP: <span className="font-semibold text-primary">+{dailyXP.totalXP}</span>
                    </div>
                )}
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
                
                {/* Micronutrients Section */}
                {micronutrientsWithValues.length > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3">Top Micronutrients</h4>
                        <div className="space-y-2">
                            {micronutrientsWithValues.map(([label, value]) => {
                                const info = getMicronutrientInfo(label);
                                let displayValue = value;
                                if (info && (info.unit === 'mg' || info.unit === 'mcg' || info.unit === 'IU')) {
                                    displayValue = value < 10 ? value.toFixed(1) : Math.round(value);
                                }
                                let percent = undefined;
                                if (info && info.rdv) {
                                    percent = Math.round((value / info.rdv) * 100);
                                }
                                return (
                                    <div key={label} className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-medium">
                                            {displayValue}{info ? ` ${info.unit}` : ''}
                                            {percent !== undefined ? ` (${percent}%)` : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DailyTotalsCard; 