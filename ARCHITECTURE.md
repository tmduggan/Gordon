# Gordon App Architecture

## Firestore Database Structure

This section documents the canonical Firestore structure for user logs. **Always reference this section for any code that reads or writes logs.**

### User Document Path
- Collection: `users`
- Document: `[userId]` (auto-generated or Firebase Auth UID)

### Exercise Logs
- **Path:** `users/[userId]/workoutLog/[logId]`
- **Each log document fields:**
  - `duration`: number | null
  - `exerciseId`: string
  - `recordedTime`: timestamp (when the log was created)
  - `score`: number
  - `sets`: array | null (for strength exercises)
  - `timestamp`: timestamp (when the exercise was performed)
  - `userId`: string (redundant, but present)

#### Example (workoutLog document):
```
users
  └── [userId]
      └── workoutLog
          └── [logId]
              ├── duration: null
              ├── exerciseId: "0212"
              ├── recordedTime: June 21, 2025 at 9:21:37 PM UTC-4
              ├── score: 0
              ├── sets: null
              ├── timestamp: June 22, 2025 at 9:21:00 PM UTC-4
              └── userId: "GLsdSrRYnK16UnViF2KoCPViTs2"
```

### Food Logs (for reference)
- **Path:** `users/[userId]/foodLog/[logId]`
- **Each log document fields:**
  - `foodId`: string
  - `recordedTime`: timestamp
  - `serving`: number
  - `timestamp`: timestamp
  - `units`: string
  - `userId`: string
  - `xp`: number

#### Example (foodLog document):
```
users
  └── [userId]
      └── foodLog
          └── [logId]
              ├── foodId: "usda_1001598"
              ├── recordedTime: June 27, 2025 at 7:16:36 PM UTC-4
              ├── serving: 1
              ├── timestamp: June 27, 2025 at 8:00:00 PM UTC-4
              ├── units: "cup"
              ├── userId: "GLsdSrRYnK16UnViF2KoCPViTs2"
              └── xp: 129
```

### Recipes Collection Structure (Canonical Reference)

A recipe is a user-defined collection of foods, each with a specified quantity and unit. Macros and nutrition are always calculated dynamically from the food database at runtime.

**Recipe Object:**
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
      // "name": "rice"              // optional, for debugging
    }
    // ... more items
  ]
}
```

**Notes:**
- Do **not** store per-ingredient or total macros in the recipe object.
- The `unit` for each item must match a valid unit for that food (see Foods Collection Structure).
- The `name` field for the recipe is **required** for display and user experience.
- The `servings` field allows the user to specify how many servings the recipe makes. When a user adds "1 serving" of the recipe to their cart, the ingredient quantities are divided by `servings`.
- Macros and nutrition for recipes are always calculated at runtime by summing the macros for each ingredient (using the current food database), divided by the number of servings as appropriate.

---

## Foods Collection Structure & Unit Conversion (Canonical Reference)

This section documents the canonical structure for food items in the `foods` collection and the rules for unit conversion and UI behavior. **Always reference this section for any code that reads, writes, or displays food data.**

### Branded Food Example (No `alt_measures`)
```json
{
  "id": "branded_61c08b5a8fce1c00093bfd7f",
  "food_name": "Whey Protein Isolate Protein Powder, Creamy Vanilla",
  "brand_name": "Now Sports",
  "serving_qty": 1,
  "serving_unit": "packet",
  "serving_weight_grams": 32,
  "alt_measures": null,
  ...
}
```
- **Unit Conversion Rules:**
  - If `alt_measures` is `null` and `serving_weight_grams` is present, allow the user to select either the default unit (`serving_unit`) or grams (`g`).
  - If neither `alt_measures` nor `serving_weight_grams` is present, only allow the default unit (`serving_unit`).

### Generic Food Example (With `alt_measures`)
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
    { "measure": "g", "qty": 100, "serving_weight": 100 },
    ...
  ],
  ...
}
```
- **Unit Conversion Rules:**
  - If `alt_measures` is present and non-empty, allow the user to select any unit listed in `alt_measures`.
  - If `alt_measures` is missing or empty, fallback to the branded food rules above (allow default unit and grams if `serving_weight_grams` is present).

### UI/UX Rules for Unit Selection
- If a food has `alt_measures`, allow all units in `alt_measures`.
- If a food does not have `alt_measures` but has `serving_weight_grams`, allow both the default unit and grams (`g`).
- If a food has neither, only allow the default unit.
- The UI must not allow the user to select a unit for which there is no conversion data.
- When logging food, always use the user's selected unit and quantity, and ensure the backend log reflects this selection.

---

## Directory Structure

