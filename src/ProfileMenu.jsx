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

export default function ProfileMenu() {
  const { user, userProfile, saveUserProfile } = useAuthStore();
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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