import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Medal, Apple, Dumbbell, User, Bug, Target, Crown, Settings, RefreshCw, Shield } from 'lucide-react';
import LevelDisplay from '../gamification/LevelDisplay';
import useAuthStore from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import useLibrary from '../../hooks/fetchLibrary';
import useHistory from '../../hooks/fetchHistory';
import { validateUserXP } from '../../services/gamification/levelService';
import { useToast } from '../../hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ensureAvailableEquipment } from '../../utils/dataUtils';
import DebugControls from './DebugControls';
import AdminControlsModal from './AdminControlsModal';
import NutritionGoals from './NutritionGoals';
import EquipmentModal from './EquipmentModal';
import SubscriptionStatus from './SubscriptionStatus';

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 200, fat: 60, fiber: 25 };

// Define equipment options for each category
const bodyweightOptions = [
  'body weight',
  'band',
  'medicine ball',
  'roller',
  'wheel roller',
  'stability ball',
  // Add more accessories as needed
];
const gymOptions = [
  'dumbbell',
  'barbell',
  'cable',
  'leverage machine',
  'sled machine',
  'ez barbell',
  'weighted (e.g. weight vest, ankle weights)',
  // Accessories also available in gym
  'band',
  'medicine ball',
  'roller',
  'wheel roller',
  'stability ball',
  // Add more gym equipment as needed
];
const cardioOptions = [
  'stationary bike',
  'upper body ergometer',
  'elliptical machine',
  'skierg machine',
  // Add more cardio machines as needed
];

