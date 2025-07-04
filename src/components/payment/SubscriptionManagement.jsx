import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, CreditCard, Settings, AlertTriangle } from 'lucide-react';
import { cancelSubscription } from '../../services/payment/paymentService';
import { useToast } from '../../hooks/useToast';
import useAuthStore from '../../store/useAuthStore';
import PremiumUpgradeModal from './PremiumUpgradeModal';

export default function SubscriptionManagement({ adminDetails }) {
  const { user, userProfile } = useAuthStore();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const subscription = userProfile?.subscription;
  const isPremium = subscription?.status === 'premium';
  const isAdmin = subscription?.status === 'admin';

  const handleCancelSubscription = async () => {
    if (!user) return;

    setIsCancelling(true);
    try {
      await cancelSubscription(user.uid);
      toast({
        title: "Subscription Cancelled",
        description: "Your premium subscription has been cancelled. You'll still have access until the end of your billing period.",
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'basic':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Plan:</span>
            <Badge className={getStatusColor(subscription?.status)}>
              {subscription?.status === 'admin' && <Crown className="h-3 w-3 mr-1" />}
              {subscription?.status?.charAt(0).toUpperCase() + subscription?.status?.slice(1) || 'Basic'}
            </Badge>
          </div>

          {/* Features (right-aligned) */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Features:</span>
            <span className="text-sm">{Array.isArray(subscription?.features) ? subscription.features.join(', ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Features'}</span>
          </div>

          {/* Expires (right-aligned) */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expires:</span>
            <span className="text-sm">{subscription?.expiresAt ? formatDate(subscription.expiresAt) : 'Never'}</span>
          </div>

          {/* Plan Details */}
          {isPremium && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plan:</span>
                <span className="text-sm">{subscription?.plan === 'monthly' ? 'Monthly Premium' : 'Yearly Premium'}</span>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {!isPremium && !isAdmin && (
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}
            {isPremium && (
              <Button 
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                variant="outline"
                className="w-full"
              >
                {isCancelling ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Cancelling...
                  </div>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </>
                )}
              </Button>
            )}
            {isAdmin && (
              <div className="text-center text-sm text-gray-500">
                Admin accounts have access to all features
              </div>
            )}
          </div>

          {/* Info */}
          {isPremium && (
            <div className="mt-4 p-3 bg-equipment border border-equipment rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <div className="font-medium mb-1">Subscription Cancellation</div>
                  <div>
                    Cancelling your subscription will downgrade you to Basic at the end of your current billing period. 
                    You'll lose access to premium features but can upgrade again anytime.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <PremiumUpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </>
  );
} 