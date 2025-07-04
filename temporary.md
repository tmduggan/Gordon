[user query]
Are there well defined formulas to determine a recommended calorie and macronutrient breakdown for a user based on age, height, weight, body fat, and activity level?

e.g. 24 year old female, 5'4", 110 lbs, 22% body fat, Moderately Active (3-4x of high activity per week)

That we could use to determine a user's goals based on their stats?
[/user query]


[Cursor:]

I'll help you find information about calorie and macronutrient calculation formulas. Let me search through your codebase to see if there are any existing implementations, and then provide you with the well-established formulas.

Search files...
Search files...
Based on my search through your codebase, I can see that you currently have a nutrition tracking system with manual goal setting, but no automatic calculation of recommended calories and macronutrients based on user stats. Let me provide you with the well-established formulas for calculating BMR (Basal Metabolic Rate), TDEE (Total Daily Energy Expenditure), and macronutrient breakdowns.

## Well-Defined Formulas for Calorie and Macronutrient Calculations

### 1. **BMR (Basal Metabolic Rate) Calculations**

There are several established formulas, with the **Mifflin-St Jeor Equation** being the most accurate for most people:

**Mifflin-St Jeor Equation:**
```
BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5 (for males)
BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161 (for females)
```

**Alternative: Katch-McArdle Formula (if body fat % is known):**
```
BMR = 370 + (21.6 × lean body mass in kg)
Lean Body Mass = Total Weight × (1 - Body Fat %)
```

### 2. **TDEE (Total Daily Energy Expenditure) Calculation**

Multiply BMR by an activity multiplier:

- **Sedentary** (little or no exercise): BMR × 1.2
- **Lightly Active** (light exercise 1-3 days/week): BMR × 1.375
- **Moderately Active** (moderate exercise 3-5 days/week): BMR × 1.55
- **Very Active** (hard exercise 6-7 days/week): BMR × 1.725
- **Extremely Active** (very hard exercise, physical job): BMR × 1.9

### 3. **Macronutrient Breakdown Recommendations**

**Protein:**
- General: 0.8-1.2g per kg body weight
- Active individuals: 1.2-2.0g per kg body weight
- Bodybuilding/strength training: 1.6-2.2g per kg body weight

**Fat:**
- 20-35% of total calories
- Minimum: 0.8g per kg body weight for essential fatty acids

**Carbohydrates:**
- Remaining calories after protein and fat
- General: 45-65% of total calories
- Low-carb: 20-50% of total calories

### 4. **Example Calculation for Your User**

For a 24-year-old female, 5'4" (162.56 cm), 110 lbs (49.9 kg), 22% body fat, Moderately Active:

**BMR (Mifflin-St Jeor):**
```
BMR = (10 × 49.9) + (6.25 × 162.56) - (5 × 24) - 161
BMR = 499 + 1,016 - 120 - 161
BMR = 1,234 calories
```

**TDEE:**
```
TDEE = 1,234 × 1.55 = 1,913 calories
```

**Macronutrient Breakdown:**
- **Protein:** 1.6g/kg × 49.9kg = **80g** (320 calories, 17%)
- **Fat:** 25% of 1,913 = **53g** (478 calories, 25%)
- **Carbs:** Remaining = **278g** (1,115 calories, 58%)

### 5. **Implementation Recommendations**

You could create a service like this:

```javascript
// src/services/nutrition/calorieCalculator.js
export function calculateNutritionGoals(userStats) {
  const { age, gender, height, weight, bodyFat, activityLevel } = userStats;
  
  // Convert height to cm if in feet/inches
  const heightCm = convertHeightToCm(height);
  const weightKg = convertWeightToKg(weight);
  
  // Calculate BMR
  const bmr = calculateBMR(age, gender, heightCm, weightKg);
  
  // Calculate TDEE
  const tdee = calculateTDEE(bmr, activityLevel);
  
  // Calculate macronutrients
  const macros = calculateMacros(tdee, weightKg, bodyFat);
  
  return {
    calories: Math.round(tdee),
    protein: Math.round(macros.protein),
    carbs: Math.round(macros.carbs),
    fat: Math.round(macros.fat),
    fiber: Math.round(tdee / 1000 * 14) // 14g per 1000 calories
  };
}
```

This would allow you to automatically generate personalized nutrition goals based on user stats, which could be a great feature for your app's user onboarding and goal-setting process.