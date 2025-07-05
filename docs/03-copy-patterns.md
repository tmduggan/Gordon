# How to Duplicate Features Correctly

## 🎯 Core Principle

**When duplicating features, copy the EXACT pattern from the original. Do not modify established patterns, only change the specific content (names, IDs, etc.).**

## 📋 Pre-Duplication Checklist

Before duplicating any feature:

- [ ] Identify the source feature to copy from
- [ ] Understand the complete pattern (component + hook + service + utils)
- [ ] Note all dependencies and imports
- [ ] Check for any special configurations or settings
- [ ] Verify the data flow and state management

## 🔄 Duplication Process

### Step 1: Identify the Complete Pattern

**Example**: Duplicating "Suggest Meal" to "Suggest Snack"

1. **Find all related files**:
   - Component: `src/components/nutrition/SuggestedFoodsCard.jsx`
   - Hook: `src/hooks/useFoodLogging.js` (may contain suggestion logic)
   - Service: `src/services/foodService.js` (may contain suggestion logic)
   - Cloud Function: `functions/groq-service.js` (if using AI)

2. **Understand the data flow**:
   - How the component receives data
   - How the hook manages state
   - How the service processes requests
   - How errors are handled

### Step 2: Copy the Exact Pattern

**DO NOT** modify the established patterns. Only change:
- Component names
- Function names
- Variable names
- Text content
- API endpoints (if different)

**Example**: When duplicating "Suggest Meal" to "Suggest Snack":

```javascript
// ✅ Good: Copy exact pattern, only change names
export default function SuggestedSnacksCard({ onSelect }) {
    const { suggestSnacks, loading, error } = useSnackSuggestions();
    
    return (
        <div className="suggested-foods-card">
            <h3>Suggested Snacks</h3>
            {loading && <div>Loading suggestions...</div>}
            {error && <div>Error: {error}</div>}
            {/* Same structure, different content */}
        </div>
    );
}

// ❌ Bad: Modifying the established pattern
export default function SuggestedSnacksCard({ onSelect }) {
    // Don't change the state management pattern
    const [suggestions, setSuggestions] = useState([]); // Wrong - use hook pattern
    const [isLoading, setIsLoading] = useState(false);  // Wrong - use hook pattern
    
    // Don't add business logic to component
    const fetchSuggestions = async () => { // Wrong - this should be in service
        // Business logic here
    };
}
```

### Step 3: Update All References

1. **Update imports** in the new files
2. **Update function calls** to use new names
3. **Update API endpoints** if different
4. **Update any hardcoded text** or labels

### Step 4: Test the Duplication

1. **Test the new feature** works exactly like the original
2. **Verify no conflicts** with existing features
3. **Check all imports** are correct
4. **Test error handling** works the same way

## 📁 File Duplication Examples

### Duplicating a Component

**Source**: `src/components/nutrition/SuggestedFoodsCard.jsx`
**Target**: `src/components/nutrition/SuggestedSnacksCard.jsx`

1. **Copy the entire file**
2. **Change the component name**: `SuggestedFoodsCard` → `SuggestedSnacksCard`
3. **Update internal references**: `suggestFoods` → `suggestSnacks`
4. **Update text content**: "Suggested Foods" → "Suggested Snacks"
5. **Keep the exact same structure and patterns**

### Duplicating a Hook

**Source**: `src/hooks/useFoodLogging.js`
**Target**: `src/hooks/useSnackLogging.js`

1. **Copy the hook pattern** (state management, error handling, loading states)
2. **Change function names**: `logFood` → `logSnack`
3. **Update service calls** to use new service functions
4. **Keep the exact same error handling and loading patterns**

### Duplicating a Service

**Source**: `src/services/foodService.js`
**Target**: `src/services/snackService.js`

1. **Copy the service pattern** (business logic structure)
2. **Change function names**: `calculateFoodScore` → `calculateSnackScore`
3. **Update any food-specific logic** to snack-specific logic
4. **Keep the exact same validation and error handling patterns**

## 🚨 Common Duplication Mistakes

### 1. Modifying Established Patterns

