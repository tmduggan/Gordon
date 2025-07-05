# Common Bugs & Solutions

## 🔴 Critical Issues

## MOST COMMON PROBLEM WITH CURSOR ##
“We use Firebase Cloud Functions v2. Do NOT suggest functions:config:set. All secrets must be set via gcloud or the Cloud Console as described in /docs/02-common-bugs.md.”


### 1. Firebase Cloud Functions v2 API Key Configuration

**Problem**: API keys not working in Cloud Functions v2, getting undefined when accessing `process.env.GROQ_API_KEY`

**Root Cause**: Firebase Cloud Functions v2 uses Google Cloud Functions under the hood, which doesn't support `functions.config()`. API keys must be set in Google Cloud environment variables, not Firebase config.

**Solution**:

1. **Set environment variable in Google Cloud:**
   ```sh
   gcloud functions deploy groqSuggestFood \
     --gen2 \
     --runtime=nodejs22 \
     --region=us-central1 \
     --source=functions \
     --entry-point=groqSuggestFood \
     --trigger-http \
     --set-env-vars GROQ_API_KEY=your_actual_groq_api_key_here
   ```

2. **Or set via Google Cloud Console:**
   - Go to Google Cloud Console → Cloud Functions
   - Select your function
   - Go to "Edit" → "Runtime, build, connections and security settings"
   - Expand "Runtime" → "Environment variables"
   - Add `GROQ_API_KEY` with your actual API key value

3. **For local development, create a `.env` file in project root:**
   ```bash
   # .env file
   GROQ_API_KEY=your_actual_groq_api_key_here
   ```

**Why This Happens**: The code correctly uses `process.env.GROQ_API_KEY`, but the environment variable wasn't set in Google Cloud. Cloud Functions v2 doesn't support `functions.config()`.

**Prevention**: Always set API keys in Google Cloud environment variables for Cloud Functions v2, not Firebase config.

### 2. Exercise XP Calculation Errors

**Problem**: XP calculation returning incorrect values or NaN

**Root Cause**: Incorrect handling of weight/reps/duration values or missing validation

**Solution**: Use the canonical XP calculation algorithm:
- For each set:
  - If `weight > 0`: XP = reps * weight * 0.1
  - If `weight == 0` and `reps > 0`: XP = reps * 1 (bodyweight/rep-only exercises)
- For duration-based (cardio) exercises: XP = duration (in minutes) * 2
- Total XP = sum of all set and duration XP, rounded to nearest integer

**Location**: `src/services/exercise/exerciseService.js` in `calculateExerciseScore` function

### 3. Food Unit Conversion Issues

**Problem**: Users can't select certain units or get conversion errors

**Root Cause**: Not following the established unit conversion rules

**Solution**: Follow the canonical unit conversion rules:
- If food has `alt_measures`, allow all units in `alt_measures`
- If food doesn't have `alt_measures` but has `serving_weight_grams`, allow default unit and grams (`g`)
- If food has neither, only allow the default unit
- Never allow units without conversion data

## 🟡 Common Issues

### 4. Component Business Logic

**Problem**: Components contain business logic instead of being pure UI

**Root Cause**: Violating separation of concerns

**Solution**: 
- Move business logic to services
- Components should only handle UI and call callbacks
- Use hooks to coordinate between components and services

**Example**:
```javascript
// ❌ Bad: Business logic in component
export default function ExerciseCard({ exercise }) {
    const score = calculateScore(exercise); // Business logic in component
    return <div>{score}</div>;
}

// ✅ Good: Pure component
export default function ExerciseCard({ exercise, onSelect }) {
    return (
        <div onClick={() => onSelect(exercise)}>
            <h3>{exercise.name}</h3>
        </div>
    );
}
```

### 5. Service Granularity Issues

**Problem**: Services doing too many things (monolithic services)

**Root Cause**: Not following single responsibility principle

**Solution**: Create focused, single-purpose services:
```javascript
// ✅ Good: Focused service
export function calculateExerciseScore(workoutData, exerciseDetails) {
    // Only exercise scoring logic
}

// ❌ Bad: Monolithic service
export function processExercise(workoutData, exerciseDetails, userProfile) {
    // Too many responsibilities
    const score = calculateScore(workoutData);
    const updatedProfile = updateProfile(userProfile);
    const savedData = saveToDatabase(workoutData);
    return { score, updatedProfile, savedData };
}
```

