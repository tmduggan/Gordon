# Firebase Admin SDK Setup Guide

## Step 1: Get Firebase Admin SDK Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `food-tracker-19c9d`
3. Go to **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file as `firebase-admin-key.json` in the **project root** (not in scripts folder)

## Step 2: Install Dependencies

```bash
cd scripts
npm install
```

## Step 3: Run the Population Script

### Basic Usage:
```bash
# Populate with "bench" exercises (default)
npm run populate

# Or specify a query:
node populate-exercise-library-admin.js bench
node populate-exercise-library-admin.js squat
node populate-exercise-library-admin.js push
```

### Pre-configured Scripts:
```bash
npm run populate:bench    # Bench press exercises
npm run populate:squat    # Squat exercises  
npm run populate:push     # Push-up exercises
```

## Step 4: Verify in App

1. Start your app: `npm run dev`
2. Go to Exercise tab
3. Search for exercises - they should appear from local library

## Troubleshooting

### "Firebase Admin SDK key not found"
- Make sure `firebase-admin-key.json` is in the project root
- Check that the file name is exactly `firebase-admin-key.json`

### "Permission denied" errors
- The Admin SDK key should have full access to Firestore
- Check Firebase Console > Project Settings > Service Accounts

### API errors
- Verify your RapidAPI key is valid
- Check API quota limits

## File Structure

```
Gordon/
├── firebase-admin-key.json    # ← Place here (project root)
├── scripts/
│   ├── populate-exercise-library-admin.js
│   ├── test-api-only.js
│   └── package.json
└── src/
    └── Exercise.jsx
``` 