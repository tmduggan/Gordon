import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Lock, Unlock } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import PremiumUpgradeModal from '../payment/PremiumUpgradeModal';
import MuscleChart from './muscleData/MuscleChart';

// Your hardcoded preview muscle scores (based on your current state)
const PREVIEW_MUSCLE_SCORES = {
  quads: 0.8,
  hamstrings: 0.6,
  calves: 0.7,
  glutes: 0.9,
  abs: 0.5,
  lower_back: 0.4,
  upper_back: 0.6,
  chest: 0.7,
  shoulders: 0.8,
  biceps: 0.6,
  triceps: 0.5,
  forearms: 0.3,
};

export default function PaywalledMuscleChart({ className = '' }) {
  const { userProfile, isPremium, isAdmin } = useAuthStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const subscriptionStatus = userProfile?.subscription?.status || 'basic';
  const isPreview = !isPremium();

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Muscle Analytics
              {isPreview && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Preview
                </Badge>
              )}
              {!isPreview && (
                <Badge className="bg-status-success text-status-success border-status-success text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium Feature
                </Badge>
              )}
            </CardTitle>

            {isPreview && (
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Crown className="h-4 w-4 mr-1" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="relative">
            <div
              className={`w-full aspect-[5/3] ${isPreview ? 'opacity-90' : ''}`}
            >
              <MuscleChart />
            </div>

            {isPreview && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            )}
          </div>

          {isPreview && (
            <div className="mt-4 p-3 bg-equipment border border-equipment rounded-lg">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">
                    Unlock Your Personal Muscle Analytics
                  </div>
                  <div className="text-blue-700">
                    This preview shows example muscle development. Upgrade to
                    Premium to see your actual muscle training progress, track
                    imbalances, and get personalized recommendations.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isPreview && (
            <div className="mt-3 text-xs text-gray-500">
              Your personal muscle development based on training history. Darker
              areas indicate more training volume.
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
