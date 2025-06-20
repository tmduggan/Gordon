const axios = require('axios');
require('dotenv').config();

// Nutritionix API configuration - now using environment variables
const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID || '131fa0b3';
const NUTRITIONIX_APP_KEY = process.env.NUTRITIONIX_APP_KEY || '13e8901407aa8ed57df60306bf558875';

// The item ID extracted from the URL: 56516583253a118837b4fd0b
const ITEM_ID = '56516583253a118837b4fd0b';

async function getNutritionData() {
    try {
        console.log('Querying Nutritionix API for item ID:', ITEM_ID);
        console.log('Item URL: https://www.nutritionix.com/i/now/protein-powder-whey-protein-isolate-creamy-chocolate/56516583253a118837b4fd0b');
        console.log('---\n');

        // Method 1: Try to get item by ID (if the API supports it)
        try {
            const response = await axios.get(`https://trackapi.nutritionix.com/v2/search/item?nix_item_id=${ITEM_ID}`, {
                headers: {
                    'x-app-id': NUTRITIONIX_APP_ID,
                    'x-app-key': NUTRITIONIX_APP_KEY,
                    'x-remote-user-id': '0'
                }
            });

            console.log('✅ Successfully retrieved item by ID:');
            console.log(JSON.stringify(response.data, null, 2));
            return;
        } catch (error) {
            console.log('❌ Could not retrieve item by ID, trying search method...');
        }

        // Method 2: Search for the item by name
        const searchResponse = await axios.post('https://trackapi.nutritionix.com/v2/search/instant', {
            query: 'now protein powder whey protein isolate creamy chocolate',
            branded: true,
            common: false
        }, {
            headers: {
                'x-app-id': NUTRITIONIX_APP_ID,
                'x-app-key': NUTRITIONIX_APP_KEY,
                'x-remote-user-id': '0'
            }
        });

        console.log('✅ Search results:');
        console.log(JSON.stringify(searchResponse.data, null, 2));

        // Method 3: Try to get detailed info for the first branded result
        if (searchResponse.data.branded && searchResponse.data.branded.length > 0) {
            const firstResult = searchResponse.data.branded[0];
            console.log('\n---\n');
            console.log('🔍 Getting detailed info for first result:');
            console.log('Item name:', firstResult.food_name);
            console.log('Brand:', firstResult.brand_name);
            console.log('Item ID:', firstResult.nix_item_id);

            // Get detailed nutrition info
            const detailResponse = await axios.post('https://trackapi.nutritionix.com/v2/natural/nutrients', {
                query: `${firstResult.brand_name} ${firstResult.food_name}`,
                timezone: 'US/Eastern'
            }, {
                headers: {
                    'x-app-id': NUTRITIONIX_APP_ID,
                    'x-app-key': NUTRITIONIX_APP_KEY,
                    'x-remote-user-id': '0'
                }
            });

            console.log('\n✅ Detailed nutrition info:');
            console.log(JSON.stringify(detailResponse.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error querying Nutritionix API:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the script
getNutritionData(); 