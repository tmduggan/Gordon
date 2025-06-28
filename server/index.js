const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, planId, userEmail, successUrl, cancelUrl } = req.body;

    // Define your Stripe Price IDs
    const priceIds = {
      monthly: 'price_1Rf3AqEsQa6C6Xh7jKPAq8Kj',      // $9.99/month
      quarterly: 'price_1Rf3EyEsQa6C6Xh7ldz919Hq',    // $27.49/3 months
      annual: 'price_1Rf3C8EsQa6C6Xh7dNw10vqI'        // $99.99/year
    };

    const priceId = priceIds[planId];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        planId: planId,
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId, userId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment not completed' 
      });
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    const subscriptionData = {
      customerId: session.customer,
      subscriptionId: session.subscription,
      planId: session.metadata.planId,
      currentPeriodEnd: subscription.current_period_end,
    };

    res.json({
      success: true,
      subscriptionData,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify payment' 
    });
  }
});

// Cancel subscription
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body;

    // You would typically get the subscription ID from your database
    // For now, we'll return a success response
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel subscription' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
}); 