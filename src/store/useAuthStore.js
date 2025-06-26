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
          totalXP: 0, // Initialize total XP
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
          recipes: [],
          totalXP: 0, // Initialize total XP
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

  // Add XP to user's total (for both exercise and food)
  addXP: async (xpAmount) => {
    const { userProfile } = get();
    if (!userProfile) {
      console.warn('Cannot add XP: no user profile found');
      return;
    }
    
    const currentXP = userProfile.totalXP || 0;
    const newXP = currentXP + xpAmount;
    
    console.log(`Adding XP: current=${currentXP}, adding=${xpAmount}, new=${newXP}`);
    
    const newProfile = { ...userProfile, totalXP: newXP };
    await get().saveUserProfile(newProfile);
    
    console.log(`Added ${xpAmount} XP. New total: ${newXP}`);
  },

  // Migrate muscle scores to new time-based format
  migrateMuscleScores: async (exerciseLogs = [], exerciseLibrary = []) => {
    const { userProfile } = get();
    if (!userProfile) {
      console.warn('Cannot migrate muscle scores: no user profile found');
      return;
    }

    // Import the migration function
    const { migrateMuscleScores, calculateTimeBasedMuscleScores } = await import('../services/muscleScoreService');
    
    console.log('Starting muscle score migration...');
    
    let newMuscleScores;
    
    // Check if we need to migrate from old format or recalculate from logs
    const hasOldFormat = userProfile.muscleScores && 
      Object.values(userProfile.muscleScores).some(score => typeof score === 'number');
    
    if (hasOldFormat) {
      // Migrate from old single-value format
      console.log('Migrating from old single-value format...');
      newMuscleScores = migrateMuscleScores(userProfile.muscleScores);
    } else if (exerciseLogs.length > 0 && exerciseLibrary.length > 0) {
      // Recalculate from historical logs
      console.log('Recalculating from historical logs...');
      newMuscleScores = calculateTimeBasedMuscleScores(exerciseLogs, exerciseLibrary);
    } else {
      // Initialize empty structure
      console.log('Initializing empty muscle score structure...');
      newMuscleScores = {};
    }
    
    const updatedProfile = { ...userProfile, muscleScores: newMuscleScores };
    await get().saveUserProfile(updatedProfile);
    
    console.log('Muscle score migration completed');
    return newMuscleScores;
  },

  // Fix XP discrepancies by recalculating from all logs
  fixXPDiscrepancy: async (exerciseLogs = [], foodLogs = []) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    // Import the validation function
    const { recalculateTotalXPFromLogs, validateUserXP } = await import('../services/levelService');
    
    const validation = validateUserXP(userProfile, exerciseLogs, foodLogs);
    
    if (!validation.isValid) {
      console.log(`XP discrepancy detected: stored=${validation.storedXP}, calculated=${validation.calculatedXP}, difference=${validation.discrepancy}`);
      
      const correctedProfile = { ...userProfile, totalXP: validation.calculatedXP };
      await get().saveUserProfile(correctedProfile);
      
      console.log(`Fixed XP discrepancy. New total: ${validation.calculatedXP}`);
      return validation.calculatedXP;
    }
    
    console.log('XP validation passed - no discrepancy found');
    return validation.storedXP;
  },

  // Manually recalculate and sync total XP from all logs
  recalculateAndSyncXP: async (exerciseLogs = [], foodLogs = []) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    // Import the recalculation function
    const { recalculateTotalXPFromLogs } = await import('../services/levelService');
    
    const calculatedXP = recalculateTotalXPFromLogs(exerciseLogs, foodLogs);
    const currentXP = userProfile.totalXP || 0;
    
    console.log(`Recalculating XP: current=${currentXP}, calculated=${calculatedXP}`);
    
    if (calculatedXP !== currentXP) {
      const correctedProfile = { ...userProfile, totalXP: calculatedXP };
      await get().saveUserProfile(correctedProfile);
      
      console.log(`Synced XP to calculated total: ${calculatedXP}`);
      return calculatedXP;
    }
    
    console.log('XP already in sync');
    return currentXP;
  },

  // Toggle a pinned food with optimistic updates
  togglePinFood: async (foodId) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    const currentPinned = userProfile.pinnedFoods || [];
    const isCurrentlyPinned = currentPinned.includes(foodId);
    const newPinned = isCurrentlyPinned
      ? currentPinned.filter(id => id !== foodId)
      : [...currentPinned, foodId];
      
    // Optimistically update the UI immediately
    const optimisticProfile = { ...userProfile, pinnedFoods: newPinned };
    set({ userProfile: optimisticProfile });
    
    // Then update Firestore in the background
    try {
      const newProfile = { ...userProfile, pinnedFoods: newPinned };
      await get().saveUserProfile(newProfile);
    } catch (error) {
      console.error("Error updating pinned foods:", error);
      // Revert optimistic update on error
      set({ userProfile });
    }
  },

  // Toggle a pinned exercise with optimistic updates
  togglePinExercise: async (exerciseId) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    const currentPinned = userProfile.pinnedExercises || [];
    const isCurrentlyPinned = currentPinned.includes(exerciseId);
    const newPinned = isCurrentlyPinned
      ? currentPinned.filter(id => id !== exerciseId)
      : [...currentPinned, exerciseId];
      
    // Optimistically update the UI immediately
    const optimisticProfile = { ...userProfile, pinnedExercises: newPinned };
    set({ userProfile: optimisticProfile });
    
    // Then update Firestore in the background
    try {
      const newProfile = { ...userProfile, pinnedExercises: newPinned };
      await get().saveUserProfile(newProfile);
    } catch (error) {
      console.error("Error updating pinned exercises:", error);
      // Revert optimistic update on error
      set({ userProfile });
    }
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