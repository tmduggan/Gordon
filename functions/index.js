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

functions.setGlobalOptions({ maxInstances: 10 });

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
