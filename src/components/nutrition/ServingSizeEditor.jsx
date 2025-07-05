import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useEffect, useMemo, useState } from 'react';
import { convertToGrams } from '../../utils/dataUtils';

/**
 * A component for selecting a serving size and quantity for a food item.
 * It calculates the scaled nutritional information based on user input.
 *
 * @param {object} food - The food item, containing nutrition facts and serving measures.
 * @param {function} onUpdate - Callback that returns the new quantity, units, and scaled nutrition.
 */
const ServingSizeEditor = ({ food, onUpdate }) => {
  // Store quantity as a string to allow empty input
  const [quantity, setQuantity] = useState(
    (food.quantity !== undefined
      ? food.quantity
      : food.serving_qty || 1
    ).toString()
  );
  const [unit, setUnit] = useState(food.units || food.serving_unit || 'g');

  // Sync state with props if food.quantity or food.units change
  useEffect(() => {
    setQuantity(
      (food.quantity !== undefined
        ? food.quantity
        : food.serving_qty || 1
      ).toString()
    );
  }, [food.quantity, food.serving_qty]);
  useEffect(() => {
    setUnit(food.units || food.serving_unit || 'g');
  }, [food.units, food.serving_unit]);

  // Calculate macros per gram once
  const macrosPerGram = useMemo(() => {
    const servingWeightGrams = food.serving_weight_grams;
    const macros = food.nutritionix_data || food.nutrition || food;
    if (!servingWeightGrams) {
      // No weight in grams: treat macros as per serving
      return {
        calories: macros.nf_calories || macros.calories || 0,
        fat: macros.nf_total_fat || macros.fat || 0,
        carbs: macros.nf_total_carbohydrate || macros.carbs || 0,
        protein: macros.nf_protein || macros.protein || 0,
        fiber: macros.nf_dietary_fiber || macros.fiber || 0,
        perServing: true,
      };
    }
    return {
      calories:
        (macros.nf_calories || macros.calories || 0) / servingWeightGrams,
      fat: (macros.nf_total_fat || macros.fat || 0) / servingWeightGrams,
      carbs:
        (macros.nf_total_carbohydrate || macros.carbs || 0) /
        servingWeightGrams,
      protein: (macros.nf_protein || macros.protein || 0) / servingWeightGrams,
      fiber:
        (macros.nf_dietary_fiber || macros.fiber || 0) / servingWeightGrams,
      perServing: false,
    };
  }, [food]);

  // Get all available units (base unit + alt_measures + grams)
  const availableUnits = useMemo(() => {
    const units = new Set();
    // Add base unit
    if (food.serving_unit) {
      units.add(food.serving_unit);
    }
    // Only add grams and alt_measures if we have a valid weight in grams
    if (food.serving_weight_grams) {
      units.add('g');
      if (
        food.alt_measures &&
        Array.isArray(food.alt_measures) &&
        food.alt_measures.length > 0
      ) {
        food.alt_measures.forEach((measure) => {
          if (measure.measure) {
            units.add(measure.measure);
          }
        });
      }
    }
    return Array.from(units).sort();
  }, [food]);

  // Calculate scaled nutrition
  const getScaledNutrition = (qty, unit) => {
    if (macrosPerGram.perServing) {
      // No grams reference: just multiply per serving macros by qty
      const safe = (v) =>
        isFinite(v) && !isNaN(v) ? Math.round(v * 100) / 100 : 0;
      return {
        calories: safe(macrosPerGram.calories * qty),
        fat: safe(macrosPerGram.fat * qty),
        carbs: safe(macrosPerGram.carbs * qty),
        protein: safe(macrosPerGram.protein * qty),
        fiber: safe(macrosPerGram.fiber * qty),
      };
    }
    // Use shared convertToGrams utility
    const grams = convertToGrams(food, qty, unit);
    const safe = (v) =>
      isFinite(v) && !isNaN(v) ? Math.round(v * 100) / 100 : 0;
    return {
      calories: safe(macrosPerGram.calories * grams),
      fat: safe(macrosPerGram.fat * grams),
      carbs: safe(macrosPerGram.carbs * grams),
      protein: safe(macrosPerGram.protein * grams),
      fiber: safe(macrosPerGram.fiber * grams),
    };
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    setQuantity(value);
    // Treat empty string as 0 for calculations
    const parsedQuantity = value === '' ? 0 : parseFloat(value);
    if (onUpdate) {
      onUpdate({
        quantity: parsedQuantity,
        units: unit,
        scaledNutrition: getScaledNutrition(parsedQuantity, unit),
      });
    }
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    if (onUpdate) {
      onUpdate({
        quantity,
        units: newUnit,
        scaledNutrition: getScaledNutrition(quantity, newUnit),
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
          {availableUnits.map((unitOption) => (
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
