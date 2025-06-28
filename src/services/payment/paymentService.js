import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Premium subscription plans - Updated to match your Stripe product
export const PREMIUM_PLANS = {
  monthly: {
    id: 'goliath_premium_monthly',
    name: 'Monthly Premium',
    price: 9.99,
    interval: 'month',
    description: 'Full access to all premium features'
  },
  quarterly: {
    id: 'goliath_premium_3month',
    name: '3-Month Premium',
    price: 27.49,
    interval: '3 months',
    description: 'Full access to all premium features (Save 8%)'
  },
  annual: {
    id: 'goliath_premium_annual',
    name: 'Annual Premium',
    price: 99.99,
    interval: 'year',
    description: 'Full access to all premium features (Save 17%)'
  }
};

// API base URL - always use the live Firebase Functions endpoint
const API_BASE_URL = 'https://us-central1-food-tracker-19c9d.cloudfunctions.net/api';

/**
 * Create a Stripe checkout session for premium upgrade
 * @param {string} userId - Firebase user ID
 * @param {string} planId - Plan ID (monthly, quarterly, or annual)
 * @param {string} userEmail - User's email address
 * @returns {Promise<Object>} Checkout session data
 */
export async function createCheckoutSession(userId, planId, userEmail) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planId,
        userEmail,
        successUrl: `${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/?payment_result=cancel`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Update user subscription status after successful payment
 * @param {string} userId - Firebase user ID
 * @param {Object} subscriptionData - Subscription data from Stripe
 */
export async function updateUserSubscription(userId, subscriptionData) {
  try {
    const userRef = doc(db, 'users', userId);
    
    const subscriptionUpdate = {
      subscription: {
        status: 'premium',
        plan: subscriptionData.planId,
        stripeCustomerId: subscriptionData.customerId,
        stripeSubscriptionId: subscriptionData.subscriptionId,
        expiresAt: new Date(subscriptionData.currentPeriodEnd * 1000).toISOString(),
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
    };

    await updateDoc(userRef, subscriptionUpdate);
    console.log('User subscription updated successfully');
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

/**
 * Verify payment session and update user subscription
 * @param {string} sessionId - Stripe session ID
 * @param {string} userId - Firebase user ID
 */
export async function verifyAndUpdateSubscription(sessionId, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const result = await response.json();
    
    if (result.success) {
      await updateUserSubscription(userId, result.subscriptionData);
      return result;
    } else {
      throw new Error(result.error || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}

/**
 * Cancel user subscription
 * @param {string} userId - Firebase user ID
 */
export async function cancelSubscription(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    const result = await response.json();
    
    if (result.success) {
      // Update user profile to basic
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscription: {
          status: 'basic',
          plan: 'basic',
          expiresAt: null,
          features: ['basic_logging', 'basic_tracking'],
          updatedAt: new Date().toISOString()
        }
      });
      
      return result;
    } else {
      throw new Error(result.error || 'Failed to cancel subscription');
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
} 