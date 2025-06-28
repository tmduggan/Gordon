import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, ArrowRight } from 'lucide-react';
import { verifyAndUpdateSubscription } from '../services/payment/paymentService';
import { useToast } from '../hooks/useToast';
import useAuthStore from '../store/useAuthStore';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No payment session found.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to complete your upgrade.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Verify payment and update subscription
    const verifyPayment = async () => {
      try {
        await verifyAndUpdateSubscription(sessionId, user.uid);
        setIsSuccess(true);
        toast({
          title: "Welcome to Premium!",
          description: "Your subscription has been activated successfully.",
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Payment Verification Failed",
          description: "Please contact support if you were charged.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    verifyPayment();
  }, [searchParams, user, navigate, toast]);

  const handleContinue = () => {
    navigate('/');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Processing Your Payment</h2>
            <p className="text-gray-600">Please wait while we verify your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Premium!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isSuccess ? (
            <>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                  <Crown className="h-5 w-5" />
                  Premium Subscription Activated
                </div>
                <p className="text-gray-600">
                  Your premium subscription has been successfully activated. You now have access to all premium features!
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Explore advanced muscle analytics</li>
                  <li>• Hide exercises without limits</li>
                  <li>• Get personalized workout suggestions</li>
                  <li>• Access priority customer support</li>
                </ul>
              </div>

              <Button 
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue to App
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                There was an issue processing your payment. Please contact support if you were charged.
              </p>
              <Button onClick={handleContinue} variant="outline" className="w-full">
                Return to App
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 