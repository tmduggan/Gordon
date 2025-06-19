# Exercise Library Population Scripts

This directory contains scripts to populate the `exerciseLibrary` Firestore collection with exercises from the ExerciseDB API.

## Overview

The app now uses a **local-only search approach** for exercises:
- ✅ **App**: Only searches local Firestore `exerciseLibrary` collection
- ✅ **Scripts**: Populate the library from ExerciseDB API
- ✅ **Performance**: Fast local searches, no API calls during app usage
- ✅ **Cost**: Minimal API usage (only during library population)

## Scripts

### 1. `test-api-only.js`
**Purpose**: Test the ExerciseDB API without Firebase
**Usage**: `node test-api-only.js`
**What it does**:
- Tests API connectivity with your RapidAPI key
- Validates exercise data structure
- Shows sample exercises for queries: "bench", "squat", "push"

### 2. `populate-via-browser.js`
**Purpose**: Populate exercise library from browser console
**Usage**: Copy and paste into browser console when app is running
**What it does**:
- Uses existing Firebase authentication from the app
- Fetches exercises from ExerciseDB API
- Saves to `exerciseLibrary` collection
- Avoids Firebase authentication restrictions

### 3. `populate-exercise-library.js`
**Purpose**: Node.js script to populate library (requires Firebase Admin SDK)
**Usage**: `node populate-exercise-library.js`
**Note**: Currently has authentication restrictions

## Error Handling

All scripts include comprehensive error handling:

### Error Types
- **API Errors**: HTTP status codes (400, 401, 403, 500, etc.)
- **Network Errors**: Connection failures, timeouts
- **Authentication Errors**: Firebase auth issues
- **Data Errors**: Invalid data structure, missing fields

### Error Handling Features
- ✅ **Graceful Degradation**: Scripts continue with limited functionality
- ✅ **Detailed Logging**: Console output with emojis for easy reading
- ✅ **Context Information**: Error location and type identification
- ✅ **Data Validation**: Structure validation before saving

## Usage Instructions

### Step 1: Test API Connection
```bash
cd scripts
node test-api-only.js
```

### Step 2: Populate Library (Browser Method)
1. Start your app: `npm run dev`
2. Open browser console (F12)
3. Copy and paste the contents of `populate-via-browser.js`
4. Run: `populateExerciseLibrary("bench")`
5. Repeat for other exercises: `populateExerciseLibrary("squat")`

### Step 3: Verify in App
1. Go to Exercise page
2. Search for exercises
3. Verify they appear in local search results

## API Key Configuration

Your RapidAPI key is configured in the scripts:
```javascript
const API_KEY = '3c9d909f7cmsh41ac528c20d2fa5p1cfdb4jsnab216ecf29e8';
```

## Exercise Data Structure

Each exercise in the library contains:
- `id`: Unique identifier
- `name`: Exercise name
- `bodyPart`: Primary body part (chest, legs, etc.)
- `target`: Target muscle group
- `equipment`: Required equipment
- `difficulty`: beginner/intermediate/advanced
- `category`: strength/cardio/stretching
- `secondaryMuscles`: Array of secondary muscles worked
- `instructions`: Step-by-step instructions
- `description`: Detailed description
- `gifUrl`: Animated demonstration
- `savedAt`: Timestamp when saved
- `source`: Data source (exercisedb)

## Benefits of Local-Only Approach

1. **Performance**: Instant search results
2. **Reliability**: No API dependency during app usage
3. **Cost**: Minimal API calls (only during population)
4. **Offline**: Works without internet connection
5. **Privacy**: No external API calls from user devices

## Troubleshooting

### API Errors
- Check RapidAPI key validity
- Verify API quota limits
- Check network connectivity

### Firebase Errors
- Ensure app is running and authenticated
- Check Firestore permissions
- Verify Firebase configuration

### Data Issues
- Check exercise data structure
- Verify all required fields are present
- Look for duplicate entries

## Next Steps

1. **Populate Common Exercises**: Run population scripts for popular exercises
2. **Monitor Usage**: Check which exercises users search for most
3. **Expand Library**: Add more exercises based on user needs
4. **Optimize**: Consider pagination for large libraries 