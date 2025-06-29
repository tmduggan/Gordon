const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkAndFixUserProfile(userId) {
  try {
    console.log(`Checking profile for user: ${userId}`);
    
    // Get the user's profile
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('User profile does not exist');
      return;
    }
    
    const userData = userDoc.data();
    console.log('Current user profile:', JSON.stringify(userData, null, 2));
    
    // Check if subscription field exists
    if (!userData.subscription) {
      console.log('No subscription field found, creating basic subscription...');
      await db.collection('users').doc(userId).update({
        subscription: {
          status: 'basic',
          plan: 'basic',
          expiresAt: null,
          features: ['basic_logging', 'basic_tracking'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
      console.log('Basic subscription created');
    } else {
      console.log('Subscription field exists:', userData.subscription);
      
      // Check if user should be premium based on Stripe data
      // For now, let's manually set them to premium if they paid
      console.log('Setting user to premium status...');
      await db.collection('users').doc(userId).update({
        subscription: {
          status: 'premium',
          plan: 'monthly', // or whatever plan they chose
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          features: [
            'basic_logging',
            'basic_tracking', 
            'premium_analytics',
            'unlimited_hides',
            'advanced_insights',
            'priority_support'
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
      console.log('User set to premium status');
    }
    
    // Get updated profile
    const updatedDoc = await db.collection('users').doc(userId).get();
    console.log('Updated profile:', JSON.stringify(updatedDoc.data(), null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
const userId = 'thqhp64Fj1Sw9gsElXObOg1IrNl1';
checkAndFixUserProfile(userId).then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 