import React, { useState, useEffect, useMemo, useRef } from 'react';

/**
 * A component for selecting a serving size and quantity for a food item.
 * It calculates the scaled nutritional information based on user input.
 *
 * @param {object} food - The food item, containing nutrition facts and serving measures.
 * @param {function} onChange - Callback that returns the new quantity, units, and scaled nutrition.
 */
const ServingSizeEditor = ({ food, onChange }) => {
    const servingOptions = useMemo(() => {
        const options = [];
        // The default/primary serving unit for the food.
        if (food.serving_unit && food.serving_weight_grams) {
            options.push({
                measure: food.serving_unit,
                // The weight of a SINGLE unit of this measure in grams.
                weight: food.serving_weight_grams / food.serving_qty,
            });
        }
        // Alternative measures from the food data.
        if (food.alt_measures) {
            food.alt_measures.forEach(alt => {
                // Ensure no duplicate measures and that the measure has a valid weight.
                if (!options.some(opt => opt.measure === alt.measure) && alt.serving_weight && alt.qty) {
                    options.push({
                        measure: alt.measure,
                        // The weight of a SINGLE unit of this measure in grams.
                        weight: alt.serving_weight / alt.qty,
                    });
                }
            });
        }
        return options;
    }, [food]);

    const [quantity, setQuantity] = useState(food.serving_qty || 1);
    const [selectedUnit, setSelectedUnit] = useState(food.serving_unit || (servingOptions.length > 0 ? servingOptions[0].measure : ''));
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const selectedOption = servingOptions.find(opt => opt.measure === selectedUnit);
        
        if (!selectedOption || !food.serving_weight_grams) {
            return;
        }

        const baseServingWeight = food.serving_weight_grams / food.serving_qty;
        const totalGramWeight = selectedOption.weight * quantity;
        const scale = totalGramWeight / baseServingWeight;

        const scaledNutrition = {
            calories: parseFloat(((food.nf_calories || 0) * scale).toFixed(1)),
            fat: parseFloat(((food.nf_total_fat || 0) * scale).toFixed(1)),
            carbs: parseFloat(((food.nf_total_carbohydrate || 0) * scale).toFixed(1)),
            protein: parseFloat(((food.nf_protein || 0) * scale).toFixed(1)),
            fiber: parseFloat(((food.nf_dietary_fiber || 0) * scale).toFixed(1)),
        };
        
        onChange({
            quantity,
            units: selectedUnit,
            scaledNutrition,
        });

    }, [quantity, selectedUnit, onChange]);
    
    const handleQuantityChange = (e) => {
        setQuantity(parseFloat(e.target.value) || 0);
    };

    const handleUnitChange = (e) => {
        const newUnit = e.target.value;
        const oldUnit = selectedUnit;

        const oldOption = servingOptions.find(opt => opt.measure === oldUnit);
        const newOption = servingOptions.find(opt => opt.measure === newUnit);

        if (oldOption && newOption && oldOption.weight && newOption.weight > 0) {
            // Convert the quantity based on the gram weight of the old and new units.
            const newQuantity = (quantity * oldOption.weight) / newOption.weight;
            setQuantity(parseFloat(newQuantity.toFixed(2)));
        }
        
        setSelectedUnit(newUnit);
    };

    if (servingOptions.length === 0) {
        return <span>No serving info available.</span>
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-20 p-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.25"
            />
            <select
                value={selectedUnit}
                onChange={handleUnitChange}
                className="p-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                {servingOptions.map(opt => (
                    <option key={opt.measure} value={opt.measure}>
                        {opt.measure}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ServingSizeEditor; 