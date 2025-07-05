# Integration Patterns

## 🔗 How Different Parts Connect

This document explains how the various components, hooks, services, and external systems integrate with each other in the Gordon app.

## 📊 Data Flow Architecture

### Standard Data Flow Pattern

```
User Interaction → Component → Hook → Service → Firebase/API → Service → Hook → Component → UI Update
```

### Detailed Flow Example: Exercise Logging

1. **User clicks "Log Exercise"** → `ExerciseDisplay.jsx`
2. **Component calls hook** → `useExerciseLogging.js`
3. **Hook calls service** → `exerciseService.js` (calculate score)
4. **Service calls Firebase** → `logExerciseEntry.js` (save to database)
5. **Firebase returns result** → `logExerciseEntry.js`
6. **Service returns data** → `exerciseService.js`
7. **Hook updates state** → `useExerciseLogging.js`
8. **Component re-renders** → `ExerciseDisplay.jsx`

## 🔄 Component Integration Patterns

### 1. Component-to-Hook Integration

**Pattern**: Components use hooks for all stateful logic

```javascript
// Component receives data and callbacks from hook
export default function ExerciseDisplay({ exercise }) {
    const { 
        logExercise, 
        loading, 
        error, 
        exerciseHistory 
    } = useExerciseLogging();
    
    return (
        <div>
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage error={error} />}
            <ExerciseForm onSubmit={logExercise} />
            <ExerciseHistory data={exerciseHistory} />
        </div>
    );
}
```

### 2. Hook-to-Service Integration

**Pattern**: Hooks coordinate between components and services

```javascript
export default function useExerciseLogging() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const logExercise = async (exerciseData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Call service for business logic
            const score = calculateExerciseScore(exerciseData);
            
            // Call service for data persistence
            await saveWorkoutLog({ ...exerciseData, score });
            
            // Update local state
            setExerciseHistory(prev => [...prev, { ...exerciseData, score }]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return { logExercise, loading, error };
}
```

### 3. Service-to-Service Integration

**Pattern**: Services can call other services for complex operations

```javascript
// services/exercise/exerciseService.js
export async function processExerciseWorkout(workoutData, userProfile) {
    // Call scoring service
    const score = calculateExerciseScore(workoutData);
    
    // Call level service for XP updates
    const levelData = await updateUserLevel(userProfile.userId, score);
    
    // Call muscle tracking service
    const muscleData = await updateMuscleScores(workoutData, userProfile);
    
    return { score, levelData, muscleData };
}
```

## 🔥 Firebase Integration Patterns

### 1. Firestore Data Operations

**Pattern**: All database operations go through dedicated Firebase services

```javascript
// services/firebase/logExerciseEntry.js
export async function saveWorkoutLog(exerciseData) {
    const { db } = getFirebase();
    const logRef = collection(db, 'users', exerciseData.userId, 'workoutLog');
    
    return await addDoc(logRef, {
        ...exerciseData,
        recordedTime: serverTimestamp()
    });
}
```

### 2. Real-time Data Synchronization

**Pattern**: Use Firebase listeners for real-time updates

```javascript
// hooks/useHistory.js
export default function useHistory(userId) {
    const [history, setHistory] = useState([]);
    
    useEffect(() => {
        const { db } = getFirebase();
        const historyRef = collection(db, 'users', userId, 'workoutLog');
        
        const unsubscribe = onSnapshot(historyRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHistory(data);
        });
        
        return unsubscribe;
    }, [userId]);
    
    return history;
}
```

### 3. Authentication Integration

**Pattern**: Authentication state flows through the app via Zustand store

```javascript
// store/useAuthStore.js
export const useAuthStore = create((set) => ({
    user: null,
    profile: null,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    logout: () => set({ user: null, profile: null })
}));

// Components access auth state
export default function ProfileComponent() {
    const { user, profile } = useAuthStore();
    
    if (!user) return <LoginPrompt />;
    
    return <UserProfile data={profile} />;
}
```

## 🌐 External API Integration Patterns

### 1. Nutritionix API Integration