### 6. Hook State Management Issues

**Problem**: Hooks not properly managing loading states or error handling

**Root Cause**: Missing proper state management patterns

**Solution**: Always include loading and error states:
```javascript
// ✅ Good: Proper state management
export default function useExerciseLogging() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const logExercise = async (exerciseData) => {
        setLoading(true);
        setError(null);
        try {
            const score = calculateExerciseScore(exerciseData);
            await saveWorkoutLog({ ...exerciseData, score });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return { logExercise, loading, error };
}
```

### 7. Database Structure Violations

**Problem**: Logs not following the canonical Firestore structure

**Root Cause**: Not referencing the established database patterns

**Solution**: Always follow the canonical structure:

**Exercise Logs** (`users/[userId]/workoutLog/[logId]`):
- `duration`: number | null
- `exerciseId`: string
- `recordedTime`: timestamp (when log was created)
- `score`: number
- `sets`: array | null (for strength exercises)
- `timestamp`: timestamp (when exercise was performed)
- `userId`: string

**Food Logs** (`users/[userId]/foodLog/[logId]`):
- `foodId`: string
- `recordedTime`: timestamp
- `serving`: number
- `timestamp`: timestamp
- `units`: string
- `userId`: string
- `xp`: number

### 8. Recipe Data Structure Issues

**Problem**: Storing macros in recipe objects or incorrect unit handling

**Root Cause**: Not following the recipe pattern

**Solution**: 
- Never store per-ingredient or total macros in recipe objects
- Macros are always calculated dynamically at runtime
- Ensure `unit` for each item matches valid units for that food
- Always include `name` field (required for display)
- Use `servings` field to specify how many servings the recipe makes

### 9. Naming Convention Violations

**Problem**: Files or functions not following established naming conventions

**Root Cause**: Not following the established patterns

**Solution**: Always use the correct naming conventions:
- **Components**: PascalCase (e.g., `HistoryView.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useHistory.js`)
- **Services**: camelCase with `Service` suffix (e.g., `exerciseService.js`)
- **Utils**: camelCase (e.g., `dataUtils.js`)

### 10. Directory Structure Violations

**Problem**: Files placed in wrong directories

**Root Cause**: Not following feature-based organization

**Solution**: Always use the established directory structure:
- `components/exercise/` - Exercise-specific UI
- `components/nutrition/` - Food and nutrition UI
- `components/gamification/` - XP and level UI
- `components/profile/` - User settings UI
- `components/shared/` - Components used across features
- `components/ui/` - Reusable UI components
- `hooks/` - React hooks for stateful UI logic
- `services/` - Business logic and data operations
- `utils/` - Pure utility functions

## 🟢 Prevention Tips

### Before Making Changes
1. **Reference the patterns**: Check `PATTERNS.md` for established conventions
2. **Check existing implementations**: Look at similar features for patterns
3. **Follow the data flow**: User Interaction → Component → Hook → Service → Firebase/API
4. **Test each layer**: Ensure business logic, state management, and UI work independently

### When Duplicating Features
1. **Copy the exact pattern**: Don't modify established patterns
2. **Update all references**: Ensure imports and dependencies are updated
3. **Test the new feature**: Verify it works exactly like the original
4. **Check for conflicts**: Ensure no naming or path conflicts

### When Adding New Features
1. **Create service first**: Business logic goes in services
2. **Create hook second**: State management and coordination
3. **Create component last**: Pure UI components
4. **Follow naming conventions**: Use established patterns
5. **Test independently**: Each layer should work on its own

## 🔧 Debugging Checklist

When encountering issues:

- [ ] Check if following established patterns from `PATTERNS.md`
- [ ] Verify API keys are set in Google Cloud (not Firebase config) for Cloud Functions v2
- [ ] Ensure components are pure UI (no business logic)
- [ ] Verify services are focused and single-purpose
- [ ] Check hooks properly manage loading/error states
- [ ] Confirm database structure follows canonical patterns
- [ ] Validate naming conventions are followed
- [ ] Check directory structure is correct
- [ ] Test each layer independently
- [ ] Reference existing implementations for patterns 