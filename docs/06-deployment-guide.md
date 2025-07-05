# Deployment Guide

## Commit, Build, and Deploy Instructions (Firebase)

This section is the single source of truth for commit, build, and deploy for this project. Cursor and all developers should reference this for deployment best practices.

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

### Important Notes

- **Always run `npm run build`** before deploying hosting to ensure the latest code is in `dist/`.
- **For most UI/React changes**, `firebase deploy --only hosting` is sufficient and fastest.
- **For backend/Cloud Function changes**, deploy functions as well.
- **API keys must be set in Google Cloud environment variables** for Cloud Functions v2 (see `02-common-bugs.md`).
- You can always check the Firebase docs for more details: https://firebase.google.com/docs/cli

## API Key Configuration for Cloud Functions v2

**IMPORTANT**: This project uses Firebase Cloud Functions v2, which requires API keys to be set in Google Cloud environment variables, NOT Firebase config.

### Setting API Keys for Cloud Functions v2

1. **Set the environment variable in Google Cloud:**
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

2. **Or set it via Google Cloud Console:**
   - Go to Google Cloud Console → Cloud Functions
   - Select your function
   - Go to "Edit" → "Runtime, build, connections and security settings"
   - Expand "Runtime" → "Environment variables"
   - Add `GROQ_API_KEY` with your actual API key value

3. **For local development, create a `.env` file in the project root:**
   ```bash
   # .env file
   GROQ_API_KEY=your_actual_groq_api_key_here
   ```

### Why Not Firebase Config?

Firebase Cloud Functions v2 uses Google Cloud Functions under the hood, which doesn't support `functions.config()`. The code accesses the API key via `process.env.GROQ_API_KEY`.

### Current Configuration

The `functions/groq-service.js` file correctly uses:
```javascript
this.apiKey = process.env.GROQ_API_KEY;
```

This is the correct approach for Cloud Functions v2.

## Deployment Checklist

### Before Deploying

- [ ] All tests pass (`npm test`)
- [ ] Code is committed to git
- [ ] Project builds successfully (`npm run build`)
- [ ] API keys are set in Google Cloud (if using Cloud Functions)
- [ ] Environment variables are configured correctly

### After Deploying

- [ ] Verify the deployment was successful
- [ ] Test the deployed functionality
- [ ] Check for any console errors
- [ ] Verify API endpoints are working (if applicable)

### Common Deployment Issues

1. **Build fails**: Check for TypeScript errors or missing dependencies
2. **Hosting deployment fails**: Ensure `dist/` directory exists and contains built files
3. **Functions deployment fails**: Check API keys and environment variables
4. **Runtime errors**: Check Cloud Function logs in Google Cloud Console

## Environment-Specific Deployments

### Development
- Use `firebase use development` (if configured)
- Deploy to development environment
- Test with development API keys

### Production
- Use `firebase use production` (if configured)
- Deploy to production environment
- Ensure production API keys are set

## Monitoring and Debugging

### Firebase Console
- Check hosting deployment status
- Monitor Cloud Function logs
- View real-time database activity

### Google Cloud Console
- Monitor Cloud Function performance
- Check environment variables
- View detailed logs and errors

### Local Development
- Use `firebase emulators:start` for local testing
- Check browser console for frontend errors
- Monitor network requests in browser dev tools 