```javascript
// ❌ Bad: Changing the established pattern
export default function NewComponent() {
    // Don't change how state is managed
    const [data, setData] = useState([]); // Wrong if original uses a hook
    
    // Don't add business logic to component
    const processData = (data) => { // Wrong - should be in service
        return data.map(item => ({ ...item, processed: true }));
    };
}

// ✅ Good: Copy the exact pattern
export default function NewComponent() {
    // Use the same hook pattern as original
    const { data, loading, error } = useDataHook();
    
    // Keep component pure, no business logic
    return <div>{/* UI only */}</div>;
}
```

### 2. Not Updating All References

```javascript
// ❌ Bad: Missing import updates
import { useFoodLogging } from '../hooks/useFoodLogging'; // Wrong - should be new hook

// ✅ Good: Updated all references
import { useSnackLogging } from '../hooks/useSnackLogging';
```

### 3. Changing Error Handling Patterns

```javascript
// ❌ Bad: Different error handling than original
try {
    await someFunction();
} catch (error) {
    console.error(error); // Wrong - should match original pattern
}

// ✅ Good: Copy exact error handling pattern
try {
    await someFunction();
} catch (error) {
    setError(error.message); // Same as original
}
```

### 4. Modifying State Management

```javascript
// ❌ Bad: Different state management than original
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);

// ✅ Good: Copy exact state management pattern
const { loading, data, error, fetchData } = useDataHook(); // Same pattern as original
```

## 🔧 Specific Duplication Scenarios

### Duplicating AI-Powered Features

When duplicating features that use AI (like "Suggest Meal" to "Suggest Snack"):

1. **Copy the exact handler pattern** for food strings
2. **Update the prompt** to be snack-specific
3. **Keep the same error handling** and retry logic
4. **Maintain the same response parsing** pattern

```javascript
// ✅ Good: Copy exact AI handler pattern
export async function suggestSnacks(userProfile, preferences) {
    // Same structure as suggestMeals, different prompt
    const prompt = `Suggest healthy snacks for a user with profile: ${userProfile}`;
    
    // Same error handling and retry logic
    try {
        const response = await groqService.generate(prompt);
        return parseFoodSuggestions(response); // Same parsing function
    } catch (error) {
        // Same error handling as original
        throw new Error(`Failed to suggest snacks: ${error.message}`);
    }
}
```

### Duplicating Database Operations

When duplicating features that interact with Firestore:

1. **Copy the exact database structure** pattern
2. **Update collection/document names**
3. **Keep the same validation** and error handling
4. **Maintain the same transaction** patterns

```javascript
// ✅ Good: Copy exact database pattern
export async function saveSnackLog(snackData) {
    // Same structure as saveFoodLog, different collection
    const logRef = collection(db, 'users', userId, 'snackLog');
    
    // Same validation and error handling
    if (!snackData.foodId) {
        throw new Error('Food ID is required');
    }
    
    // Same transaction pattern
    return await addDoc(logRef, {
        ...snackData,
        recordedTime: serverTimestamp(),
        userId: userId
    });
}
```

### Duplicating UI Components

When duplicating UI components:

1. **Copy the exact JSX structure**
2. **Update component names and props**
3. **Keep the same styling classes**
4. **Maintain the same event handling patterns**

```javascript
// ✅ Good: Copy exact UI pattern
export default function SnackCard({ snack, onSelect }) {
    // Same structure as FoodCard
    return (
        <div className="food-card" onClick={() => onSelect(snack)}>
            <h3>{snack.name}</h3>
            <p>{snack.description}</p>
            {/* Same structure, different content */}
        </div>
    );
}
```

## 📝 Duplication Checklist

When duplicating any feature:

- [ ] **Identified the complete pattern** (component + hook + service)
- [ ] **Copied the exact structure** without modifications
- [ ] **Updated all names and references** consistently
- [ ] **Maintained the same error handling** patterns
- [ ] **Kept the same state management** approach
- [ ] **Preserved the same data flow** (User → Component → Hook → Service)
- [ ] **Updated all imports** and dependencies
- [ ] **Tested the new feature** works like the original
- [ ] **Verified no conflicts** with existing features
- [ ] **Checked that established patterns** are not violated

## 🎯 Key Success Factors

1. **Copy, don't create**: Use existing patterns as templates
2. **Change names, not structure**: Only modify specific content
3. **Test thoroughly**: Ensure the duplicate works exactly like the original
4. **Maintain consistency**: Follow the same patterns throughout
5. **Document changes**: Note what was duplicated and how

Remember: **The goal is to have two features that work identically, just with different content.** 