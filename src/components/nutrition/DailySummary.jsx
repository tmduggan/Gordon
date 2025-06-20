import React from 'react';

const renderProgressBar = (label, value, goal) => {
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
            <div className="text-right text-xs mt-1 text-gray-500">
                {percentage.toFixed(1)}%
            </div>
        </div>
    );
};

export default function DailySummary({ dailyTotals, goals }) {
    if (!dailyTotals) return null;

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Daily Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderProgressBar("calories", dailyTotals.calories, goals.calories)}
                {renderProgressBar("fat", dailyTotals.fat, goals.fat)}
                {renderProgressBar("carbs", dailyTotals.carbs, goals.carbs)}
                {renderProgressBar("protein", dailyTotals.protein, goals.protein)}
                {renderProgressBar("fiber", dailyTotals.fiber, goals.fiber)}
            </div>
        </div>
    );
} 