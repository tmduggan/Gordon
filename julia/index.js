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
