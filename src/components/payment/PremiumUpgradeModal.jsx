import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Star, Zap, BarChart3, Eye, Shield } from 'lucide-react';
import { PREMIUM_PLANS, createCheckoutSession } from '../../services/payment/paymentService';
import { useToast } from '../../hooks/useToast';
import useAuthStore from '../../store/useAuthStore';

const PREMIUM_FEATURES = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Detailed muscle development tracking and insights'
  },
  {
    icon: Eye,
    title: 'Unlimited Exercise Hides',
    description: 'Hide exercises you don\'t want to see without limits'
  },
  {
    icon: Zap,
    title: 'Priority Workout Suggestions',
    description: 'AI-powered recommendations based on your progress'
  },
  {
    icon: Shield,
    title: 'Premium Support',
    description: 'Priority customer support and feature requests'
  }
];

export default function PremiumUpgradeModal({ open, onOpenChange }) {
  const { user, userProfile } = useAuthStore();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user || !userProfile) {
      toast({
        title: "Error",
        description: "Please sign in to upgrade to premium.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const session = await createCheckoutSession(
        user.uid,
        selectedPlan,
        user.email
      );

      // Redirect to Stripe checkout
      const stripe = await import('@stripe/stripe-js').then(m => m.loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY));
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to start payment process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanData = PREMIUM_PLANS[selectedPlan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Features Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Premium Features</h3>
              <div className="space-y-4">
                {PREMIUM_FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-equipment rounded-lg flex items-center justify-center">
                      <feature.icon className="h-4 w-4 text-equipment" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">What you'll get:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Unlimited exercise hiding
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Advanced muscle analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Personalized workout suggestions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Priority customer support
                </li>
              </ul>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Plan</h3>
              
              {/* Plan Selection */}
              <div className="grid grid-cols-1 gap-3 mb-6">
                {Object.entries(PREMIUM_PLANS).map(([key, plan]) => (
                  <Card
                    key={key}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPlan === 'monthly' 
                        ? 'ring-2 ring-primary bg-equipment'
                        : 'border-border hover:bg-accent'
                    }`}
                    onClick={() => setSelectedPlan(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">{plan.name}</div>
                          <div className="text-sm text-gray-600">{plan.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl">${plan.price}</div>
                          <div className="text-sm text-gray-600">per {plan.interval}</div>
                          {key === 'quarterly' && (
                            <Badge className="mt-1 bg-status-success text-status-success text-xs">
                              Save 17%
                            </Badge>
                          )}
                          {key === 'annual' && (
                            <Badge className="mt-1 bg-status-success text-status-success text-xs">
                              Save 25%
                            </Badge>
                          )}
                          {key === 'monthly' && (
                            <Badge className="mt-1 bg-status-success text-status-success text-xs">
                              Most Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Plan Details */}
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    {selectedPlanData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    ${selectedPlanData.price}
                    <span className="text-lg font-normal">/{selectedPlanData.interval}</span>
                  </div>
                  <p className="text-blue-100">{selectedPlanData.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Button */}
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Upgrade to Premium
                </div>
              )}
            </Button>

            <div className="text-center text-sm text-gray-500">
              Secure payment powered by Stripe
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 