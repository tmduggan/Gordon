# TypeScript Migration Plan

## Overview
This document tracks the gradual migration from JavaScript to TypeScript for the Gordon app.

## Migration Strategy
- **Gradual migration**: Allow JS and TS files to coexist
- **Service-first approach**: Convert pure functions first (easier to type)
- **Backward compatibility**: Maintain existing APIs during migration
- **Incremental commits**: Small, focused changes with clear commit messages

## Progress Tracking

### ✅ Phase 1: Setup & Configuration (COMPLETED)
- [x] Enhanced TypeScript configuration (`tsconfig.json`)
- [x] Installed TypeScript dependencies (`@types/react`, `@types/react-dom`, `@types/node`)
- [x] Created central types file (`src/types/index.ts`)
- [x] Set up gradual migration (allow JS and TS files to coexist)

### 🔄 Phase 2: Core Infrastructure (IN PROGRESS)
- [x] **Services** - Convert pure function services
  - [x] `src/services/exercise/exerciseService.js` → `exerciseService.ts`
  - [ ] `src/services/gamification/levelService.js` → `levelService.ts`
  - [ ] `src/services/gamification/exerciseScoringService.js` → `exerciseScoringService.ts`
  - [ ] `src/services/gamification/exerciseBestsService.js` → `exerciseBestsService.ts`
  - [ ] `src/services/gamification/suggestionService.js` → `suggestionService.ts`
  - [ ] `src/services/foodService.js` → `foodService.ts`
  - [ ] `src/services/svgMappingService.js` → `svgMappingService.ts`

- [ ] **Utils** - Convert utility functions
  - [ ] `src/utils/dataUtils.js` → `dataUtils.ts`
  - [ ] `src/utils/timeUtils.js` → `timeUtils.ts`
  - [ ] `src/utils/muscleMapping.js` → `muscleMapping.ts`
  - [ ] `src/utils/iconMappings.js` → `iconMappings.ts`

### ⏳ Phase 3: Hooks & State Management (PENDING)
- [ ] **Hooks** - Convert React hooks
  - [ ] `src/hooks/useExerciseLogging.js` → `useExerciseLogging.ts`
  - [ ] `src/hooks/useFoodLogging.js` → `useFoodLogging.ts`
  - [ ] `src/hooks/useCart.js` → `useCart.ts`
  - [ ] `src/hooks/useHistory.js` → `useHistory.ts`
  - [ ] `src/hooks/useLibrary.js` → `useLibrary.ts`
  - [ ] `src/hooks/useScoreProgress.js` → `useScoreProgress.ts`

- [ ] **Store** - Convert state management
  - [ ] `src/store/useAuthStore.js` → `useAuthStore.ts`
  - [ ] `src/store/useExerciseLogStore.js` → `useExerciseLogStore.ts`

### ⏳ Phase 4: Components (PENDING)
- [ ] **Shared Components** - Convert reusable components
  - [ ] `src/components/shared/Cart/CartContainer.jsx` → `CartContainer.tsx`
  - [ ] `src/components/shared/Search/ExerciseSearch.jsx` → `ExerciseSearch.tsx`
  - [ ] `src/components/shared/Search/FoodSearch.jsx` → `FoodSearch.tsx`
  - [ ] `src/components/shared/HistoryView.jsx` → `HistoryView.tsx`

- [ ] **Feature Components** - Convert feature-specific components
  - [ ] `src/components/exercise/ExerciseDisplay.jsx` → `ExerciseDisplay.tsx`
  - [ ] `src/components/exercise/WorkoutSuggestions.jsx` → `WorkoutSuggestions.tsx`
  - [ ] `src/components/nutrition/DailySummary.jsx` → `DailySummary.tsx`
  - [ ] `src/components/gamification/LevelDisplay.jsx` → `LevelDisplay.tsx`

