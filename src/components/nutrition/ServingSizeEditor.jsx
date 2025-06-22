import React, { useState } from 'react';
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
    const [quantity, setQuantity] = useState(food.quantity || food.serving_qty || 1);
    const [unit, setUnit] = useState(food.serving_unit || 'g');
    
    const servingUnit = food.serving_unit || 'g';
    const servingWeightGrams = food.serving_weight_grams;

    const handleQuantityChange = (e) => {
        const newQuantity = parseFloat(e.target.value) || 0;
        setQuantity(newQuantity);
        onUpdate(newQuantity);
    };

    const handleUnitChange = (newUnit) => {
        setUnit(newUnit);
        // Note: Future work needed to make unit changes affect logged data.
        // Currently, the cart only stores a single `quantity` value.
    };

    return (
        <div className="flex items-center gap-1">
            <Input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-20"
            />
            <Select value={unit} onValueChange={handleUnitChange}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                    {servingWeightGrams && <SelectItem value={servingUnit}>{servingUnit}</SelectItem>}
                    <SelectItem value="g">g</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

export default ServingSizeEditor; 