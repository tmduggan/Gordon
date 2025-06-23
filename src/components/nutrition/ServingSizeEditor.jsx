import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * A component for selecting a serving size and quantity for a food item.
 * It calculates the scaled nutritional information based on user input.
 *
 * @param {object} food - The food item, containing nutrition facts and serving measures.
 * @param {function} onUpdate - Callback that returns the new quantity, units, and scaled nutrition.
 */
const ServingSizeEditor = ({ food, onUpdate }) => {
    // Default to the food's serving_qty and serving_unit, fallback to 1 and 'g' if not available
    const [quantity, setQuantity] = useState(food.serving_qty || 1);
    const [unit, setUnit] = useState(food.serving_unit || 'g');

    // Calculate macros per gram once
    const macrosPerGram = useMemo(() => {
        const servingWeightGrams = food.serving_weight_grams || 1;
        const macros = food.nutritionix_data || food.nutrition || food;
        
        return {
            calories: (macros.nf_calories || macros.calories || 0) / servingWeightGrams,
            fat: (macros.nf_total_fat || macros.fat || 0) / servingWeightGrams,
            carbs: (macros.nf_total_carbohydrate || macros.carbs || 0) / servingWeightGrams,
            protein: (macros.nf_protein || macros.protein || 0) / servingWeightGrams,
            fiber: (macros.nf_dietary_fiber || macros.fiber || 0) / servingWeightGrams,
        };
    }, [food]);

    // Get all available units (base unit + alt_measures + grams)
    const availableUnits = useMemo(() => {
        const units = new Set();
        
        // Add base unit
        if (food.serving_unit) {
            units.add(food.serving_unit);
        }
        
        // Add grams
        units.add('g');
        
        // Add alt_measures
        if (food.alt_measures) {
            food.alt_measures.forEach(measure => {
                if (measure.measure) {
                    units.add(measure.measure);
                }
            });
        }
        
        return Array.from(units).sort();
    }, [food]);

    // Convert any unit to grams
    const convertToGrams = (qty, unit) => {
        if (unit === 'g') {
            return qty;
        }
        
        // Check if it's the base unit
        if (unit === food.serving_unit) {
            // For base unit, use the serving_weight_grams directly
            return (food.serving_weight_grams / (food.serving_qty || 1)) * qty;
        }
        
        // Check alt_measures
        if (food.alt_measures) {
            const alt = food.alt_measures.find(m => m.measure === unit);
            if (alt) {
                return (alt.serving_weight / alt.qty) * qty;
            }
        }
        
        // Fallback: treat as base unit
        return (food.serving_weight_grams / (food.serving_qty || 1)) * qty;
    };

    // Calculate scaled nutrition
    const getScaledNutrition = (qty, unit) => {
        const grams = convertToGrams(qty, unit);
        
        const safe = v => (isFinite(v) && !isNaN(v)) ? Math.round(v * 100) / 100 : 0;
        
        return {
            calories: safe(macrosPerGram.calories * grams),
            fat: safe(macrosPerGram.fat * grams),
            carbs: safe(macrosPerGram.carbs * grams),
            protein: safe(macrosPerGram.protein * grams),
            fiber: safe(macrosPerGram.fiber * grams),
        };
    };

    const handleQuantityChange = (e) => {
        const newQuantity = parseFloat(e.target.value) || 0;
        setQuantity(newQuantity);
        if (onUpdate) {
            onUpdate({
                quantity: newQuantity,
                units: unit,
                scaledNutrition: getScaledNutrition(newQuantity, unit)
            });
        }
    };

    const handleUnitChange = (newUnit) => {
        setUnit(newUnit);
        if (onUpdate) {
            onUpdate({
                quantity,
                units: newUnit,
                scaledNutrition: getScaledNutrition(quantity, newUnit)
            });
        }
    };

    return (
        <div className="flex items-center gap-1">
            <Input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-20"
                min="0"
                step="0.1"
            />
            <Select value={unit} onValueChange={handleUnitChange}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                    {availableUnits.map(unitOption => (
                        <SelectItem key={unitOption} value={unitOption}>
                            {unitOption}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default ServingSizeEditor; 