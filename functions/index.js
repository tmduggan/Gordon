/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require('axios');
const cors = require('cors')({origin: true});
const express = require('express');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const GroqService = require('./groq-service');
const refreshExerciseDbGifsCore = require('./refreshExerciseDbGifs');

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
functions.setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// The following environment variables are automatically made available by
// a .env file during deployment.
const { NUTRITIONIX_APP_ID, NUTRITIONIX_API_KEY } = process.env;

const NUTRITIONIX_BASE_URL = 'https://trackapi.nutritionix.com/v2';

exports.nutritionixInstantSearch = onRequest((req, res) => {
    cors(req, res, async () => {
        const { query } = req.query;
        if (!query) {
            return res.status(400).send('Missing query parameter');
        }

        logger.info(`Instant search for query: ${query}`, {structuredData: true});

        try {
            const response = await axios.get(`${NUTRITIONIX_BASE_URL}/search/instant`, {
                headers: {
                    'x-app-id': NUTRITIONIX_APP_ID,
                    'x-app-key': NUTRITIONIX_API_KEY
                },
                params: { query }
            });
            res.status(200).send(response.data);
        } catch (error) {
            logger.error('Error calling Nutritionix instant search API:', error);
            res.status(500).send('Error proxying request to Nutritionix API');
        }
    });
});

