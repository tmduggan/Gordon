import React from 'react';
import { getFoodMacros } from '../../utils/dataUtils';

const Fact = ({ label, value, indent = false, isBold = false }) => (
    <div className={`flex justify-between py-0.5 border-t border-gray-400 ${indent ? 'pl-4' : ''}`}>
        <span className={isBold ? 'font-bold' : ''}>{label}</span>
        <span>{value}</span>
    </div>
);

const NutritionLabel = ({ food }) => {
    if (!food) return null;

    const macros = getFoodMacros(food);
    // The raw data might be nested differently depending on the source (user-added vs. API)
    const data = food.nutritionix_data || food.nutrition || food;

    return (
        <div className="w-64 p-2 bg-white text-black border-2 border-black font-sans text-sm rounded-md">
            <h1 className="text-2xl font-extrabold tracking-tight">Nutrition Facts</h1>
            <div className="border-b-4 border-black -mx-2"></div>
            {food.serving_qty && (
                <div className="py-1">
                    <p>Serving Size: {food.serving_qty} {food.serving_unit} ({food.serving_weight_grams}g)</p>
                </div>
            )}
            <div className="flex justify-between items-baseline border-b-8 border-black py-1 -mx-2 px-2">
                <p className="font-bold text-base">Calories</p>
                <p className="text-3xl font-extrabold">{macros.calories}</p>
            </div>
            
            <Fact label="Total Fat" value={`${macros.fat}g`} isBold />
            <Fact label="Saturated Fat" value={`${Math.round(data.nf_saturated_fat || 0)}g`} indent />

            <Fact label="Sodium" value={`${Math.round(data.nf_sodium || 0)}mg`} isBold />
            
            <Fact label="Total Carbohydrate" value={`${macros.carbs}g`} isBold />
            <Fact label="Dietary Fiber" value={`${macros.fiber}g`} indent />
            <Fact label="Total Sugars" value={`${Math.round(data.nf_sugars || 0)}g`} indent />

            <Fact label="Protein" value={`${macros.protein}g`} isBold />
            
            <div className="border-t-8 border-black mt-1 -mx-2"></div>
        </div>
    );
};

export default NutritionLabel; 