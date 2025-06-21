import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

const useAuthStore = create((set, get) => ({
  // --- STATE ---
  user: null,
  userProfile: null,
  loading: true,

  // --- ACTIONS ---
  
  // Initialize the auth state listener
  init: () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ user });
        get().fetchUserProfile(user.uid);
      } else {
        set({ user: null, userProfile: null, loading: false });
      }
    });
  },

  // Fetch the user's profile from Firestore
  fetchUserProfile: async (uid) => {
    set({ loading: true });
    const ref = doc(db, 'userProfile', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      set({ userProfile: snap.data(), loading: false });
    } else {
      // Create a default profile if one doesn't exist
      const defaultProfile = {
        goals: defaultGoals,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pinnedFoods: []
      };
      await setDoc(ref, defaultProfile);
      set({ userProfile: defaultProfile, loading: false });
    }
  },

  // Save the user's profile
  saveUserProfile: async (profile) => {
    const { user } = get();
    if (!user) return;
    const ref = doc(db, 'userProfile', user.uid);
    await setDoc(ref, profile);
    set({ userProfile: profile });
  },

  // Toggle a pinned food
  togglePinFood: async (foodId) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    const currentPinned = userProfile.pinnedFoods || [];
    const newPinned = currentPinned.includes(foodId)
      ? currentPinned.filter(id => id !== foodId)
      : [...currentPinned, foodId];
      
    const newProfile = { ...userProfile, pinnedFoods: newPinned };
    await get().saveUserProfile(newProfile);
  },

}));

export default useAuthStore; 