exports.nutritionixFullNutrition = onRequest((req, res) => {
    cors(req, res, async () => {
        const { nix_item_id, food_name } = req.query;

        if (!nix_item_id && !food_name) {
            return res.status(400).send('Missing nix_item_id or food_name parameter');
        }

        logger.info(`Full nutrition search for: ${nix_item_id || food_name}`, {structuredData: true});
        
        try {
            let response;
            if (nix_item_id) {
                 response = await axios.get(`${NUTRITIONIX_BASE_URL}/search/item`, {
                    headers: {
                        'x-app-id': NUTRITIONIX_APP_ID,
                        'x-app-key': NUTRITIONIX_API_KEY
                    },
                    params: { nix_item_id }
                });
            } else {
                response = await axios.post(`${NUTRITIONIX_BASE_URL}/natural/nutrients`, {
                    query: food_name
                }, {
                    headers: {
                        'x-app-id': NUTRITIONIX_APP_ID,
                        'x-app-key': NUTRITIONIX_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });
            }
            res.status(200).send(response.data);
        } catch (error) {
            logger.error('Error calling Nutritionix full nutrition API:', error);
            res.status(500).send('Error proxying request to Nutritionix API');
        }
    });
});

exports.nutritionixNutrients = onRequest((req, res) => {
    cors(req, res, async () => {
        const { query } = req.query;
        if (!query) {
            return res.status(400).send('Missing query parameter');
        }

        logger.info(`Nutrients search for query: ${query}`, {structuredData: true});

        try {
            const response = await axios.post(`${NUTRITIONIX_BASE_URL}/natural/nutrients`, {
                query: query
            }, {
                headers: {
                    'x-app-id': NUTRITIONIX_APP_ID,
                    'x-app-key': NUTRITIONIX_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            res.status(200).send(response.data);
        } catch (error) {
            logger.error('Error calling Nutritionix nutrients API:', error);
            res.status(500).send('Error proxying request to Nutritionix API');
        }
    });
});

// --- STRIPE PAYMENT ENDPOINTS ---
const paymentApp = express();
paymentApp.use(cors);
paymentApp.use(express.json());

const priceIds = {
  monthly: 'price_1Rf3AqEsQa6C6Xh7jKPAq8Kj',      // $9.99/month
  quarterly: 'price_1Rf3EyEsQa6C6Xh7ldz919Hq',    // $27.49/3 months
  annual: 'price_1Rf3C8EsQa6C6Xh7dNw10vqI'        // $99.99/year
};

paymentApp.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, planId, userEmail, successUrl, cancelUrl } = req.body;
    const priceId = priceIds[planId];
    if (!priceId) return res.status(400).json({ error: 'Invalid plan ID' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      metadata: { userId, planId },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

paymentApp.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Payment not completed' });
    }
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const subscriptionData = {
      customerId: session.customer,
      subscriptionId: session.subscription,
      planId: session.metadata.planId,
      currentPeriodEnd: subscription.current_period_end,
    };
    res.json({ success: true, subscriptionData });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

paymentApp.post('/api/cancel-subscription', async (req, res) => {
  try {
    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(paymentApp);

// --- GROQ AI ENDPOINTS ---
const groqApp = express();
groqApp.use(cors);
groqApp.use(express.json());

// Initialize Groq service
const groqService = new GroqService();

// Rate limiting helper
const checkRateLimit = (userProfile, endpoint) => {
  const limits = {
    basic: { daily: 1, weekly: 4, monthly: 16 },
    premium: { daily: 10, weekly: 50, monthly: 200 },
    admin: { daily: 50, weekly: 250, monthly: 1000 }
  };
  
  const userType = userProfile?.subscription?.status || 'basic';
  const userLimits = limits[userType];
  
  // For now, return true (implement actual rate limiting later)
  return { allowed: true, limits: userLimits };
};

// Generate workout suggestions
groqApp.post('/api/groq/workout-suggestions', async (req, res) => {
  try {
    const { userData, userProfile } = req.body;
    
    if (!userData) {
      return res.status(400).json({ error: 'Missing user data' });
    }
    
    // Check rate limits
    const rateLimit = checkRateLimit(userProfile, 'workout');
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    logger.info('Generating workout suggestions via Groq API', { structuredData: true });
    
    const result = await groqService.generateWorkoutSuggestions(userData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        suggestions: result.content,
        usage: result.usage
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error generating workout suggestions:', error);
    res.status(500).json({ error: 'Failed to generate workout suggestions' });
  }
});

// Generate nutrition suggestions
groqApp.post('/api/groq/nutrition-suggestions', async (req, res) => {
  try {
    const { userData, userProfile } = req.body;
    
    if (!userData) {
      return res.status(400).json({ error: 'Missing user data' });
    }
    
    // Check rate limits
    const rateLimit = checkRateLimit(userProfile, 'nutrition');
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    logger.info('Generating nutrition suggestions via Groq API', { structuredData: true });
    
    const result = await groqService.generateNutritionSuggestions(userData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        suggestions: result.content,
        usage: result.usage
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error generating nutrition suggestions:', error);
    res.status(500).json({ error: 'Failed to generate nutrition suggestions' });
  }
});

// Generate achievement goals
groqApp.post('/api/groq/achievement-goals', async (req, res) => {
  try {
    const { userData, userProfile } = req.body;
    
    if (!userData) {
      return res.status(400).json({ error: 'Missing user data' });
    }
    
    // Check rate limits
    const rateLimit = checkRateLimit(userProfile, 'achievements');
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    logger.info('Generating achievement goals via Groq API', { structuredData: true });
    
    const result = await groqService.generateAchievementGoals(userData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        suggestions: result.content,
        usage: result.usage
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error generating achievement goals:', error);
    res.status(500).json({ error: 'Failed to generate achievement goals' });
  }
});

// Test endpoint for Groq API connectivity
groqApp.get('/api/groq/test', async (req, res) => {
  try {
    const testPrompt = "Hello, this is a test. Please respond with 'Groq API is working!'";
    const result = await groqService.makeRequest(testPrompt);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Groq API is connected and working',
        response: result.content,
        usage: result.usage
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Groq API connection failed'
      });
    }
  } catch (error) {
    logger.error('Groq API test failed:', error);
    res.status(500).json({ error: 'Groq API test failed' });
  }
});

// Export the Groq app as a Firebase Function
exports.groq = functions.https.onRequest(groqApp);

admin.initializeApp();

// Use only environment variable for ExerciseDB API key
const EXERCISEDB_API_KEY = process.env.EXERCISEDB_API_KEY;

exports.refreshExerciseDbGifs = functions.https.onRequest({ timeoutSeconds: 300 }, async (req, res) => {
  try {
    const updatedCount = await refreshExerciseDbGifsCore(EXERCISEDB_API_KEY);
    res.status(200).send(`ExerciseDB GIF URLs refreshed! Updated ${updatedCount} exercises.`);
  } catch (err) {
    console.error('Function error:', err);
    res.status(500).send('Failed to refresh ExerciseDB GIF URLs');
  }
});

exports.scheduledGifRefresh = onSchedule(
  {
    // Run at 12:05 PM US Central Time (America/Chicago) every day
    schedule: '5 12 * * *',
    timeZone: 'America/Chicago',
  },
  async (event) => {
    try {
      await refreshExerciseDbGifsCore(EXERCISEDB_API_KEY);
    } catch (err) {
      console.error('Scheduled GIF refresh error:', err);
    }
    return null;
  }
);

exports.groqSuggestMeal = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    // First, let's test if the function can start at all
    console.log('groqSuggestMeal function started');
    
    const { foodLog, nutritionGoals } = req.body;
    console.log('Received request with foodLog:', foodLog, 'nutritionGoals:', nutritionGoals);
    
    // Test if GroqService can be instantiated
    const groqService = new GroqService();
    console.log('GroqService instantiated successfully');
    
    const prompt = `
You are a nutritionist. Based on the user's food log for today and their nutrition goals, suggest the next meal in the format: [qty,measurement,food], e.g. "100g oatmeal, 50g berries".
Use grams for all quantities. Suggest 2-4 foods that help balance macros and fill gaps. Only output the meal suggestion, no extra text.

User food log so far: ${foodLog}
Nutrition goals: ${nutritionGoals}
Current time: ${new Date().toLocaleTimeString()}
    `;
    
    console.log('Making request to Groq API...');
    const response = await groqService.makeRequest(prompt, { maxTokens: 100 });
    console.log('Groq API response received:', response);
    
    if (!response.success) {
      console.error('Groq API error:', response.error);
      return res.status(500).json({ error: response.error || 'GROQ API error' });
    }
    
    res.json({ suggestion: response.content.trim() });
  } catch (error) {
    console.error('GROQ meal suggestion error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Proxy exercise GIFs to handle CORS
exports.exerciseGif = onRequest({ cors: true }, async (req, res) => {
  try {
    const { exerciseId, resolution = '360' } = req.query;
    
    if (!exerciseId) {
      return res.status(400).json({ error: 'exerciseId is required' });
    }

    // Validate resolution
    if (!['360', '1080'].includes(resolution)) {
      return res.status(400).json({ error: 'resolution must be 360 or 1080' });
    }

    const apiKey = process.env.EXERCISEDB_API_KEY || '3c9d909f7cmsh41ac528c20d2fa5p1cfdb4jsnab216ecf29e8';
    if (!apiKey) {
      return res.status(500).json({ error: 'ExerciseDB API key not configured' });
    }

    // Construct ExerciseDB image URL
    const imageUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=${resolution}&rapidapi-key=${apiKey}&t=${Date.now()}`;
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    // Get the image buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Set appropriate headers
    res.set({
      'Content-Type': response.headers.get('content-type') || 'image/gif',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    });

    // Send the image
    res.send(Buffer.from(imageBuffer));
    
  } catch (error) {
    console.error('Error proxying exercise GIF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test and validate exercise GIF URLs
exports.testAndRefreshGifs = onRequest({ cors: true }, async (req, res) => {
  try {
    const { sampleSize = 10 } = req.query;
    
    // Get a sample of exercises from Firestore
    const db = admin.firestore();
    const exercisesSnapshot = await db.collection('exerciseLibrary').limit(parseInt(sampleSize)).get();
    
    if (exercisesSnapshot.empty) {
      return res.status(404).json({ error: 'No exercises found in library' });
    }
    
    const exercises = exercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let validGifs = 0;
    let invalidGifs = 0;
    const missingGifs = [];
    
    // Test a sample of GIF URLs
    for (const exercise of exercises) {
      const hasValidGifs = exercise.gifUrl_1080 && exercise.gifUrl_360;
      
      if (hasValidGifs) {
        // Test if the GIF URLs are accessible via our proxy
        try {
          const testUrl = `https://us-central1-food-tracker-19c9d.cloudfunctions.net/exerciseGif?exerciseId=${exercise.id}&resolution=360`;
          const testResponse = await fetch(testUrl, { method: 'HEAD' });
          
          if (testResponse.ok) {
            validGifs++;
          } else {
            invalidGifs++;
            missingGifs.push(exercise.id);
          }
        } catch (error) {
          invalidGifs++;
          missingGifs.push(exercise.id);
        }
      } else {
        invalidGifs++;
        missingGifs.push(exercise.id);
      }
    }
    
    const successRate = (validGifs / exercises.length) * 100;
    
    // If success rate is below 80%, trigger a refresh
    const needsRefresh = successRate < 80;
    
    let refreshResult = null;
    if (needsRefresh) {
      try {
        console.log(`GIF success rate: ${successRate.toFixed(1)}% - triggering refresh`);
        refreshResult = await refreshExerciseDbGifsCore(EXERCISEDB_API_KEY);
      } catch (error) {
        console.error('Failed to refresh GIFs:', error);
        refreshResult = { error: error.message };
      }
    }
    
    res.json({
      success: true,
      testResults: {
        sampleSize: exercises.length,
        validGifs,
        invalidGifs,
        successRate: `${successRate.toFixed(1)}%`,
        missingGifIds: missingGifs
      },
      refreshTriggered: needsRefresh,
      refreshResult
    });
    
  } catch (error) {
    console.error('Error testing GIF URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
