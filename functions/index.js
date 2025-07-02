// Add this as the very first line:
process.env.FIREBASE_FUNCTIONS_RUNTIME = "nodejs18";
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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || functions.config().stripe.secret);
const admin = require('firebase-admin');
const fetch = require('node-fetch');

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

admin.initializeApp();

// Updated refreshExerciseDbGifs with pagination, batching, and name-matching
exports.refreshExerciseDbGifs = functions.https.onRequest(async (req, res) => {
  try {
    console.log('Function started: Fetching all exercises from ExerciseDB');
    // 1. Fetch all exercises from ExerciseDB using pagination
    let allExercises = [];
    let offset = 0;
    const limit = 100;
    while (true) {
      const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises?offset=${offset}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': '3c9d909f7cmsh41ac528c20d2fa5p1cfdb4jsnab216ecf29e8',
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      });
      const exercises = await response.json();
      if (!Array.isArray(exercises) || exercises.length === 0) break;
      allExercises = allExercises.concat(exercises);
      offset += exercises.length;
      if (exercises.length < limit) break; // last page
    }
    console.log(`Fetched ${allExercises.length} exercises from ExerciseDB`);

    // 2. Fetch all Firestore exerciseLibrary docs
    const exerciseLibraryRef = admin.firestore().collection('exerciseLibrary');
    const snapshot = await exerciseLibraryRef.get();
    const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 3. Prepare updates: match by 'id' field (string or number)
    const updates = [];
    let unmatched = [];
    for (const ex of allExercises) {
      // ExerciseDB id is a string, Firestore id may be string or number
      const exId = ex.id ? String(ex.id) : undefined;
      const match = allDocs.find(doc => doc.id && String(doc.id) === exId);
      if (match && ex.gifUrl) {
        updates.push({ docRef: exerciseLibraryRef.doc(match.id), data: { gifUrl: ex.gifUrl } });
      } else {
        unmatched.push(exId);
      }
    }
    console.log(`Prepared ${updates.length} updates for Firestore`);
    if (unmatched.length > 0) {
      console.log(`No match for these ExerciseDB ids:`, unmatched.slice(0, 20)); // log first 20 unmatched for brevity
    }

    // 4. Batch updates in chunks of 500
    const batchSize = 500;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = admin.firestore().batch();
      const chunk = updates.slice(i, i + batchSize);
      chunk.forEach(({ docRef, data }) => batch.set(docRef, data, { merge: true }));
      await batch.commit();
      console.log(`Committed batch ${i / batchSize + 1}`);
    }

    res.status(200).send(`ExerciseDB GIF URLs refreshed! Updated ${updates.length} exercises.`);
  } catch (err) {
    console.error('Function error:', err);
    res.status(500).send('Failed to refresh ExerciseDB GIF URLs');
  }
});

// Scheduled function to run every 24 hours
exports.scheduledGifRefresh = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/Los_Angeles') // Set your timezone if needed
  .onRun(async (context) => {
    try {
      console.log('Scheduled GIF refresh started: Fetching all exercises from ExerciseDB');
      let allExercises = [];
      let offset = 0;
      const limit = 100;
      while (true) {
        const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises?offset=${offset}&limit=${limit}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': '3c9d909f7cmsh41ac528c20d2fa5p1cfdb4jsnab216ecf29e8',
            'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
          }
        });
        const exercises = await response.json();
        if (!Array.isArray(exercises) || exercises.length === 0) break;
        allExercises = allExercises.concat(exercises);
        offset += exercises.length;
        if (exercises.length < limit) break;
      }
      console.log(`Fetched ${allExercises.length} exercises from ExerciseDB`);

      const exerciseLibraryRef = admin.firestore().collection('exerciseLibrary');
      const snapshot = await exerciseLibraryRef.get();
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const updates = [];
      for (const ex of allExercises) {
        const exId = ex.id ? String(ex.id) : undefined;
        const match = allDocs.find(doc => doc.id && String(doc.id) === exId);
        if (match && ex.gifUrl) {
          updates.push({ docRef: exerciseLibraryRef.doc(match.id), data: { gifUrl: ex.gifUrl } });
        }
      }

      const batchSize = 500;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const chunk = updates.slice(i, i + batchSize);
        chunk.forEach(({ docRef, data }) => batch.set(docRef, data, { merge: true }));
        await batch.commit();
      }

      console.log(`Scheduled GIF refresh complete. Updated ${updates.length} exercises.`);
    } catch (err) {
      console.error('Scheduled GIF refresh error:', err);
    }
    return null;
  });
