import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { auth } from '@/firebase';
import useAuthStore from '@/store/useAuthStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bug,
  ChefHat,
  Crown,
  Dumbbell,
  EyeOff,
  LogOut,
  Pencil,
  RefreshCw,
  Settings,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import {
  approveExerciseSubmission,
  getPendingSubmissions,
  rejectExerciseSubmission,
} from '../../services/exercise/exerciseSubmissionService';
import ExerciseLibraryModal from '../admin/ExerciseLibraryModal';
import HiddenExercisesModal from './HiddenExercisesModal';
import ProfileModal from './ProfileModal';
import RecipeManagementModal from './RecipeManagementModal';

export default function ProfileMenu() {
  const {
    user,
    userProfile,
    isAdmin,
    getRemainingHides,
    toggleSubscriptionStatus,
    ensureSubscriptionField,
  } = useAuthStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHiddenExercises, setShowHiddenExercises] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState<'basic' | 'premium' | 'admin' | null>(null);
  const [showExerciseLibraryModal, setShowExerciseLibraryModal] =
    useState(false);
  const { toast } = useToast();
  const [showAdminSubmissionsModal, setShowAdminSubmissionsModal] =
    useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [showRecipesModal, setShowRecipesModal] = useState(false);

  React.useEffect(() => {
    if (isAdmin()) {
      getPendingSubmissions()
        .then((subs) => {
          setPendingSubmissions(subs);
          setPendingCount(subs.length);
        })
        .catch(() => setPendingCount(0));
    }
  }, [isAdmin]);

  if (!user || !userProfile) {
    return <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />;
  }

  // Get profile image with fallback
  const getProfileImage = () => {
    if (user.photoURL) {
      return user.photoURL;
    }
    return '/default-avatar.svg';
  };

  // Get subscription status display (simulate if admin is toggling)
  const getSubscriptionStatus = () => {
    const status =
      simulatedStatus || userProfile.subscription?.status || 'basic';
    switch (status) {
      case 'admin':
        return {
          label: 'Admin',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Crown,
        };
      case 'premium':
        return {
          label: 'Premium',
          color: 'bg-status-success text-status-success border-status-success',
          icon: Crown,
        };
      case 'basic':
      default:
        return {
          label: 'Basic',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: User,
        };
    }
  };

  const subscriptionInfo = getSubscriptionStatus();
  const remainingHides =
    simulatedStatus === 'basic'
      ? 2
      : simulatedStatus === 'premium'
        ? '∞'
        : getRemainingHides();
  const isAdminUser = isAdmin();

  // Calculate recipe count with max of 99
  const recipeCount = Math.min(userProfile.recipes?.length || 0, 99);

  // Only for admin: cycle simulated view
  const handleToggleSimulatedStatus = () => {
    if (!isAdminUser) return;
    setSimulatedStatus((prev) => {
      if (prev === null) return 'basic';
      if (prev === 'basic') return 'premium';
      if (prev === 'premium') return 'admin';
      return null; // back to real
    });
    toast({
      title: 'Simulated User Type Changed',
      description: 'You are now viewing the app as a different user type.',
    });
  };

  // Only for admin: cycle actual subscription status
  const handleCycleActualStatus = async () => {
    if (!isAdminUser) return;
    try {
      await toggleSubscriptionStatus();
      toast({
        title: 'Subscription Status Updated',
        description:
          'Your actual subscription status has been changed in the database.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription status.',
        variant: 'destructive',
      });
    }
  };

  // Debug function to log current user profile
  const handleDebugProfile = () => {
    toast({
      title: 'Profile Debugged',
      description: 'Check the browser console for user profile details.',
    });
  };

  // Ensure subscription field exists
  const handleEnsureSubscription = async () => {
    try {
      await ensureSubscriptionField();
      toast({
        title: 'Subscription Field Ensured',
        description:
          'Subscription field has been created/verified in your profile.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to ensure subscription field.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenAdminSubmissions = async () => {
    try {
      const submissions = await getPendingSubmissions();
      setPendingSubmissions(submissions);
      setCurrentSubmissionIndex(0);
      setShowAdminSubmissionsModal(true);
      setShowDropdown(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load submissions.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (submission: any) => {
    try {
      await approveExerciseSubmission(submission.id, user.uid);
      toast({
        title: 'Approved',
        description: `Exercise "${submission.name}" has been approved and added to the library.`,
      });
      // Remove from pending list
      setPendingSubmissions((prev) =>
        prev.filter((s) => s.id !== submission.id)
      );
      setPendingCount((prev) => prev - 1);
      if (currentSubmissionIndex >= pendingSubmissions.length - 1) {
        setCurrentSubmissionIndex(Math.max(0, currentSubmissionIndex - 1));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve submission.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (submission: any) => {
    try {
      await rejectExerciseSubmission(submission.id, user.uid);
      toast({
        title: 'Rejected',
        description: `Exercise "${submission.name}" has been rejected.`,
      });
      // Remove from pending list
      setPendingSubmissions((prev) =>
        prev.filter((s) => s.id !== submission.id)
      );
      setPendingCount((prev) => prev - 1);
      if (currentSubmissionIndex >= pendingSubmissions.length - 1) {
        setCurrentSubmissionIndex(Math.max(0, currentSubmissionIndex - 1));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject submission.',
        variant: 'destructive',
      });
    }
  };

  const currentSubmission = pendingSubmissions[currentSubmissionIndex] as any;

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
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.svg';
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open Profile Menu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 p-1"
                >
                  {/* User Info Header */}
                  <div className="px-3 py-2 border-b border-gray-200">
                    <div className="text-sm font-medium">
                      {user.displayName || user.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {isAdminUser ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={`focus:outline-none ${subscriptionInfo.color} rounded px-2 py-1 flex items-center gap-1 border`}
                                onClick={handleCycleActualStatus}
                              >
                                <subscriptionInfo.icon className="h-3 w-3 mr-1" />
                                {subscriptionInfo.label}
                                <Pencil className="h-3 w-3 ml-1 text-blue-500" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span>
                                Click to cycle your actual subscription status
                                (Basic → Premium → Admin → Basic)
                              </span>
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
                      <div className="text-xs text-blue-600 mt-1">
                        Simulating:{' '}
                        {simulatedStatus.charAt(0).toUpperCase() +
                          simulatedStatus.slice(1)}
                      </div>
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
                    {userProfile.hiddenExercises && userProfile.hiddenExercises.length > 0 && (
                      <Badge className={`ml-auto text-xs ${subscriptionInfo.color}`}>
                        {userProfile.hiddenExercises.length}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowRecipesModal(true);
                      setShowDropdown(false);
                    }}
                    className="w-full justify-start"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Recipes
                    <Badge className="ml-auto text-xs">
                      {recipeCount}
                    </Badge>
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
                        onClick={handleOpenAdminSubmissions}
                        className="w-full justify-start bg-status-success hover:bg-status-success/90"
                      >
                        <Dumbbell className="h-4 w-4 mr-2" />
                        View Submissions
                        <Badge className="ml-auto text-xs">
                          {pendingCount}
                        </Badge>
                      </Button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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

      {showRecipesModal && (
        <RecipeManagementModal
          open={showRecipesModal}
          onOpenChange={setShowRecipesModal}
        />
      )}

      {/* Admin Submissions Modal */}
      {showAdminSubmissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Exercise Submissions Review</h2>
              <Button
                variant="ghost"
                onClick={() => setShowAdminSubmissionsModal(false)}
              >
                ×
              </Button>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No pending submissions to review.
                </p>
                <Button
                  onClick={() => setShowAdminSubmissionsModal(false)}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            ) : currentSubmission ? (
              <div>
                {/* Navigation */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">
                    Submission {currentSubmissionIndex + 1} of{' '}
                    {pendingSubmissions.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentSubmissionIndex(
                          Math.max(0, currentSubmissionIndex - 1)
                        )
                      }
                      disabled={currentSubmissionIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentSubmissionIndex(
                          Math.min(
                            pendingSubmissions.length - 1,
                            currentSubmissionIndex + 1
                          )
                        )
                      }
                      disabled={
                        currentSubmissionIndex === pendingSubmissions.length - 1
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Submission Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Exercise Name
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded">
                      {currentSubmission.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Target Muscle
                      </label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">
                        {currentSubmission.target}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Body Part
                      </label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">
                        {currentSubmission.bodyPart}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">
                        {currentSubmission.category}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Difficulty
                      </label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">
                        {currentSubmission.difficulty}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Equipment
                      </label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">
                        {currentSubmission.equipment}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ID
                      </label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">
                        {currentSubmission.id}
                      </p>
                    </div>
                  </div>

                  {currentSubmission.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">
                        {currentSubmission.description}
                      </p>
                    </div>
                  )}

                  {currentSubmission.instructions && currentSubmission.instructions.map((instruction: string, index: number) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Instructions
                      </label>
                      <ol className="mt-1 space-y-1">
                        <li
                          key={index}
                          className="p-2 bg-gray-50 rounded"
                        >
                          {index + 1}. {instruction}
                        </li>
                      </ol>
                    </div>
                  ))}

                  {currentSubmission.secondaryMuscles && currentSubmission.secondaryMuscles.map((muscle: string, index: number) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Secondary Muscles
                      </label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge key={index} className="mr-1">
                          {muscle}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  <div className="text-sm text-gray-500">
                    <p>Submitted by: {currentSubmission.submittedBy}</p>
                    <p>
                      Submitted at:{' '}
                      {new Date(currentSubmission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(currentSubmission)}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(currentSubmission)}
                    className="bg-status-success hover:bg-status-success/90"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
