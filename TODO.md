# TODO: Muscle SVG Chart and Exercise Search Improvements

## Overview
Implement improvements to the muscle SVG chart, exercise search functionality, and cart behavior to enhance user experience and equipment-based filtering.

## Tasks

### 1. Move Muscle SVG Chart Above Search Bar
- [ ] Locate the Muscle SVG Chart component (`MuscleChart.tsx` or similar)
- [ ] Update parent layout (likely `ExercisePage.tsx`) to render muscle chart above search bar
- [ ] Ensure responsive design for all screen sizes
- [ ] Test layout on mobile and desktop

### 2. Add "Recycle" Button in Cart for Muscle-Based Exercise Cycling
- [ ] Add recycle (refresh) icon button to `ExerciseCartRow.tsx`
- [ ] Show recycle button only for exercises added via SVG chart
- [ ] Implement cycling logic:
  - [ ] Find all exercises for same muscle group (respecting equipment constraints)
  - [ ] Randomly select next applicable exercise (cycle through list, avoid repeats)
  - [ ] Replace current exercise in cart with new one
- [ ] Track exercise source (SVG chart vs manual search) to show/hide recycle button
- [ ] Test cycling behavior and edge cases

### 3. Equipment Filtering for Search and SVG-Generated Exercises

#### 3.1 Filter Logic for Search Results
- [ ] Create utility function to check if exercise matches user's available equipment
- [ ] Filter out exercises requiring unavailable equipment from search results
- [ ] Display "unavailable" exercises at bottom of results, grayed out
- [ ] Add message: "You don't have the required equipment for this exercise."
- [ ] Test filtering logic with various equipment combinations

#### 3.2 Filter Logic for SVG Chart
- [ ] When clicking muscle, only select from exercises user has equipment for
- [ ] Show message/tooltip if no exercises available for muscle due to equipment
- [ ] Integrate equipment filtering with existing SVG chart logic
- [ ] Test SVG chart behavior with different equipment profiles

#### 3.3 Reusable Filtering Function
- [ ] Create `utils/exerciseEquipmentFilter.ts` utility
- [ ] Function signature: `isExerciseAvailable(exercise, userEquipment)`
- [ ] Use in both search results and SVG chart logic
- [ ] Add unit tests for filtering logic

### 4. SVG Chart Tooltip Improvements
- [ ] Update tooltips for crown icons in `MuscleChart.tsx`:
  - [ ] Yellow crown: Tooltip reads "Muscle Analytics"
  - [ ] Green crown: Tooltip reads "Premium Feature"
- [ ] Test tooltip display and positioning

## Implementation Notes

### Equipment Data Structure
Based on the user profile, equipment is stored as:
```javascript
availableEquipment: {
  bodyweight: ["body weight"],
  cardio: ["upper body ergometer", ...],
  gym: ["dumbbell", "cable", "leverage machine", "sled machine", "ez barbell", ...]
}
```

### Exercise Data Structure
Exercises have an `equipment` field that should match against the user's available equipment categories.

### Files to Modify
- `src/components/exercise/muscleData/MuscleChart.tsx`
- `src/components/shared/Search/ExerciseSearch.tsx`
- `src/components/shared/Cart/ExerciseCartRow.tsx`
- `src/pages/ExercisePage.tsx`
- `src/utils/exerciseEquipmentFilter.ts` (new file)
- `src/hooks/useExerciseSearch.ts` (if needed for filtering logic)

## Testing Checklist
- [ ] Muscle chart appears above search bar on all screen sizes
- [ ] Recycle button appears only for SVG-added exercises
- [ ] Cycling through exercises works correctly
- [ ] Equipment filtering works in search results
- [ ] Unavailable exercises show grayed out with message
- [ ] SVG chart respects equipment constraints
- [ ] Tooltips display correct text for crown icons
- [ ] Edge cases: no equipment, all equipment, mixed equipment

## Dependencies
- Ensure all UI components are properly imported
- Verify equipment data is available in user profile
- Check that exercise data includes equipment information 