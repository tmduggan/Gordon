import React, { useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import ProfileModal from './components/DailyGoalsModal';
import { auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from './hooks/use-toast';

export default function ProfileMenu() {
  const { user, userProfile, saveUserProfile } = useAuthStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { toast } = useToast();

  if (!user || !userProfile) return null;

  // Get profile image with fallback
  const getProfileImage = () => {
    if (user.photoURL) {
      return user.photoURL;
    }
    return '/default-avatar.svg';
  };

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
                    src={getProfileImage()}
                    alt="Profile"
                    className="w-10 h-10 rounded-full cursor-pointer border border-gray-200"
                    onClick={() => setShowDropdown(!showDropdown)}
                    onError={(e) => {
                      e.target.src = '/default-avatar.svg';
                    }}
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
                    setShowProfileModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full justify-start"
                >
                  Profile
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
      {showProfileModal && (
        <ProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
        />
      )}
    </>
  );
} 