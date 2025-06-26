import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Crown } from 'lucide-react';
import MuscleMap from './MuscleMap';
import useAuthStore from '../../store/useAuthStore';
import { muscleMapping } from '../../utils/muscleMapping';
import { getMuscleScore } from '../../services/muscleScoreService';

// Your hardcoded preview muscle scores (based on your current state)
const PREVIEW_MUSCLE_SCORES = {
  'quads': 0.8,
  'hamstrings': 0.6,
  'calves': 0.7,
  'glutes': 0.9,
  'abs': 0.5,
  'lower_back': 0.4,
  'upper_back': 0.6,
  'chest': 0.7,
  'shoulders': 0.8,
  'biceps': 0.6,
  'triceps': 0.5,
  'forearms': 0.3
};

export default function PaywalledMuscleChart({ className = "" }) {
  const { userProfile, isPremium, isAdmin } = useAuthStore();

  const { normalizedScores, rawScores, isPreview } = useMemo(() => {
    if (isPremium()) {
      // Use real user data for premium users
      const libraryScores = userProfile?.muscleScores || {};
      
      // Map library muscle scores to SVG muscle scores
      const svgScores = {};
      
      Object.entries(muscleMapping).forEach(([svgMuscle, libraryMuscles]) => {
        let totalScore = 0;
        libraryMuscles.forEach(libraryMuscle => {
          const score = getMuscleScore(libraryScores, libraryMuscle, 'lifetime');
          if (score > 0) {
            totalScore += score;
          }
        });
        if (totalScore > 0) {
          svgScores[svgMuscle] = totalScore;
        }
      });

      const normalized = { ...svgScores };
      const maxScore = Math.max(...Object.values(normalized).filter(v => typeof v === 'number'), 1);
      
      if (maxScore > 0) {
        for (const muscle in normalized) {
          normalized[muscle] = (normalized[muscle] || 0) / maxScore;
        }
      }

      return { normalizedScores: normalized, rawScores: svgScores, isPreview: false };
    } else {
      // Use preview data for free users
      return { 
        normalizedScores: PREVIEW_MUSCLE_SCORES, 
        rawScores: PREVIEW_MUSCLE_SCORES, 
        isPreview: true 
      };
    }
  }, [userProfile, isPremium]);

  const handleUpgrade = () => {
    // TODO: Implement Stripe checkout
    console.log('Upgrade to premium clicked');
  };

  const subscriptionStatus = userProfile?.subscription?.status || 'basic';

  return (
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
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                <Unlock className="h-3 w-3 mr-1" />
                {subscriptionStatus === 'admin' ? 'Admin' : 'Premium'}
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
          <div className={`w-full aspect-[5/3] ${isPreview ? 'opacity-90' : ''}`}>
            <MuscleMap 
              muscleScores={normalizedScores}
              rawMuscleScores={rawScores}
            />
          </div>
          
          {isPreview && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          )}
        </div>
        
        {isPreview && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">
                  Unlock Your Personal Muscle Analytics
                </div>
                <div className="text-blue-700">
                  This preview shows example muscle development. Upgrade to Premium to see your actual muscle training progress, 
                  track imbalances, and get personalized recommendations.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!isPreview && (
          <div className="mt-3 text-xs text-gray-500">
            Your personal muscle development based on training history. Darker areas indicate more training volume.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 