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
        const profileData = snap.data();
        
        // Ensure subscription field exists
        if (!profileData.subscription) {
          console.log('Subscription field missing in loaded profile, creating it...');
          const currentUser = get().user;
          const isAdminUser = currentUser?.email === 'timdug4@gmail.com';
          
          const updatedProfile = {
            ...profileData,
            subscription: {
              status: isAdminUser ? 'admin' : 'basic',
              plan: isAdminUser ? 'admin' : 'basic',
              expiresAt: null,
              features: isAdminUser ? ['all_features'] : ['basic_logging', 'basic_tracking']
            }
          };
          
          await setDoc(userDocRef, updatedProfile, { merge: true });
          set({ userProfile: updatedProfile, loading: false });
        } else {
          set({ userProfile: profileData, loading: false });
        }
      } else {
        console.log("No user profile found, creating a default one.");
        
        // Get current user to check if it's the admin
        const currentUser = get().user;
        const isAdminUser = currentUser?.email === 'timdug4@gmail.com';
        
        const defaultProfile = {
          goals: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
          pinnedFoods: [],
          pinnedExercises: [],
          favoriteExercises: [],
          recipes: [],
          muscleScores: {}, // Initialize with empty scores
          totalXP: 0, // Initialize total XP
          subscription: {
            status: isAdminUser ? 'admin' : 'basic', // Set admin for your email
            plan: isAdminUser ? 'admin' : 'basic',
            expiresAt: null,
            features: isAdminUser ? ['all_features'] : ['basic_logging', 'basic_tracking']
          },
          hiddenExercises: [], // Array of exercise IDs that user has manually hidden
          hideCount: {
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
            count: 0 // Reset daily
          }
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
        
        // Get current user to check if it's the admin
        const currentUser = get().user;
        const isAdminUser = currentUser?.email === 'timdug4@gmail.com';
        
        const defaultProfile = {
          goals: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
          pinnedFoods: [],
          pinnedExercises: [],
          favoriteExercises: [],
          recipes: [],
          totalXP: 0, // Initialize total XP
          subscription: {
            status: isAdminUser ? 'admin' : 'basic', // Set admin for your email
            plan: isAdminUser ? 'admin' : 'basic',
            expiresAt: null,
            features: isAdminUser ? ['all_features'] : ['basic_logging', 'basic_tracking']
          },
          hiddenExercises: [],
          hideCount: {
            date: new Date().toISOString().split('T')[0],
            count: 0
          }
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

  // Check if user is admin
  isAdmin: () => {
    const { user, userProfile } = get();
    return user?.email === 'timdug4@gmail.com' || // Replace with your email
           userProfile?.subscription?.status === 'admin';
  },

  // Check if user has premium access
  isPremium: () => {
    const { userProfile } = get();
    return userProfile?.subscription?.status === 'premium' || 
           userProfile?.subscription?.status === 'admin';
  },

  // Toggle subscription status (for testing)
  toggleSubscriptionStatus: async () => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    const currentStatus = userProfile.subscription?.status || 'basic';
    let newStatus;
    
    switch (currentStatus) {
      case 'basic':
        newStatus = 'premium';
        break;
      case 'premium':
        newStatus = 'admin';
        break;
      case 'admin':
        newStatus = 'basic';
        break;
      default:
        newStatus = 'basic';
    }
    
    const newProfile = {
      ...userProfile,
      subscription: {
        ...userProfile.subscription,
        status: newStatus,
        plan: newStatus === 'admin' ? 'admin' : newStatus
      }
    };
    
    await get().saveUserProfile(newProfile);
    console.log(`Subscription status changed to: ${newStatus}`);
  },

  // Hide an exercise from suggestions
  hideExercise: async (exerciseId) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    // Check daily hide limit for basic users
    const today = new Date().toISOString().split('T')[0];
    const hideCount = userProfile.hideCount || { date: today, count: 0 };
    
    // Reset count if it's a new day
    if (hideCount.date !== today) {
      hideCount.date = today;
      hideCount.count = 0;
    }
    
    // Check limit for basic users (2 hides per day)
    const isBasic = userProfile.subscription?.status === 'basic';
    const maxHides = isBasic ? 2 : Infinity;
    
    if (hideCount.count >= maxHides) {
      console.log(`Daily hide limit reached (${maxHides} hides per day)`);
      return false; // Indicate failure
    }
    
    // Add to hidden exercises
    const currentHidden = userProfile.hiddenExercises || [];
    if (!currentHidden.includes(exerciseId)) {
      const newHidden = [...currentHidden, exerciseId];
      const newHideCount = { ...hideCount, count: hideCount.count + 1 };
      
      const newProfile = {
        ...userProfile,
        hiddenExercises: newHidden,
        hideCount: newHideCount
      };
      
      await get().saveUserProfile(newProfile);
      console.log(`Exercise ${exerciseId} hidden. Hides today: ${newHideCount.count}/${maxHides}`);
      return true; // Indicate success
    }
    
    return true;
  },

  // Unhide an exercise from suggestions
  unhideExercise: async (exerciseId) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    const currentHidden = userProfile.hiddenExercises || [];
    const newHidden = currentHidden.filter(id => id !== exerciseId);
    
    const newProfile = {
      ...userProfile,
      hiddenExercises: newHidden
    };
    
    await get().saveUserProfile(newProfile);
    console.log(`Exercise ${exerciseId} unhidden`);
  },

  // Get remaining hides for today
  getRemainingHides: () => {
    const { userProfile } = get();
    if (!userProfile) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const hideCount = userProfile.hideCount || { date: today, count: 0 };
    
    // Reset count if it's a new day
    if (hideCount.date !== today) {
      return userProfile.subscription?.status === 'basic' ? 2 : Infinity;
    }
    
    const maxHides = userProfile.subscription?.status === 'basic' ? 2 : Infinity;
    return Math.max(0, maxHides - hideCount.count);
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
    const { addWorkoutToMuscleReps } = await import('../services/gamification/exerciseScoringService');
    
    console.log('Starting muscle score migration...');
    
    // Initialize empty muscle reps structure
    const newMuscleReps = {};
    
    const updatedProfile = { ...userProfile, muscleReps: newMuscleReps };
    await get().saveUserProfile(updatedProfile);
    
    console.log('Muscle score migration completed');
    return newMuscleReps;
  },

  // Fix XP discrepancies by recalculating from all logs
  fixXPDiscrepancy: async (exerciseLogs = [], foodLogs = []) => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    // Import the validation function
    const { recalculateTotalXPFromLogs, validateUserXP } = await import('../services/gamification/levelService');
    
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
    const { recalculateTotalXPFromLogs } = await import('../services/gamification/levelService');
    
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

  // Ensure subscription field exists in user profile
  ensureSubscriptionField: async () => {
    const { userProfile } = get();
    if (!userProfile) return;
    
    // Check if subscription field exists
    if (!userProfile.subscription) {
      console.log('Subscription field missing, creating it...');
      const currentUser = get().user;
      const isAdminUser = currentUser?.email === 'timdug4@gmail.com';
      
      const newProfile = {
        ...userProfile,
        subscription: {
          status: isAdminUser ? 'admin' : 'basic',
          plan: isAdminUser ? 'admin' : 'basic',
          expiresAt: null,
          features: isAdminUser ? ['all_features'] : ['basic_logging', 'basic_tracking']
        }
      };
      
      await get().saveUserProfile(newProfile);
      console.log('Subscription field created successfully');
      return newProfile;
    }
    
    console.log('Subscription field already exists');
    return userProfile;
  },

  // Toggle a favorite exercise with optimistic updates
  toggleFavoriteExercise: async (exerciseId) => {
    const { userProfile, saveUserProfile } = get();
    if (!userProfile) return;
    const currentFavorites = userProfile.favoriteExercises || [];
    const isCurrentlyFavorite = currentFavorites.includes(exerciseId);
    const newFavorites = isCurrentlyFavorite
      ? currentFavorites.filter(id => id !== exerciseId)
      : [...currentFavorites, exerciseId];
    const optimisticProfile = { ...userProfile, favoriteExercises: newFavorites };
    set({ userProfile: optimisticProfile });
    try {
      const newProfile = { ...userProfile, favoriteExercises: newFavorites };
      await saveUserProfile(newProfile);
    } catch (error) {
      console.error("Error updating favorite exercises:", error);
    }
  },

}));

export default useAuthStore; 