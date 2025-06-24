import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Medal, Apple, Dumbbell, User } from 'lucide-react';
import LevelDisplay from './LevelDisplay';
import useAuthStore from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import useLibrary from '../hooks/fetchLibrary';

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 200, fat: 60, fiber: 25 };

export default function ProfileModal({ open, onOpenChange }) {
  const { user, userProfile, saveUserProfile } = useAuthStore();
  const [tab, setTab] = useState('achievements');
  const [goals, setGoals] = useState(userProfile?.goals || DEFAULT_GOALS);
  const exerciseLibrary = useLibrary('exercise');
  const [availableEquipment, setAvailableEquipment] = useState(userProfile?.availableEquipment || []);
  const [profile, setProfile] = useState({
    name: userProfile?.name || user?.displayName || '',
    email: user?.email || '',
    timeZone: userProfile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  });

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

  // Save handlers
  const handleSaveGoals = () => {
    saveUserProfile({ ...userProfile, goals });
    onOpenChange(false);
  };
  const handleSaveEquipment = () => {
    saveUserProfile({ ...userProfile, availableEquipment });
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

  // Robust default for goals
  const currentGoals = userProfile?.goals || goals || DEFAULT_GOALS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full mt-2">
          <TabsList className="grid grid-cols-4 gap-2 mb-4">
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
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <LevelDisplay
              totalXP={userProfile?.totalXP || 0}
              workoutLogs={userProfile?.workoutLogs || []}
              accountCreationDate={user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : undefined}
              className="mb-4"
            />
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Daily Nutrition Goals</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(currentGoals).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="capitalize w-20">{key}</label>
                    <input
                      type="number"
                      value={goals[key] || ''}
                      onChange={e => setGoals({ ...goals, [key]: Number(e.target.value) })}
                      className="border rounded px-2 py-1 w-24"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSaveGoals}>Save Nutrition Goals</Button>
              </div>
            </div>
          </TabsContent>

          {/* Goliath Tab (Equipment) */}
          <TabsContent value="goliath">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Available Equipment</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {equipmentOptions.length === 0 && <div className="col-span-full">No equipment options found.</div>}
                {equipmentOptions.map(option => {
                  const selected = availableEquipment.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleCheckboxChange(option)}
                      className={`px-3 py-2 rounded border text-sm font-medium transition-colors
                        ${selected ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50'}
                        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSaveEquipment}>Save Equipment</Button>
              </div>
            </div>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 