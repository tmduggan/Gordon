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
    const userDocRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        set({ userProfile: snap.data(), loading: false });
      } else {
        // Handle case where user exists but has no profile yet
        console.log("No user profile found, creating a default one.");
        const defaultProfile = {
          goals: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
          pinnedFoods: [],
          pinnedExercises: []
        };
        await setDoc(userDocRef, defaultProfile); // Create the profile
        set({ userProfile: defaultProfile, loading: false });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      set({ loading: false });
    }
  },

  // Save the user's profile
  saveUserProfile: async (profile) => {
    const user = get().user;
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, profile, { merge: true });
      set({ userProfile: profile });
      console.log("User profile saved successfully.");
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
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

  // Toggle a pinned exercise
  togglePinExercise: async (exerciseId) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    const currentPinned = userProfile.pinnedExercises || [];
    const newPinned = currentPinned.includes(exerciseId)
      ? currentPinned.filter(id => id !== exerciseId)
      : [...currentPinned, exerciseId];
      
    const newProfile = { ...userProfile, pinnedExercises: newPinned };
    await get().saveUserProfile(newProfile);
  },

}));

export default useAuthStore; 