**Pattern**: External APIs are wrapped in dedicated services

```javascript
// api/nutritionixAPI.js
export async function searchFoods(query) {
    const response = await fetch(`${API_BASE}/search/instant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-app-id': APP_ID,
            'x-app-key': APP_KEY
        },
        body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
        throw new Error('Failed to search foods');
    }
    
    return await response.json();
}

// Services use the API wrapper
// services/foodService.js
export async function getFoodSuggestions(query) {
    const results = await searchFoods(query);
    return results.common.concat(results.branded);
}
```

### 2. AI Service Integration (GROQ)

**Pattern**: AI services are integrated through Cloud Functions

```javascript
// functions/groq-service.js
export class GroqService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    }
    
    async generate(prompt) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
}

// Frontend calls Cloud Function
// services/foodService.js
export async function getAIFoodSuggestions(userProfile) {
    const response = await fetch('/api/groqSuggestFood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile })
    });
    
    return await response.json();
}
```

## 🎮 Gamification Integration Patterns

### 1. XP and Level System Integration

**Pattern**: Gamification services integrate with exercise and food logging

```javascript
// services/gamification/levelService.js
export async function updateUserLevel(userId, newXP) {
    const userRef = doc(db, 'users', userId);
    
    return await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentXP = userDoc.data().totalXP || 0;
        const newTotalXP = currentXP + newXP;
        const newLevel = calculateLevel(newTotalXP);
        
        transaction.update(userRef, {
            totalXP: newTotalXP,
            level: newLevel,
            lastUpdated: serverTimestamp()
        });
        
        return { newTotalXP, newLevel };
    });
}

// Integrated into exercise logging
// services/exercise/exerciseService.js
export async function logExerciseWithGamification(exerciseData, userProfile) {
    const score = calculateExerciseScore(exerciseData);
    
    // Save exercise log
    await saveWorkoutLog({ ...exerciseData, score });
    
    // Update user level and XP
    const levelData = await updateUserLevel(userProfile.userId, score);
    
    return { score, levelData };
}
```

### 2. Muscle Tracking Integration

**Pattern**: Muscle tracking integrates with exercise logging

```javascript
// services/gamification/exerciseBestsService.js
export async function updateMuscleScores(exerciseData, userProfile) {
    const exercise = await getExerciseDetails(exerciseData.exerciseId);
    const muscles = exercise.muscles || [];
    
    const updates = muscles.map(muscle => ({
        muscleId: muscle.id,
        score: calculateMuscleScore(exerciseData, muscle)
    }));
    
    await updateUserMuscleScores(userProfile.userId, updates);
    return updates;
}
```

## 🔄 State Management Integration Patterns

### 1. Global State (Zustand)

**Pattern**: Global state for user authentication and profile

```javascript
// store/useAuthStore.js
export const useAuthStore = create((set, get) => ({
    user: null,
    profile: null,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    updateProfile: (updates) => set(state => ({
        profile: { ...state.profile, ...updates }
    }))
}));

// Components access global state
export default function App() {
    const { user, profile } = useAuthStore();
    
    if (!user) {
        return <Auth />;
    }
    
    return <MainApp user={user} profile={profile} />;
}
```

### 2. Local State (React Hooks)

**Pattern**: Local state for component-specific data

```javascript
// hooks/useExerciseLogging.js
export default function useExerciseLogging() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exerciseHistory, setExerciseHistory] = useState([]);
    
    // Local state management
    const addToHistory = (exercise) => {
        setExerciseHistory(prev => [exercise, ...prev]);
    };
    
    return { loading, error, exerciseHistory, addToHistory };
}
```

## 🧪 Testing Integration Patterns

### 1. Service Integration Testing

**Pattern**: Test how services work together

```javascript
// integration/__tests__/exerciseWorkflow.test.js
describe('Exercise Logging Workflow', () => {
    it('should log exercise and update user level', async () => {
        const exerciseData = { /* test data */ };
        const userProfile = { /* test profile */ };
        
        const result = await logExerciseWithGamification(exerciseData, userProfile);
        
        expect(result.score).toBeGreaterThan(0);
        expect(result.levelData.newLevel).toBeDefined();
    });
});
```

### 2. Hook Integration Testing

**Pattern**: Test how hooks integrate with services

```javascript
// hooks/__tests__/useExerciseLogging.test.js
describe('useExerciseLogging', () => {
    it('should coordinate between component and services', async () => {
        const { result } = renderHook(() => useExerciseLogging());
        
        await act(async () => {
            await result.current.logExercise(mockExerciseData);
        });
        
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });
});
```

## 🔧 Error Handling Integration Patterns

### 1. Service Error Propagation

**Pattern**: Errors bubble up through the service layer

```javascript
// services/exercise/exerciseService.js
export async function calculateExerciseScore(exerciseData) {
    try {
        // Business logic
        return score;
    } catch (error) {
        // Log error for debugging
        console.error('Exercise scoring error:', error);
        
        // Re-throw with context
        throw new Error(`Failed to calculate exercise score: ${error.message}`);
    }
}

