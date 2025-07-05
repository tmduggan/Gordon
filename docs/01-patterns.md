# Gordon App Patterns & Conventions

## Directory Structure Patterns

### Feature-Based Organization
```
src/
├── components/
│   ├── exercise/          # Exercise-specific UI components
│   ├── nutrition/         # Nutrition-specific UI components
│   ├── gamification/      # XP, Level, Progress UI components
│   ├── profile/           # User profile and settings UI
│   ├── admin/             # Admin-only UI components
│   ├── shared/            # Shared components used across features
│   └── ui/                # Reusable UI components (buttons, modals, etc.)
├── hooks/                 # React hooks for stateful UI logic
├── services/              # Business logic and data operations
├── utils/                 # Pure utility functions
├── store/                 # Global state management
├── firebase/              # Firebase configuration
├── api/                   # External API integrations
└── pages/                 # Main page components
```

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `HistoryView.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useHistory.js`)
- **Services**: camelCase with `Service` suffix (e.g., `exerciseService.js`)
- **Utils**: camelCase (e.g., `dataUtils.js`)

### Functions
- **Components**: PascalCase (e.g., `HistoryView`)
- **Hooks**: camelCase (e.g., `useHistory`)
- **Services**: camelCase (e.g., `calculateExerciseScore`)
- **Utils**: camelCase (e.g., `formatDate`)

## Architecture Patterns

### 1. Separation of Concerns

**Components** (`src/components/`)
- Pure UI components
- No business logic
- Receive props and render UI
- Handle user interactions and call callbacks

**Hooks** (`src/hooks/`)
- Manage UI state and side effects
- Coordinate between components and services
- Handle React lifecycle
- Call services for data operations

**Services** (`src/services/`)
- Pure business logic
- No UI dependencies
- Handle data transformations
- Manage external API calls

**Utils** (`src/utils/`)
- Pure functions
- No side effects
- Stateless helpers
- Data formatting and calculations

### 2. Service Layer Pattern

All business logic is extracted into services:

```javascript
// ❌ Bad: Business logic in component
const calculateScore = (workout) => {
    return workout.sets.reduce((total, set) => total + set.reps, 0);
};

// ✅ Good: Business logic in service
// services/exercise/exerciseService.js
export function calculateExerciseScore(workoutData, exerciseDetails) {
    // Business logic here
}
```

### 3. Hook-Service Pattern

Hooks coordinate between UI and services:

```javascript
// hooks/useExerciseLogging.js
export default function useExerciseLogging() {
    const [state, setState] = useState();
    
    const logExercise = async (exerciseData) => {
        // Call service for business logic
        const score = calculateExerciseScore(exerciseData);
        
        // Call service for data persistence
        await saveWorkoutLog({ ...exerciseData, score });
        
        // Update UI state
        setState(newState);
    };
    
    return { logExercise };
}
```

## Data Flow Pattern

1. **User Interaction** → Component
2. **Component** → Hook (via callback)
3. **Hook** → Service (for business logic)
4. **Service** → Firebase/API (for data)
5. **Service** → Hook (with result)
6. **Hook** → Component (via state update)

## Component Patterns

### 1. Component Purity
Components should be pure and only handle UI logic:

```javascript
// ✅ Good: Pure component
export default function ExerciseCard({ exercise, onSelect }) {
    return (
        <div onClick={() => onSelect(exercise)}>
            <h3>{exercise.name}</h3>
        </div>
    );
}

// ❌ Bad: Component with business logic
export default function ExerciseCard({ exercise }) {
    const score = calculateScore(exercise); // Business logic in component
    return <div>{score}</div>;
}
```

### 2. Service Granularity
Services should be focused and single-purpose:

```javascript
// ✅ Good: Focused service
// services/exercise/exerciseService.js
export function calculateExerciseScore(workoutData, exerciseDetails) {
    // Only exercise scoring logic
}

// ❌ Bad: Monolithic service
// services/exerciseService.js
export function processExercise(workoutData, exerciseDetails, userProfile) {
    // Too many responsibilities
    const score = calculateScore(workoutData);
    const updatedProfile = updateProfile(userProfile);
    const savedData = saveToDatabase(workoutData);
    return { score, updatedProfile, savedData };
}
```

### 3. Hook Responsibilities
Hooks should manage UI state and coordinate services:

```javascript
// ✅ Good: Hook coordinates services
export default function useExerciseLogging() {
    const [loading, setLoading] = useState(false);
    
    const logExercise = async (exerciseData) => {
        setLoading(true);
        try {
            const score = calculateExerciseScore(exerciseData);
            await saveWorkoutLog({ ...exerciseData, score });
        } finally {
            setLoading(false);
        }
    };
    
    return { logExercise, loading };
}
```

