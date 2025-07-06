import React, { useState } from 'react';
import { getFoodMacros } from '../../utils/dataUtils';
import { ChevronDown, ChevronRight } from 'lucide-react';

const Fact = ({ label, value, percent, indent = false, isBold = false }: { label: any; value: any; percent?: any; indent?: boolean; isBold?: boolean }) => (
  <div
    className={`flex justify-between py-0.5 border-t border-gray-400 ${indent ? 'pl-4' : ''}`}
  >
    <span className={isBold ? 'font-bold' : ''}>{label}</span>
    <span>
      {value}
      {percent !== undefined && (
        <span className="text-xs text-gray-500 ml-1">{percent}%</span>
      )}
    </span>
  </div>
);

// FDA Daily Values for adults/children 4+ (2024)
// https://www.accessdata.fda.gov/scripts/interactivenutritionfactslabel/daily-values.html
const MICRONUTRIENT_ATTRS = [
  { attr_id: 301, label: 'Calcium', unit: 'mg', rdv: 1300 },
  { attr_id: 303, label: 'Iron', unit: 'mg', rdv: 18 },
  { attr_id: 306, label: 'Potassium', unit: 'mg', rdv: 4700 },
  { attr_id: 401, label: 'Vitamin C', unit: 'mg', rdv: 90 },
  { attr_id: 328, label: 'Vitamin D', unit: 'IU', rdv: 800 }, // 20mcg = 800 IU
  { attr_id: 324, label: 'Vitamin D', unit: 'mcg', rdv: 20 },
  { attr_id: 430, label: 'Vitamin K', unit: 'mcg', rdv: 120 },
  { attr_id: 418, label: 'Vitamin B12', unit: 'mcg', rdv: 2.4 },
  { attr_id: 404, label: 'Thiamin (B1)', unit: 'mg', rdv: 1.2 },
  { attr_id: 405, label: 'Riboflavin (B2)', unit: 'mg', rdv: 1.3 },
  { attr_id: 406, label: 'Niacin (B3)', unit: 'mg', rdv: 16 },
  { attr_id: 415, label: 'Vitamin B6', unit: 'mg', rdv: 1.7 },
  { attr_id: 417, label: 'Folate (B9)', unit: 'mcg', rdv: 400 },
  { attr_id: 320, label: 'Vitamin A', unit: 'IU', rdv: 5000 },
  { attr_id: 318, label: 'Vitamin A', unit: 'IU', rdv: 5000 },
  { attr_id: 851, label: 'Vitamin A (RAE)', unit: 'mcg', rdv: 900 },
  { attr_id: 573, label: 'Retinol', unit: 'mcg', rdv: undefined },
  { attr_id: 578, label: 'Vitamin E', unit: 'mg', rdv: 15 },
  { attr_id: 309, label: 'Zinc', unit: 'mg', rdv: 11 },
  { attr_id: 312, label: 'Copper', unit: 'mg', rdv: 0.9 },
  { attr_id: 315, label: 'Manganese', unit: 'mg', rdv: 2.3 },
  { attr_id: 317, label: 'Selenium', unit: 'mcg', rdv: 55 },
  { attr_id: 421, label: 'Choline', unit: 'mg', rdv: 550 },
];

// Helper to get value from full_nutrients by attr_id
function getNutrientValue(full_nutrients: any[], attr_id: any) {
  if (!Array.isArray(full_nutrients)) return 0;
  const n = full_nutrients.find((n) => n.attr_id === attr_id);
  return n ? n.value : 0;
}

const NutritionLabel = ({ food }: { food: any }) => {
  if (!food) return null;

  const [showMicros, setShowMicros] = useState(false);

  const macros = getFoodMacros(food);
  // The raw data might be nested differently depending on the source (user-added vs. API)
  const data = food.nutritionix_data || food.nutrition || food;
  const full_nutrients = data.full_nutrients || [];

  // Collect micronutrients with value > 0
  const micronutrientRows = MICRONUTRIENT_ATTRS.map(
    ({ attr_id, label, unit, rdv }) => {
      const value = getNutrientValue(full_nutrients, attr_id);
      if (value && value > 0) {
        // Round for display
        let displayValue = value;
        if (unit === 'mg' || unit === 'mcg' || unit === 'IU') {
          displayValue = value < 10 ? value.toFixed(1) : Math.round(value);
        }
        // Calculate %DV if RDV is available
        let percent = undefined;
        if (rdv) {
          percent = Math.round((value / rdv) * 100);
        }
        return (
          <Fact
            key={attr_id}
            label={label}
            value={`${displayValue}${unit}`}
            percent={percent}
          />
        );
      }
      return null;
    }
  ).filter(Boolean);

  return (
    <div className="w-64 p-2 bg-white text-black border-2 border-black font-sans text-sm rounded-md">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Nutrition Facts
      </h1>
      <div className="border-b-4 border-black -mx-2"></div>
      {food.serving_qty && (
        <div className="py-1">
          <p>
            Serving Size: {food.serving_qty} {food.serving_unit} (
            {food.serving_weight_grams}g)
          </p>
        </div>
      )}
      <div className="flex justify-between items-baseline border-b-8 border-black py-1 -mx-2 px-2">
        <p className="font-bold text-base">Calories</p>
        <p className="text-3xl font-extrabold">{macros.calories}</p>
      </div>

      <Fact label="Total Fat" value={`${macros.fat}g`} percent={undefined} isBold />
      <Fact
        label="Saturated Fat"
        value={`${Math.round(data.nf_saturated_fat || 0)}g`}
        percent={undefined}
        indent
      />

      <Fact
        label="Sodium"
        value={`${Math.round(data.nf_sodium || 0)}mg`}
        percent={undefined}
        isBold
      />

      <Fact label="Total Carbohydrate" value={`${macros.carbs}g`} percent={undefined} isBold />
      <Fact label="Dietary Fiber" value={`${macros.fiber}g`} percent={undefined} indent />
      <Fact
        label="Total Sugars"
        value={`${Math.round(data.nf_sugars || 0)}g`}
        percent={undefined}
        indent
      />

      <Fact label="Protein" value={`${macros.protein}g`} percent={undefined} isBold />

      {/* Micronutrients Section */}
      <div className="border-t-2 border-black mt-2 mb-1 flex items-center cursor-pointer select-none" onClick={() => setShowMicros((v) => !v)}>
        <span className="font-semibold text-xs mb-1 flex items-center gap-1">
          {showMicros ? <ChevronDown className="inline w-4 h-4" /> : <ChevronRight className="inline w-4 h-4" />}
          Micronutrients
        </span>
      </div>
      {showMicros && micronutrientRows.length > 0 && (
        <div className="mb-1">{micronutrientRows}</div>
      )}
      <div className="border-t-8 border-black mt-1 -mx-2"></div>
    </div>
  );
};

export default NutritionLabel;
