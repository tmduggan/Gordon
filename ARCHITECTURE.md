# Gordon App Architecture

This document outlines the architecture and organization of the Gordon fitness app codebase.

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