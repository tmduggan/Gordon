# Groq API Integration Setup Guide

This guide will help you set up the Groq API integration for AI-powered workout and nutrition suggestions.

## 🚀 Quick Start

### 1. **Set Your Groq API Key**

Create a `.env` file in your project root (if it doesn't exist):

```bash
# .env file
GROQ_API_KEY=your_actual_groq_api_key_here
```

**Important**: The `.env` file is already in your `.gitignore`, so your API key won't be committed to version control.

### 2. **Install Dependencies**

The required dependencies are already in your `functions/package.json`:
- `axios` - for HTTP requests
- `cors` - for cross-origin requests
- `express` - for API endpoints

### 3. **Test the Integration**

Run the test script to verify everything works:

```bash
# Run the test (it will automatically load from .env file)
node scripts/test-groq-simple.js
```

**Note**: The test script automatically loads your API key from the `.env` file. You don't need to export it manually.

### 4. **Deploy to Firebase**

```bash
# Deploy the functions
cd functions
npm run deploy
```

## 📁 File Structure

```
functions/
├── groq-config.js          # Configuration settings
├── groq-service.js         # Main Groq API service
└── index.js               # Firebase Functions (updated with Groq endpoints)

scripts/
└── test-groq-api.js       # Test script for verification

.env                       # Your API key (create this)
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key | ✅ Yes |

### Firebase Functions Config (Alternative)

If you prefer to use Firebase Functions config instead of `.env`:

```bash
# Set the config
firebase functions:config:set groq.api_key="your_api_key_here"

# Deploy
firebase deploy --only functions
```

Then update `groq-service.js` to use:
```javascript
this.apiKey = process.env.GROQ_API_KEY || functions.config().groq.api_key;
```

## 🧪 Testing

### 1. **Local Testing**

```bash
# Test basic connectivity
curl -X GET "http://localhost:5001/your-project/us-central1/groq/api/groq/test"
```

### 2. **Deployed Testing**

```bash
# Test basic connectivity
curl -X GET "https://us-central1-your-project.cloudfunctions.net/groq/api/groq/test"
```

### 3. **Test Workout Suggestions**

```bash
curl -X POST "https://us-central1-your-project.cloudfunctions.net/groq/api/groq/workout-suggestions" \
  -H "Content-Type: application/json" \
  -d '{
    "userData": {
      "exerciseHistory": [
        {"date": "2024-01-01", "exercise": "push-ups", "sets": 3, "reps": 10}
      ],
      "equipment": ["body weight"],
      "userLevel": "beginner",
      "muscleAnalysis": {"chest": 0.3, "legs": 0.5}
    },
    "userProfile": {
      "subscription": {"status": "premium"}
    }
  }'
```

## 📊 API Endpoints

### Base URL
```
https://us-central1-your-project.cloudfunctions.net/groq/api/groq
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/test` | GET | Test connectivity |
| `/workout-suggestions` | POST | Generate workout plans |
| `/nutrition-suggestions` | POST | Generate nutrition plans |
| `/achievement-goals` | POST | Generate achievement goals |

### Request Format

All endpoints expect a JSON body with:
```json
{
  "userData": {
    // User-specific data (exercise history, nutrition goals, etc.)
  },
  "userProfile": {
    "subscription": {
      "status": "basic|premium|admin"
    }
  }
}
```

### Response Format

```json
{
  "success": true,
  "suggestions": "AI-generated suggestions in JSON format",
  "usage": {
    "prompt_tokens": 1234,
    "completion_tokens": 567,
    "total_tokens": 1801
  }
}
```

## 💰 Cost Monitoring

### Rate Limits

| User Type | Daily | Weekly | Monthly |
|-----------|-------|--------|---------|
| Basic | 1 | 4 | 16 |
| Premium | 10 | 50 | 200 |
| Admin | 50 | 250 | 1000 |

### Cost Estimation

- **Input tokens**: ~2,000 per request
- **Output tokens**: ~800 per request
- **Cost per request**: ~$0.00018 (0.018 cents)
- **Monthly cost (100 users)**: ~$0.20-0.65

## 🔒 Security

### API Key Protection

1. **Never commit API keys** - `.env` is in `.gitignore`
2. **Use environment variables** - Not hardcoded in source
3. **Rate limiting** - Per-user limits based on subscription
4. **Input validation** - All user data is validated

### Rate Limiting

The system includes basic rate limiting based on user subscription type. You can enhance this by:

1. Implementing actual usage tracking in Firestore
2. Adding daily/weekly/monthly counters
3. Blocking requests when limits are exceeded

## 🚨 Troubleshooting

### Common Issues

1. **"GROQ_API_KEY not configured"**
   - Check your `.env` file exists
   - Verify the API key is correct
   - Restart your development server

2. **"Rate limit exceeded"**
   - Check user subscription status
   - Implement actual rate limiting if needed

3. **"Request timeout"**
   - Increase timeout in `groq-config.js`
   - Check network connectivity

4. **"Invalid JSON response"**
   - Check the AI response format
   - Add error handling for malformed responses

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=groq:*
```

## 📈 Next Steps

1. **Integrate with Frontend**
   - Add API calls to your React components
   - Implement loading states and error handling
   - Add user feedback for suggestions

2. **Enhance Rate Limiting**
   - Track actual usage in Firestore
   - Implement proper daily/weekly/monthly limits
   - Add usage analytics

3. **Optimize Prompts**
   - Test different prompt variations
   - Adjust temperature and token limits
   - Add more context for better suggestions

4. **Add Caching**
   - Cache responses for 24 hours
   - Reduce API calls and costs
   - Improve response times

## 🎯 Example Usage

### Frontend Integration (Future)

```javascript
// Example of how you might call the API from your frontend
const generateWorkoutSuggestions = async (userData, userProfile) => {
  try {
    const response = await fetch('/api/groq/workout-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, userProfile })
    });
    
    const result = await response.json();
    if (result.success) {
      return JSON.parse(result.suggestions);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    // Fall back to current "if-then" logic
  }
};
```

## 📞 Support

If you encounter issues:

1. Check the Firebase Functions logs: `firebase functions:log`
2. Run the test script: `node scripts/test-groq-api.js`
3. Verify your API key is working on the Groq dashboard
4. Check your Firebase project configuration

---

**Happy coding! 🚀** 