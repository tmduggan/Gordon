# Testing Strategy for Gordon App

## Overview
This document outlines the comprehensive testing strategy for the Gordon fitness and nutrition tracking app. The goal is to ensure reliability, maintainability, and confidence when making changes to the codebase.

## Current State
- **1 existing test file**: `src/utils/__tests__/dataUtils.test.js` (32 lines)
- **Testing framework**: Vitest + React Testing Library
- **Coverage**: Minimal (only utility functions)

## Testing Infrastructure ✅
- ✅ Vitest configured with jsdom environment
- ✅ React Testing Library for component testing
- ✅ Firebase and external service mocks
- ✅ Test setup and environment configuration

## Test Categories & Priorities

### 🔴 **Critical (Must Have)**
These tests protect core business logic and user data:

#### 1. **Exercise Logging Workflow**
- **Files**: `src/hooks/useExerciseLogging.js`, `src/firebase/firestore/logExerciseEntry.js`
- **Tests**: 
  - Exercise selection and cart management
  - Set/rep/duration data validation
  - Firebase persistence
  - XP calculation and user profile updates
  - Error handling and rollback

#### 2. **Food Logging Workflow**
- **Files**: `src/hooks/useFoodLogging.js`, `src/firebase/firestore/logFoodEntry.js`
- **Tests**:
  - Food selection and serving size validation
  - Nutrition calculation
  - Firebase persistence
  - XP calculation
  - Error handling

#### 3. **User Authentication & Profile**
- **Files**: `src/store/useAuthStore.js`
- **Tests**:
  - User login/logout
  - Profile creation and updates
  - Subscription status management
  - Equipment preferences
  - Data persistence

#### 4. **Data Fetching & History**
- **Files**: `src/services/firebase/fetchHistoryService.js`, `src/hooks/useHistory.js`
- **Tests**:
  - Exercise log retrieval
  - Food log retrieval
  - Date filtering
  - Data aggregation
  - Error handling

### 🟡 **Important (Should Have)**
These tests ensure UI functionality and user experience:

#### 5. **Core Components**
- **Files**: `src/components/exercise/ExerciseDisplay.jsx`, `src/components/nutrition/DailySummary.jsx`
- **Tests**:
  - Component rendering
  - User interactions
  - Data display
  - Responsive behavior

#### 6. **Gamification System**
- **Files**: `src/services/gamification/levelService.js`, `src/services/gamification/exerciseScoringService.js`
- **Tests**:
  - XP calculation
  - Level progression
  - Muscle tracking
  - Personal bests
  - Streak bonuses

#### 7. **Search & Filtering**
- **Files**: `src/hooks/useSearch.js`, `src/hooks/useLibrary.js`
- **Tests**:
  - Search functionality
  - Filter application
  - Equipment-based filtering
  - Performance optimization

### 🟢 **Nice to Have**
These tests improve maintainability and catch edge cases:

#### 8. **Utility Functions**
- **Files**: `src/utils/timeUtils.js`, `src/utils/dataUtils.js`
- **Tests**:
  - Date formatting
  - Data validation
  - Edge case handling

#### 9. **Integration Tests**
- **Files**: Complete user workflows
- **Tests**:
  - End-to-end exercise logging
  - End-to-end food logging
  - Profile management
  - Subscription flow

## Test Implementation Status

### ✅ **Completed**
- Testing infrastructure setup
- Basic utility tests (`dataUtils.test.js`)
- Firebase service mocks
- Component test framework

### 🔄 **In Progress**
- Exercise scoring service tests (partial)
- Level service tests (partial)
- Firebase logging tests (partial)

### ❌ **Not Started**
- Component tests
- Hook tests
- Integration tests
- User authentication tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Organization

```
src/
├── __tests__/                    # Test utilities and helpers
├── components/__tests__/         # Component tests
├── hooks/__tests__/             # Hook tests
├── services/__tests__/          # Service tests
├── firebase/__tests__/          # Firebase tests
├── utils/__tests__/             # Utility tests
└── integration/__tests__/       # Integration tests
```

## Mocking Strategy

### External Services
- **Firebase**: Mocked at the function level
- **Stripe**: Mocked payment functions
- **Nutritionix API**: Mocked responses

### Internal Dependencies
- **Zustand stores**: Mocked state and actions
- **React hooks**: Tested in isolation
- **Components**: Tested with mocked props

## Test Data Management

### Fixtures
- Sample exercise data
- Sample food data
- User profiles
- Workout logs
- Food logs

### Test Utilities
- Mock user creation
- Mock exercise library
- Mock food library
- Date/time helpers

## Continuous Integration

### Pre-commit Hooks
- Run unit tests
- Check test coverage
- Lint test files

### CI Pipeline
- Run all tests
- Generate coverage report
- Block deployment on test failures

## Coverage Goals

### Phase 1 (Critical): 70%
- Core business logic
- Data persistence
- User workflows

### Phase 2 (Important): 85%
- UI components
- User interactions
- Error handling

### Phase 3 (Complete): 90%+
- Edge cases
- Performance
- Accessibility

## Next Steps

1. **Fix existing test failures** - Address the 29 failing tests
2. **Implement critical tests** - Focus on exercise/food logging
3. **Add component tests** - Test UI interactions
4. **Create integration tests** - Test complete workflows
5. **Set up CI/CD** - Automated testing pipeline

## Maintenance

### Regular Tasks
- Update tests when features change
- Review test coverage monthly
- Refactor tests for better maintainability
- Add tests for new features

### Test Quality
- Keep tests focused and readable
- Use descriptive test names
- Avoid test interdependence
- Mock external dependencies consistently 