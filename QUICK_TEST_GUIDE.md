# Quick Test Guide

## 🚨 **Immediate Priority Tests**

These tests protect your core functionality and should be implemented first:

### 1. **Exercise Logging** (Critical)
```bash
# Test the complete exercise logging workflow
npm test src/hooks/__tests__/useExerciseLogging.test.js
npm test src/firebase/__tests__/logExerciseEntry.test.js
```

**What to test:**
- ✅ Exercise selection and cart management
- ✅ Set/rep/duration data validation  
- ✅ Firebase persistence
- ✅ XP calculation
- ✅ Error handling

### 2. **Food Logging** (Critical)
```bash
# Test the complete food logging workflow
npm test src/hooks/__tests__/useFoodLogging.test.js
npm test src/firebase/__tests__/logFoodEntry.test.js
```

**What to test:**
- ✅ Food selection and serving validation
- ✅ Nutrition calculation
- ✅ Firebase persistence
- ✅ XP calculation
- ✅ Error handling

### 3. **User Authentication** (Critical)
```bash
# Test user profile and authentication
npm test src/store/__tests__/useAuthStore.test.js
```

**What to test:**
- ✅ User login/logout
- ✅ Profile creation/updates
- ✅ Subscription management
- ✅ Equipment preferences

## 🔧 **How to Run Tests**

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test src/hooks/__tests__/useExerciseLogging.test.js
```

### Run Tests by Category
```bash
node scripts/run-tests.js critical
node scripts/run-tests.js services
node scripts/run-tests.js components
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with UI
```bash
npm run test:ui
```

## 📋 **Test Checklist**

### Before Making Changes
- [ ] Run `npm test` to ensure all tests pass
- [ ] Check test coverage with `npm run test:coverage`

### After Making Changes
- [ ] Run relevant test files
- [ ] Add new tests for new functionality
- [ ] Update existing tests if needed
- [ ] Ensure all tests still pass

### When Adding New Features
- [ ] Write tests first (TDD approach)
- [ ] Test happy path scenarios
- [ ] Test error scenarios
- [ ] Test edge cases

## 🎯 **Key Test Patterns**

### Testing Hooks
```javascript
import { renderHook, act } from '@testing-library/react'

const { result } = renderHook(() => useMyHook())

act(() => {
  result.current.someAction()
})

expect(result.current.someValue).toBe(expectedValue)
```

### Testing Components
```javascript
import { render, screen, fireEvent } from '@testing-library/react'

render(<MyComponent />)

expect(screen.getByText('Expected Text')).toBeInTheDocument()

fireEvent.click(screen.getByRole('button'))
```

### Testing Firebase Services
```javascript
// Mock Firebase functions
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn()
}))

// Test the service
const result = await saveWorkoutLog(mockData)
expect(addDoc).toHaveBeenCalledWith(expectedData)
```

## 🚀 **Quick Start Commands**

```bash
# 1. Install dependencies (if not done)
npm install --legacy-peer-deps

# 2. Run existing tests
npm test

# 3. Run critical tests only
node scripts/run-tests.js critical

# 4. Run tests in watch mode for development
npm run test:watch
```

## 📊 **Current Test Status**

- ✅ **Infrastructure**: Vitest + React Testing Library configured
- ✅ **Mocks**: Firebase, Stripe, and external services mocked
- 🔄 **Core Tests**: Partially implemented (29 failing, 62 passing)
- ❌ **Component Tests**: Not implemented
- ❌ **Integration Tests**: Not implemented

## 🎯 **Next Steps**

1. **Fix failing tests** - Address the 29 failing tests
2. **Implement critical tests** - Focus on exercise/food logging
3. **Add component tests** - Test UI interactions
4. **Create integration tests** - Test complete workflows

## 💡 **Tips**

- Start with the critical tests (exercise/food logging)
- Use the test runner script for focused testing
- Run tests frequently during development
- Keep tests simple and focused
- Mock external dependencies consistently 