- [ ] **Pages** - Convert main page components
  - [ ] `src/pages/ExercisePage.jsx` → `ExercisePage.tsx`
  - [ ] `src/pages/FoodPage.jsx` → `FoodPage.tsx`
  - [ ] `src/pages/MainPage.jsx` → `MainPage.tsx`

### ⏳ Phase 5: Testing & Polish (PENDING)
- [ ] **Tests** - Convert test files
  - [ ] `src/hooks/__tests__/useExerciseLogging.test.js` → `useExerciseLogging.test.ts`
  - [ ] `src/services/__tests__/exerciseScoringService.test.js` → `exerciseScoringService.test.ts`
  - [ ] `src/utils/__tests__/dataUtils.test.js` → `dataUtils.test.ts`

- [ ] **Configuration** - Final configuration updates
  - [ ] Update ESLint configuration for TypeScript
  - [ ] Update Prettier configuration for TypeScript
  - [ ] Update Vite configuration if needed

## Type Definitions

### Core Types (✅ COMPLETED)
- `UserProfile` - User profile data structure
- `Exercise` - Exercise data structure
- `WorkoutData` - Workout input data
- `ExerciseLog` - Exercise log entry
- `Food` - Food data structure
- `FoodLog` - Food log entry
- `LaggingMuscle` - Gamification muscle tracking
- `WorkoutSuggestion` - AI workout suggestions
- `LevelData` - Level and XP data
- `CartItem` - Shopping cart items
- `SearchFilters` - Search filter options

### Hook Return Types (✅ COMPLETED)
- `UseExerciseLoggingReturn` - Exercise logging hook return type
- `UseCartReturn` - Cart hook return type

### Component Prop Types (✅ COMPLETED)
- `ExerciseDisplayProps` - Exercise display component props
- `LevelDisplayProps` - Level display component props

## Migration Guidelines

### File Conversion Process
1. **Copy the file** with `.ts` or `.tsx` extension
2. **Add type imports** from `src/types/index.ts`
3. **Add type annotations** to function parameters and return types
4. **Fix any type errors** that arise
5. **Update imports** in other files if needed
6. **Delete the old file** once conversion is complete
7. **Test** that everything still works

### Type Annotation Patterns
```typescript
// Function with explicit types
export function calculateExerciseScore(
  workoutData: WorkoutData,
  exerciseDetails: Exercise
): number {
  // Implementation
}

// React component with props
interface MyComponentProps {
  data: SomeType;
  onAction: (id: string) => void;
}

export default function MyComponent({ data, onAction }: MyComponentProps) {
  // Implementation
}

// Hook with return type
export default function useMyHook(): UseMyHookReturn {
  // Implementation
}
```

### Common Type Patterns
```typescript
// Optional properties
interface UserProfile {
  id?: string;
  email: string;
}

// Union types
type ExerciseType = 'strength' | 'cardio' | 'flexibility';

// Record types for objects
type MuscleReps = Record<string, number>;

// Array types
type ExerciseList = Exercise[];

// Function types
type ExerciseHandler = (exercise: Exercise) => void;
```

## Benefits Achieved

### Type Safety
- ✅ Catch errors at compile time instead of runtime
- ✅ Better IntelliSense and autocomplete
- ✅ Refactoring confidence

### Developer Experience
- ✅ Better code documentation through types
- ✅ Easier to understand function signatures
- ✅ Improved IDE support

### Maintainability
- ✅ Self-documenting code
- ✅ Easier to refactor safely
- ✅ Better team collaboration

## Next Steps

1. **Continue with Phase 2**: Convert remaining services
2. **Address TypeScript errors**: Fix existing type issues in UI components
3. **Convert utilities**: Move to Phase 2 utils conversion
4. **Update documentation**: Keep this plan updated as we progress

## Notes

- **Backward compatibility**: All existing JavaScript files continue to work
- **Gradual migration**: Can switch between JS and TS files seamlessly
- **No breaking changes**: All existing APIs remain the same
- **Performance**: TypeScript is compiled away, no runtime overhead 