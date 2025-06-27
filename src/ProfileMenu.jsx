import React, { useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import ProfileModal from './components/profile/DailyGoalsModal';
import HiddenExercisesModal from './components/profile/HiddenExercisesModal';
import ExerciseLibraryModal from './components/admin/ExerciseLibraryModal';
import { auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from './hooks/use-toast';
import { Crown, EyeOff, Settings, User, LogOut, Pencil, RefreshCw, Bug, Dumbbell } from 'lucide-react';

export default function ProfileMenu() {
  const { user, userProfile, isAdmin, getRemainingHides, toggleSubscriptionStatus, ensureSubscriptionField } = useAuthStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHiddenExercises, setShowHiddenExercises] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState(null); // null = real, else 'basic' or 'premium' or 'admin'
  const [showExerciseLibraryModal, setShowExerciseLibraryModal] = useState(false);
  const { toast } = useToast();

  if (!user || !userProfile) return null;

  // Get profile image with fallback
  const getProfileImage = () => {
    if (user.photoURL) {
      return user.photoURL;
    }
    return '/default-avatar.svg';
  };

  // Get subscription status display (simulate if admin is toggling)
  const getSubscriptionStatus = () => {
    const status = simulatedStatus || userProfile.subscription?.status || 'basic';
    switch (status) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Crown };
      case 'premium':
        return { label: 'Premium', color: 'bg-green-100 text-green-800 border-green-200', icon: Crown };
      case 'basic':
      default:
        return { label: 'Basic', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: User };
    }
  };

  const subscriptionInfo = getSubscriptionStatus();
  const remainingHides = simulatedStatus === 'basic' ? 2 : simulatedStatus === 'premium' ? '∞' : getRemainingHides();
  const isAdminUser = isAdmin();

  // Only for admin: cycle simulated view
  const handleToggleSimulatedStatus = () => {
    if (!isAdminUser) return;
    setSimulatedStatus(prev => {
      if (prev === null) return 'basic';
      if (prev === 'basic') return 'premium';
      if (prev === 'premium') return 'admin';
      return null; // back to real
    });
    toast({
      title: "Simulated User Type Changed",
      description: "You are now viewing the app as a different user type.",
    });
  };

  // Toggle actual subscription status in Firestore
  const handleToggleActualStatus = async () => {
    if (!isAdminUser) return;
    try {
      await toggleSubscriptionStatus();
      toast({
        title: "Subscription Status Updated",
        description: "Your actual subscription status has been changed in the database.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription status.",
        variant: "destructive",
      });
    }
  };

  // Debug function to log current user profile
  const handleDebugProfile = () => {
    toast({
      title: "Profile Debugged",
      description: "Check the browser console for user profile details.",
    });
  };

  // Ensure subscription field exists
  const handleEnsureSubscription = async () => {
    try {
      await ensureSubscriptionField();
      toast({
        title: "Subscription Field Ensured",
        description: "Subscription field has been created/verified in your profile.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ensure subscription field.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2">
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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 p-1">
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-gray-200">
                  <div className="text-sm font-medium">{user.displayName || user.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {isAdminUser ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={`focus:outline-none ${subscriptionInfo.color} rounded px-2 py-1 flex items-center gap-1 border`}
                              onClick={handleToggleSimulatedStatus}
                            >
                              <subscriptionInfo.icon className="h-3 w-3 mr-1" />
                              {subscriptionInfo.label}
                              <Pencil className="h-3 w-3 ml-1 text-blue-500" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>Click to simulate different user types</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge className={`text-xs ${subscriptionInfo.color}`}>
                        <subscriptionInfo.icon className="h-3 w-3 mr-1" />
                        {subscriptionInfo.label}
                      </Badge>
                    )}
                    {subscriptionInfo.label === 'Basic' && (
                      <span className="text-xs text-gray-500">
                        ({remainingHides} hides left)
                      </span>
                    )}
                  </div>
                  {isAdminUser && simulatedStatus !== null && (
                    <div className="text-xs text-blue-600 mt-1">Simulating: {simulatedStatus.charAt(0).toUpperCase() + simulatedStatus.slice(1)}</div>
                  )}
                </div>

                {/* Menu Items */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowHiddenExercises(true);
                    setShowDropdown(false);
                  }}
                  className="w-full justify-start"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hidden Exercises
                  {userProfile.hiddenExercises?.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {userProfile.hiddenExercises.length}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => auth.signOut()}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>

                {isAdminUser && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={handleToggleActualStatus}
                      className="w-full justify-start"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Toggle Actual Subscription Status
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleEnsureSubscription}
                      className="w-full justify-start"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Ensure Subscription Field
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleDebugProfile}
                      className="w-full justify-start"
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      Debug Profile
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowExerciseLibraryModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Exercise Library Management
                    </Button>
                  </>
                )}
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
      
      {/* Modals */}
      {showProfileModal && (
        <ProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
        />
      )}
      
      {showHiddenExercises && (
        <HiddenExercisesModal
          open={showHiddenExercises}
          onOpenChange={setShowHiddenExercises}
        />
      )}
      
      {showExerciseLibraryModal && (
        <ExerciseLibraryModal
          open={showExerciseLibraryModal}
          onOpenChange={setShowExerciseLibraryModal}
        />
      )}
    </>
  );
} 