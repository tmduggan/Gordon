import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React from 'react';
import {
  calculateDailyFoodXP,
  calculateDailyTotals,
  MICRONUTRIENT_ATTRS,
} from '../../services/gamification/foodScoringService';
import { getFoodMacros } from '../../utils/dataUtils';

const DailyTotalsCard = ({ logs, goals, getFoodById }) => {
  // Calculate daily totals including micronutrients
  const totals = calculateDailyTotals(logs, getFoodById);

  // Calculate daily food XP
  const dailyXP = calculateDailyFoodXP(logs, getFoodById, goals);

  const macroBars = [
    {
      key: 'calories',
      label: '🔥 Calories',
      goal: goals.calories,
      color: 'bg-primary',
    },
    {
      key: 'protein',
      label: '🥩 Protein',
      goal: goals.protein,
      color: 'bg-status-success',
    },
    {
      key: 'carbs',
      label: '🍞 Carbs',
      goal: goals.carbs,
      color: 'bg-equipment',
    },
    {
      key: 'fat',
      label: '🥑 Fat',
      goal: goals.fat,
      color: 'bg-status-warning',
    },
    {
      key: 'fiber',
      label: '🌱 Fiber',
      goal: goals.fiber,
      color: 'bg-status-success',
    },
  ];

  const MacroProgress = ({ config, value, goal }) => {
    const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    const isOver = value > goal;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(value)} / {goal}
            {config.key === 'calories' ? '' : 'g'}
          </span>
        </div>
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(percentage)}%</span>
            {isOver && (
              <span className="text-red-500">
                +{Math.round(value - goal)}
                {config.key === 'calories' ? '' : 'g'}
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
    return MICRONUTRIENT_ATTRS.find((attr) => attr.label === label);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <CardTitle className="text-lg">Daily Totals</CardTitle>
        {dailyXP.totalXP > 0 && (
          <div className="text-sm text-muted-foreground whitespace-nowrap mt-1 ml-4">
            Today's Food XP:{' '}
            <span className="font-semibold text-primary">
              +{dailyXP.totalXP}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {macroBars.map((config) => (
          <MacroProgress
            key={config.key}
            config={config}
            value={totals[config.key]}
            goal={config.goal}
          />
        ))}

        {/* Micronutrients Section */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Micronutrients</h4>
          <div className="space-y-1">
            {(() => {
              const seen = new Set();
              return MICRONUTRIENT_ATTRS.filter((info) => {
                if (seen.has(info.label)) return false;
                seen.add(info.label);
                return true;
              }).map((info) => {
                const value = totals.micronutrients[info.label] || 0;
                let displayValue = value;
                if (
                  info.unit === 'mg' ||
                  info.unit === 'mcg' ||
                  info.unit === 'IU'
                ) {
                  displayValue =
                    value < 10 ? value.toFixed(1) : Math.round(value);
                }
                let percent = undefined;
                if (info.rdv) {
                  percent = Math.round((value / info.rdv) * 100);
                }
                return (
                  <div
                    key={info.label}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-muted-foreground">{info.label}</span>
                    <span className="font-medium">
                      {displayValue}
                      {` ${info.unit}`}
                      {percent !== undefined ? ` (${percent}%)` : ''}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTotalsCard;