## Migration Pattern

When adding new features:

1. **Create service** for business logic
2. **Create hook** for state management
3. **Create component** for UI
4. **Update imports** to use new structure
5. **Test** each layer independently

## Exercise XP Calculation Pattern

The canonical algorithm for calculating XP (score) for exercise logs:

- For each set:
  - If `weight > 0`: XP = reps * weight * 0.1
  - If `weight == 0` and `reps > 0`: XP = reps * 1 (bodyweight/rep-only exercises)
- For duration-based (cardio) exercises:
  - XP = duration (in minutes) * 2
- The total XP for a workout is the sum of all set and duration XP, rounded to the nearest integer.
- Bonuses (e.g., for personal bests, lagging muscles) may be added on top of this base XP.

This algorithm is implemented in `src/services/exercise/exerciseService.js` in the `calculateExerciseScore` function.

## Database Structure Patterns

### User Document Path
- Collection: `users`
- Document: `[userId]` (auto-generated or Firebase Auth UID)

### Exercise Logs Pattern
- **Path:** `users/[userId]/workoutLog/[logId]`
- **Required fields:**
  - `duration`: number | null
  - `exerciseId`: string
  - `recordedTime`: timestamp (when the log was created)
  - `score`: number
  - `sets`: array | null (for strength exercises)
  - `timestamp`: timestamp (when the exercise was performed)
  - `userId`: string (redundant, but present)

### Food Logs Pattern
- **Path:** `users/[userId]/foodLog/[logId]`
- **Required fields:**
  - `foodId`: string
  - `recordedTime`: timestamp
  - `serving`: number
  - `timestamp`: timestamp
  - `units`: string
  - `userId`: string
  - `xp`: number

### Recipe Pattern
A recipe is a user-defined collection of foods, each with a specified quantity and unit. Macros and nutrition are always calculated dynamically from the food database at runtime.

**Recipe Object Structure:**
```json
{
  "id": "recipe_1234567890",         // unique recipe id
  "name": "Oats & Whey",             // recipe name (required for user display)
  "createdAt": "2025-07-02T21:08:49.683Z", // ISO string, optional
  "servings": 10,                    // number of servings the recipe makes (default: 1)
  "items": [
    {
      "id": "usda_12012",            // food id (must match foods collection)
      "quantity": 500,               // number (total amount for the whole recipe)
      "unit": "g"                    // string, must match available units for this food
    }
  ]
}
```

**Important Rules:**
- Do **not** store per-ingredient or total macros in the recipe object.
- The `unit` for each item must match a valid unit for that food.
- The `name` field for the recipe is **required** for display and user experience.
- The `servings` field allows the user to specify how many servings the recipe makes.
- Macros and nutrition for recipes are always calculated at runtime.

## Food Data Patterns

### Branded Food Pattern (No `alt_measures`)
```json
{
  "id": "branded_61c08b5a8fce1c00093bfd7f",
  "food_name": "Whey Protein Isolate Protein Powder, Creamy Vanilla",
  "brand_name": "Now Sports",
  "serving_qty": 1,
  "serving_unit": "packet",
  "serving_weight_grams": 32,
  "alt_measures": null
}
```

**Unit Conversion Rules:**
- If `alt_measures` is `null` and `serving_weight_grams` is present, allow the user to select either the default unit (`serving_unit`) or grams (`g`).
- If neither `alt_measures` nor `serving_weight_grams` is present, only allow the default unit (`serving_unit`).

### Generic Food Pattern (With `alt_measures`)
```json
{
  "id": "usda_9020",
  "food_name": "applesauce",
  "serving_qty": 1,
  "serving_unit": "container",
  "serving_weight_grams": 111,
  "alt_measures": [
    { "measure": "cup", "qty": 1, "serving_weight": 246 },
    { "measure": "container", "qty": 1, "serving_weight": 111 },
    { "measure": "g", "qty": 100, "serving_weight": 100 }
  ]
}
```

**Unit Conversion Rules:**
- If `alt_measures` is present and non-empty, allow the user to select any unit listed in `alt_measures`.
- If `alt_measures` is missing or empty, fallback to the branded food rules above.

### UI/UX Rules for Unit Selection
- If a food has `alt_measures`, allow all units in `alt_measures`.
- If a food does not have `alt_measures` but has `serving_weight_grams`, allow both the default unit and grams (`g`).
- If a food has neither, only allow the default unit.
- The UI must not allow the user to select a unit for which there is no conversion data.
- When logging food, always use the user's selected unit and quantity, and ensure the backend log reflects this selection. 