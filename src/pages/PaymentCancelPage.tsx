import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Crown, XCircle } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  const handleReturn = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    // This would typically open the upgrade modal again
    // For now, just return to the main page
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Your payment was cancelled. No charges were made to your account.
            </p>
            <p className="text-gray-600">
              You can still use all basic features of the app. Upgrade to
              Premium anytime to unlock advanced features!
            </p>
          </div>

          <div className="bg-equipment p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Premium Features You're Missing
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Advanced muscle analytics</li>
              <li>• Unlimited exercise hiding</li>
              <li>• Personalized workout suggestions</li>
              <li>• Priority customer support</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleTryAgain}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Try Upgrade Again
            </Button>
            <Button onClick={handleReturn} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