```
src/
├── components/
│   ├── exercise/          # Exercise-specific UI components
│   ├── nutrition/         # Nutrition-specific UI components
│   ├── gamification/      # XP, Level, Progress UI components
│   ├── profile/           # User profile and settings UI
│   ├── admin/             # Admin-only UI components
│   ├── shared/            # Shared components used across features
│   │   ├── Cart/          # Shopping cart components
│   │   ├── Search/        # Search functionality
│   │   └── HistoryView.jsx # History display component
│   └── ui/                # Reusable UI components (buttons, modals, etc.)
├── hooks/                 # React hooks for stateful UI logic
│   ├── useHistory.js      # History fetching and management
│   ├── useLibrary.js      # Library fetching and management
│   ├── useExerciseLogging.js # Exercise logging state
│   ├── useFoodLogging.js  # Food logging state
│   ├── useCart.js         # Cart state management
│   ├── useSearch.js       # Search state management
│   ├── useScoreProgress.js # Score and progress state
│   └── useToast.js        # Toast notifications
├── services/              # Business logic and data operations
│   ├── exercise/          # Exercise-related business logic
│   │   └── exerciseService.js
│   ├── nutrition/         # Nutrition-related business logic
│   │   ├── foodService.js
│   │   └── dailyTotalsService.js
│   ├── gamification/      # XP, scoring, and level logic
│   │   ├── exerciseScoringService.js
│   │   ├── foodScoringService.js
│   │   ├── levelService.js
│   │   ├── exerciseBestsService.js
│   │   └── suggestionService.js
│   ├── firebase/          # Firebase-specific operations
│   │   ├── fetchHistoryService.js
│   │   ├── fetchLibraryService.js
│   │   ├── logExerciseEntry.js
│   │   └── logFoodEntry.js
│   └── svgMappingService.js # Muscle mapping logic
├── utils/                 # Pure utility functions
│   ├── dataUtils.js       # Data manipulation utilities
│   ├── timeUtils.js       # Time and date utilities
│   ├── muscleMapping.js   # Muscle mapping data
│   └── iconMappings.js    # Icon mapping utilities
├── store/                 # Global state management
│   └── useAuthStore.js    # Authentication and user state
├── firebase/              # Firebase configuration
│   ├── firebase.js        # Firebase initialization
│   └── firestore/         # Firestore-specific operations
├── api/                   # External API integrations
│   └── nutritionixAPI.js  # Nutritionix API wrapper
└── pages/                 # Main page components
    ├── MainPage.jsx
    ├── FoodPage.jsx
    └── ExercisePage.jsx
```

## Architecture Principles

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

### 2. Feature-Based Organization

Components are organized by feature:
- `exercise/` - Exercise-related UI
- `nutrition/` - Food and nutrition UI
- `gamification/` - XP and level UI
- `profile/` - User settings UI
- `shared/` - Components used across features

### 3. Service Layer Pattern

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

### 4. Hook-Service Pattern

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

## Data Flow

1. **User Interaction** → Component
2. **Component** → Hook (via callback)
3. **Hook** → Service (for business logic)
4. **Service** → Firebase/API (for data)
5. **Service** → Hook (with result)
6. **Hook** → Component (via state update)

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

## Best Practices

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

## Migration Guide

When adding new features:

1. **Create service** for business logic
2. **Create hook** for state management
3. **Create component** for UI
4. **Update imports** to use new structure
5. **Test** each layer independently

## Testing Strategy

- **Components**: Test UI rendering and user interactions
- **Hooks**: Test state management and side effects
- **Services**: Test business logic with unit tests
- **Utils**: Test pure functions with unit tests

This architecture ensures maintainability, testability, and scalability as the application grows.

---

## Commit, Build, and Deploy Instructions (Firebase)

### Standard Workflow
1. **Commit your changes:**
   ```sh
   git add <changed files>
   git commit -m "<your commit message>"
   ```
2. **Build the project:**
   ```sh
   npm run build
   ```
3. **Deploy to Firebase:**
   - **Frontend only (hosting):**
     ```sh
     firebase deploy --only hosting
     ```
     Use this if you only changed frontend code (React, UI, static assets).
   - **Cloud Functions only:**
     ```sh
     firebase deploy --only functions
     ```
     Use this if you only changed backend Cloud Functions (in the `functions/` directory).
   - **Both frontend and functions:**
     ```sh
     firebase deploy
     ```
     Use this if you changed both frontend and backend code.

### Notes
- Always run `npm run build` before deploying hosting to ensure the latest code is in `dist/`.
- For most UI/React changes, `firebase deploy --only hosting` is sufficient and fastest.
- For backend/Cloud Function changes, deploy functions as well.
- You can always check the Firebase docs for more details: https://firebase.google.com/docs/cli

This section is the single source of truth for commit, build, and deploy for this project. Cursor and all developers should reference this for deployment best practices.

## Exercise XP Calculation

The canonical algorithm for calculating XP (score) for exercise logs is as follows:

- For each set:
  - If `weight > 0`: XP = reps * weight * 0.1
  - If `weight == 0` and `reps > 0`: XP = reps * 1 (bodyweight/rep-only exercises)
- For duration-based (cardio) exercises:
  - XP = duration (in minutes) * 2
- The total XP for a workout is the sum of all set and duration XP, rounded to the nearest integer.
- Bonuses (e.g., for personal bests, lagging muscles) may be added on top of this base XP.

This algorithm is implemented in `src/services/exercise/exerciseService.js` in the `calculateExerciseScore` function. 