export default function ProfileModal({ open, onOpenChange }) {
  const { user, userProfile, saveUserProfile, fixXPDiscrepancy, recalculateAndSyncXP, migrateMuscleScores, isAdmin, toggleSubscriptionStatus, ensureSubscriptionField } = useAuthStore();
  const { toast } = useToast();
  const [tab, setTab] = useState('achievements');
  const [goals, setGoals] = useState(userProfile?.goals || DEFAULT_GOALS);
  const exerciseLibrary = useLibrary('exercise');
  const exerciseHistory = useHistory('exercise', exerciseLibrary.items);
  const foodHistory = useHistory('food');
  const [availableEquipment, setAvailableEquipment] = useState(ensureAvailableEquipment(userProfile?.availableEquipment));
  const [profile, setProfile] = useState({
    name: userProfile?.name || user?.displayName || '',
    email: user?.email || '',
    timeZone: userProfile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  });
  const [xpValidation, setXpValidation] = useState(null);
  const [equipmentCategory, setEquipmentCategory] = useState('bodyweight');
  const [selectedBodyweight, setSelectedBodyweight] = useState(availableEquipment.bodyweight || []);
  const [selectedGym, setSelectedGym] = useState(availableEquipment.gym || []);
  const [selectedCardio, setSelectedCardio] = useState(availableEquipment.cardio || []);

  // Get all unique equipment options from the exercise library
  const equipmentOptions = React.useMemo(() => {
    if (!exerciseLibrary.items) return [];
    const all = exerciseLibrary.items.map(e => e.equipment).filter(Boolean);
    return Array.from(new Set(all)).sort();
  }, [exerciseLibrary.items]);

  // Initialize availableEquipment to all options if empty
  useEffect(() => {
    if (open && equipmentOptions.length > 0 && (!availableEquipment || availableEquipment.length === 0)) {
      setAvailableEquipment(equipmentOptions);
    }
    // eslint-disable-next-line
  }, [open, equipmentOptions.length]);

  // Auto-validate XP when modal opens
  useEffect(() => {
    if (open && !exerciseHistory.loading && !foodHistory.loading) {
      // Small delay to ensure all data is loaded
      const timer = setTimeout(() => {
        validateXP();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, exerciseHistory.loading, foodHistory.loading]);

  // Save handlers
  const handleSaveGoals = () => {
    saveUserProfile({ ...userProfile, goals });
    onOpenChange(false);
  };
  const handleSaveEquipment = () => {
    const newAvailableEquipment = ensureAvailableEquipment({
      bodyweight: selectedBodyweight,
      gym: selectedGym,
      cardio: selectedCardio,
    });
    setAvailableEquipment(newAvailableEquipment);
    saveUserProfile({ ...userProfile, availableEquipment: newAvailableEquipment });
    onOpenChange(false);
  };
  const handleSaveProfile = () => {
    saveUserProfile({ ...userProfile, ...profile });
    onOpenChange(false);
  };

  // Checkbox handler
  const handleCheckboxChange = (equipment) => {
    if (availableEquipment.includes(equipment)) {
      setAvailableEquipment(availableEquipment.filter(e => e !== equipment));
    } else {
      setAvailableEquipment([...availableEquipment, equipment]);
    }
  };

  // XP validation and fix functions
  const validateXP = () => {
    const validation = validateUserXP(userProfile, exerciseHistory.logs, foodHistory.logs);
    setXpValidation(validation);
  };

  const handleFixXP = async () => {
    if (xpValidation && !xpValidation.isValid) {
      await fixXPDiscrepancy(exerciseHistory.logs, foodHistory.logs);
      setXpValidation(null);
    }
  };

  const handleSyncXP = async () => {
    await recalculateAndSyncXP(exerciseHistory.logs, foodHistory.logs);
    setXpValidation(null);
  };

  const handleMigrateMuscleScores = async () => {
    try {
      await migrateMuscleScores(exerciseHistory.logs, exerciseLibrary.items);
      toast({
        title: "Muscle scores updated!",
        description: "Your muscle scores have been migrated to the new time-based format."
      });
    } catch (error) {
      console.error("Error migrating muscle scores:", error);
      toast({
        title: "Migration failed",
        description: "There was an error updating your muscle scores.",
        variant: "destructive"
      });
    }
  };

  // Robust default for goals
  const currentGoals = userProfile?.goals || goals || DEFAULT_GOALS;

  // Replace the Goliath Tab content with category-based equipment selection
  const handleBodyweightCheckboxChange = (option) => {
    if (selectedBodyweight.includes(option)) {
      setSelectedBodyweight(selectedBodyweight.filter(e => e !== option));
    } else {
      setSelectedBodyweight([...selectedBodyweight, option]);
    }
  };

  const handleGymCheckboxChange = (option) => {
    if (selectedGym.includes(option)) {
      setSelectedGym(selectedGym.filter(e => e !== option));
    } else {
      setSelectedGym([...selectedGym, option]);
    }
  };

  const handleCardioCheckboxChange = (option) => {
    if (selectedCardio.includes(option)) {
      setSelectedCardio(selectedCardio.filter(e => e !== option));
    } else {
      setSelectedCardio([...selectedCardio, option]);
    }
  };

  // Add validation and disable Save button if any set is empty
  const gymInvalid = selectedGym.length === 0;
  const cardioInvalid = selectedCardio.length === 0;

  const isAdminUser = isAdmin();

  // Admin functions
  const handleToggleSubscription = async () => {
    try {
      await toggleSubscriptionStatus();
      toast({
        title: "Subscription Status Updated",
        description: "Your subscription status has been changed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription status.",
        variant: "destructive",
      });
    }
  };

  const handleEnsureSubscription = async () => {
    try {
      await ensureSubscriptionField();
      toast({
        title: "Subscription Field Ensured",
        description: "Subscription field has been created/verified.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ensure subscription field.",
        variant: "destructive",
      });
    }
  };

  const getSubscriptionStatus = () => {
    const status = userProfile?.subscription?.status || 'basic';
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

  const { icon: StatusIcon, label: statusLabel, color: statusColor } = getSubscriptionStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full mt-2">
          <TabsList className="grid grid-cols-5 gap-2 mb-4">
            <TabsTrigger value="achievements">
              <Medal className="inline-block mr-1" /> Achievements
            </TabsTrigger>
            <TabsTrigger value="nutrition">
              <Apple className="inline-block mr-1" /> Nutrition
            </TabsTrigger>
            <TabsTrigger value="goliath">
              <Dumbbell className="inline-block mr-1" /> Goliath
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="inline-block mr-1" /> Profile
            </TabsTrigger>
            {isAdminUser && (
              <TabsTrigger value="admin">
                <Crown className="inline-block mr-1" /> Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <LevelDisplay
              totalXP={userProfile?.totalXP || 0}
              workoutLogs={userProfile?.workoutLogs || []}
              accountCreationDate={user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : undefined}
              className="mb-4"
            />
            <DebugControls
              onValidateXP={validateXP}
              onFixXP={handleFixXP}
              onSyncXP={handleSyncXP}
              onMigrateMuscleScores={handleMigrateMuscleScores}
              xpValidation={xpValidation}
              loading={exerciseHistory.loading || foodHistory.loading || exerciseLibrary.loading}
              userProfile={userProfile}
              exerciseHistory={exerciseHistory}
              foodHistory={foodHistory}
            />
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            {/* New NutritionGoals component for testing */}
            <NutritionGoals
              goals={goals}
              setGoals={setGoals}
              onSave={handleSaveGoals}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          {/* Goliath Tab (Equipment) */}
          <TabsContent value="goliath">
            {/* New EquipmentModal component for testing */}
            <EquipmentModal
              equipmentCategory={equipmentCategory}
              setEquipmentCategory={setEquipmentCategory}
              selectedBodyweight={selectedBodyweight}
              setSelectedBodyweight={setSelectedBodyweight}
              selectedGym={selectedGym}
              setSelectedGym={setSelectedGym}
              selectedCardio={selectedCardio}
              setSelectedCardio={setSelectedCardio}
              gymInvalid={gymInvalid}
              cardioInvalid={cardioInvalid}
              onSave={handleSaveEquipment}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Profile Info</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <label className="w-20">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className="border rounded px-2 py-1 w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="border rounded px-2 py-1 w-40 bg-gray-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20">Time Zone</label>
                  <input
                    type="text"
                    value={profile.timeZone}
                    onChange={e => setProfile({ ...profile, timeZone: e.target.value })}
                    className="border rounded px-2 py-1 w-40"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile}>Save Profile</Button>
              </div>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          {isAdminUser && (
            <TabsContent value="admin">
              <SubscriptionStatus status={userProfile?.subscription?.status || 'basic'} />
              <AdminControlsModal
                user={user}
                userProfile={userProfile}
                onToggleSubscription={handleToggleSubscription}
                onEnsureSubscription={handleEnsureSubscription}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 