// Hook catches and handles errors
// hooks/useExerciseLogging.js
const logExercise = async (exerciseData) => {
    try {
        const score = await calculateExerciseScore(exerciseData);
        // Success handling
    } catch (error) {
        setError(error.message);
        // Show user-friendly error message
    }
};
```

### 2. Component Error Boundaries

**Pattern**: React Error Boundaries catch component errors

```javascript
// components/ErrorBoundary.jsx
export default function ErrorBoundary({ children }) {
    const [hasError, setHasError] = useState(false);
    
    if (hasError) {
        return <ErrorFallback onReset={() => setHasError(false)} />;
    }
    
    return (
        <ReactErrorBoundary onError={() => setHasError(true)}>
            {children}
        </ReactErrorBoundary>
    );
}
```

## 📱 UI Component Integration Patterns

### 1. Shared Component Integration

**Pattern**: Shared components are used across features

```javascript
// components/shared/Cart/CartContainer.jsx
export default function CartContainer({ items, onRemove, onUpdate }) {
    return (
        <div className="cart-container">
            {items.map(item => (
                <CartRow 
                    key={item.id} 
                    item={item} 
                    onRemove={onRemove}
                    onUpdate={onUpdate}
                />
            ))}
        </div>
    );
}

// Used in both exercise and nutrition features
// components/exercise/ExerciseDisplay.jsx
<CartContainer 
    items={exerciseCart} 
    onRemove={removeFromCart}
    onUpdate={updateCartItem}
/>

// components/nutrition/FoodPage.jsx
<CartContainer 
    items={foodCart} 
    onRemove={removeFromCart}
    onUpdate={updateCartItem}
/>
```

### 2. Modal Integration

**Pattern**: Modals integrate with parent components

```javascript
// components/ui/AnimatedModal.jsx
export default function AnimatedModal({ isOpen, onClose, children }) {
    if (!isOpen) return null;
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

// Used by feature components
// components/exercise/ExerciseLibraryModal.jsx
export default function ExerciseLibraryModal({ isOpen, onClose, onSelect }) {
    return (
        <AnimatedModal isOpen={isOpen} onClose={onClose}>
            <ExerciseLibrary onSelect={onSelect} />
        </AnimatedModal>
    );
}
```

## 🎯 Integration Best Practices

### 1. Loose Coupling
- Components don't directly call services
- Hooks act as intermediaries
- Services are independent of UI

### 2. Clear Data Flow
- Data flows in one direction: User → Component → Hook → Service → Database
- State updates flow back: Database → Service → Hook → Component → UI

### 3. Error Boundaries
- Errors are caught at appropriate levels
- User-friendly error messages are displayed
- Debugging information is logged

### 4. Testing Integration Points
- Test how components integrate with hooks
- Test how hooks integrate with services
- Test how services integrate with external APIs

### 5. Consistent Patterns
- Use the same integration patterns throughout the app
- Follow established naming conventions
- Maintain consistent error handling

Remember: **The goal is to have clear, predictable connections between different parts of the application while maintaining separation of concerns.** 