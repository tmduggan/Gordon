import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

export default function useUserProfile(user) {
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const fetchProfile = async () => {
      const ref = doc(db, 'userProfile', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserProfile(snap.data());
      } else {
        // Create default profile
        const defaultProfile = {
          goals: defaultGoals,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          pinnedFoods: []
        };
        await setDoc(ref, defaultProfile);
        setUserProfile(defaultProfile);
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Save userProfile to Firestore
  const saveUserProfile = async (profile) => {
    if (!user) return;
    const ref = doc(db, 'userProfile', user.uid);
    await setDoc(ref, profile);
    setUserProfile(profile);
  };

  const getUserTimezone = () => userProfile?.timezone || 'UTC';

  return { userProfile, profileLoading, saveUserProfile, defaultGoals, getUserTimezone };
}