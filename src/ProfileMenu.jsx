import React, { useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import DailyGoalsModal from './DailyGoalsModal';
import { auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from './hooks/use-toast';
import { calculateWorkoutScore } from './services/scoringService';
import useLibrary from './hooks/fetchLibrary';
import useHistory from './hooks/fetchHistory';

export default function ProfileMenu() {
  const { user, userProfile, saveUserProfile } = useAuthStore();
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { toast } = useToast();
  
  // Get exercise data for recalculation
  const exerciseLibrary = useLibrary('exercise');
  const exerciseHistory = useHistory('exercise', exerciseLibrary.items);

  const recalculateAllScores = async () => {
    if (!userProfile || !exerciseLibrary?.items || !exerciseHistory?.logs) {
      toast({
        title: 'Error',
        description: 'Unable to recalculate scores. Please try again.',
        variant: 'destructive'
      });
      return;
    }
    
    const muscleScores = {};

    // Helper to process a comma-separated muscle string
    const processMuscleString = (muscleString, score) => {
      if (!muscleString) return;
      muscleString.split(',').forEach(muscle => {
        const name = muscle.trim().toLowerCase();
        if (!name) return;
        muscleScores[name] = (muscleScores[name] || 0) + score;
      });
    };

    // Recalculate scores for all logs
    exerciseHistory.logs.forEach(log => {
      const exercise = exerciseLibrary.items.find(e => e.id === log.exerciseId) || {};
      const score = calculateWorkoutScore(log, exerciseHistory.logs, exercise, userProfile);

      // Process target muscle(s)
      processMuscleString(exercise.target, score);

      // Process secondary muscles (array or string)
      if (Array.isArray(exercise.secondaryMuscles)) {
        exercise.secondaryMuscles.forEach(sec => processMuscleString(sec, score));
      } else if (typeof exercise.secondaryMuscles === 'string') {
        processMuscleString(exercise.secondaryMuscles, score);
      }
    });

    // Save to user profile
    const updatedProfile = { ...userProfile, muscleScores };
    await saveUserProfile(updatedProfile);
    toast({ 
      title: 'Muscle scores recalculated!', 
      description: 'Profile updated with new scores.' 
    });
    setShowDropdown(false);
  };

  if (!user || !userProfile) return null;

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-sm">{user.displayName || user.email}</span>
          
          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <img
                    src={user.photoURL || '/default-avatar.png'}
                    alt="Profile"
                    className="w-10 h-10 rounded-full cursor-pointer"
                    onClick={() => setShowDropdown(!showDropdown)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open Profile Menu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 p-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowGoalsModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full justify-start"
                >
                  Daily Goals
                </Button>
                <Button
                  variant="ghost"
                  onClick={recalculateAllScores}
                  className="w-full justify-start"
                >
                  Recalculate Scores
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => auth.signOut()}
                  className="w-full justify-start"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
      
      {showGoalsModal && (
        <DailyGoalsModal
          initialGoals={userProfile.goals}
          onSave={saveUserProfile}
          onClose={() => setShowGoalsModal(false)}
        />
      )}
    </>
  );
} 