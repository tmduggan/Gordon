# Core Logic Configuration

This directory contains all the **"Core Logic"** or **"Gameplay Logic"** that makes your fitness app engaging and fun. These are the algorithms and rules that determine:

- How XP is calculated
- How levels progress
- How AI responds
- What makes the app "fun"

## Files Overview

### `ai-prompts.ts`
**Purpose**: All AI/LLM prompts used throughout the app
**What to modify**: 
- Change prompt text to adjust AI personality/behavior
- Add new prompt types
- Modify AI model settings

**Example changes**:
```typescript
// Make AI more encouraging
workoutSuggestion: `
  You are an enthusiastic personal trainer! Be super motivating and encouraging...
`

// Add new prompt type
mealPlanning: `
  You are a meal planning expert...
`
```

### `gamification.ts`
**Purpose**: All XP, leveling, and scoring algorithms
**What to modify**:
- Adjust XP multipliers and bonuses
- Change level progression speed
- Modify streak rewards
- Add new achievement types

**Example changes**:
```typescript
// Make leveling faster
baseXPPerLevel: 500, // Was 1000

// Increase personal best bonus
personalBestBonuses: {
  allTime: 10, // Was 4
  year: 6,     // Was 3
}

// Add new exercise type
exerciseTypeMultipliers: {
  yoga: 0.9,   // New type
  compound: 1.2,
  // ...
}
```

## How to Modify Safely

### 1. **Never touch the function signatures**
The functions are used throughout the app, so changing parameters will break things.

### 2. **Only modify the configuration objects**
These are marked with `as const` and contain all the "tunable" values:

```typescript
// ✅ SAFE - Modify these values
export const EXERCISE_XP_CONFIG = {
  baseMultiplier: 2, // Change this
  personalBestBonuses: {
    allTime: 4, // Change this
  }
} as const;

// ❌ DANGEROUS - Don't change function names or parameters
export function calculateExerciseXP(
  workoutData: WorkoutData, // Don't change this
  exercise: Exercise,       // Don't change this
  // ...
) {
  // Don't change the function structure
}
```

### 3. **Test your changes**
After modifying values, test the app to ensure:
- XP calculations still work
- Levels progress correctly
- AI responses are appropriate

## Terminology

- **Core Logic**: The heart of what makes your app engaging
- **Gameplay Logic**: The rules and algorithms that drive user engagement
- **Business Rules**: The specific calculations and decisions that determine outcomes
- **Infrastructure**: Everything else (UI, data, routing, etc.)

## Quick Reference

| What you want to change | File to modify | What to look for |
|------------------------|----------------|------------------|
| AI personality/behavior | `ai-prompts.ts` | `AI_PROMPTS` object |
| Exercise XP amounts | `gamification.ts` | `EXERCISE_XP_CONFIG` |
| Food XP amounts | `gamification.ts` | `FOOD_XP_CONFIG` |
| Level progression speed | `gamification.ts` | `LEVEL_CONFIG` |
| Streak rewards | `gamification.ts` | `STREAK_CONFIG` |
| AI model settings | `ai-prompts.ts` | `AI_CONFIG` |

## Best Practices

1. **Make small, incremental changes** - Test each change
2. **Document your changes** - Add comments explaining why you changed values
3. **Consider user impact** - Will this make the app more or less engaging?
4. **Balance is key** - Don't make rewards too easy or too hard to earn
5. **Test with real users** - Get feedback on how changes feel

## Example: Making the App More Rewarding

```typescript
// In gamification.ts
export const EXERCISE_XP_CONFIG = {
  baseMultiplier: 3, // Was 2 - 50% more XP
  personalBestBonuses: {
    allTime: 8,  // Was 4 - Double the bonus
    year: 6,     // Was 3 - More rewarding
    month: 4,    // Was 2 - More rewarding
    week: 2,     // Was 1 - More rewarding
  },
  // ...
} as const;
```

This would make the app more rewarding by giving users more XP for their efforts, potentially increasing engagement. 