import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
        // The listener is now set up here and will manage its own lifecycle.
        const unsubscribe = get().listenForUserProfile(user.uid);
        // We can store the unsubscribe function if we need to call it on sign-out.
        // For simplicity, we'll let it detach when the user is gone.
      } else {
        set({ user: null, userProfile: null, loading: false });
      }
    });
  },

  // Set up a real-time listener for the user's profile
  listenForUserProfile: (uid) => {
    const userDocRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(userDocRef, async (snap) => {
      if (snap.exists()) {
        // --- DEBUGGING ---
        console.log("Auth store received profile update:", snap.data());
        // --- END DEBUGGING ---
        set({ userProfile: snap.data(), loading: false });
      } else {
        console.log("No user profile found, creating a default one.");
        const defaultProfile = {
          goals: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
          pinnedFoods: [],
          pinnedExercises: [],
          recipes: [],
          muscleScores: {}, // Initialize with empty scores
        };
        await setDoc(userDocRef, defaultProfile);
        set({ userProfile: defaultProfile, loading: false });
      }
    }, (error) => {
      console.error("Error listening to user profile:", error);
      set({ loading: false });
    });
    return unsubscribe; // Return the unsubscribe function
  },

  // Fetch the user's profile from Firestore (no longer the primary method)
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
          pinnedExercises: [],
          recipes: []
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
      // The listener will automatically pick up this change.
      // We no longer need to manually set the state here.
      await setDoc(userDocRef, profile, { merge: true });
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

  // Add a new recipe
  addRecipe: async (recipe) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    const currentRecipes = userProfile.recipes || [];
    const newRecipes = [...currentRecipes, recipe];
    
    const newProfile = { ...userProfile, recipes: newRecipes };
    await get().saveUserProfile(newProfile);
  },

  // Delete a recipe
  deleteRecipe: async (recipeId) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    const currentRecipes = userProfile.recipes || [];
    const newRecipes = currentRecipes.filter(recipe => recipe.id !== recipeId);
    
    const newProfile = { ...userProfile, recipes: newRecipes };
    await get().saveUserProfile(newProfile);
  },

}));

export default useAuthStore; 