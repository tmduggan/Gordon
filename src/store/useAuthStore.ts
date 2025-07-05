import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { auth, db } from '../firebase';
import type { UserProfile, Recipe } from '../types';

const defaultGoals = {
  calories: 2300,
  fat: 65,
  carbs: 280,
  protein: 180,
  fiber: 32,
};

interface HideCount {
  date: string;
  count: number;
}

interface ExerciseSubmission {
  submitted: string[];
  rejected: string[];
}

interface Subscription {
  status: 'basic' | 'premium' | 'admin';
  plan: string;
  expiresAt: string | null;
  features: string[];
}

interface AuthState {
  user: any;
  userProfile: UserProfile | null;
  loading: boolean;
  init: () => void;
  listenForUserProfile: (uid: string) => () => void;
  fetchUserProfile: (uid: string) => Promise<void>;
  saveUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isAdmin: () => boolean;
  isPremium: () => boolean;
  toggleSubscriptionStatus: () => Promise<void>;
  hideExercise: (exerciseId: string) => Promise<boolean | undefined>;
  unhideExercise: (exerciseId: string) => Promise<void>;
  getRemainingHides: () => number;
  addXP: (xpAmount: number) => Promise<void>;
  migrateMuscleScores: (exerciseLogs?: any[], exerciseLibrary?: any[]) => Promise<any>;
  fixXPDiscrepancy: (exerciseLogs?: any[], foodLogs?: any[]) => Promise<number | undefined>;
  recalculateAndSyncXP: (exerciseLogs?: any[], foodLogs?: any[]) => Promise<number | undefined>;
  togglePinFood: (foodId: string) => Promise<void>;
  togglePinExercise: (exerciseId: string) => Promise<void>;
  addRecipe: (recipe: Recipe) => Promise<void>;
  updateRecipe: (updatedRecipe: Recipe) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  ensureSubscriptionField: () => Promise<UserProfile | undefined>;
  toggleFavoriteExercise: (exerciseId: string) => Promise<void>;
  addExerciseSubmission: (submissionId: string) => Promise<boolean>;
  markExerciseSubmissionRejected: (submissionId: string) => Promise<void>;
  getExerciseSubmissionCount: () => number;
  canSubmitExercise: () => boolean;
  setUser: (user: any) => void;
  setUserProfile: (profile: UserProfile) => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,

  init: () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ user });
        const unsubscribe = get().listenForUserProfile(user.uid);
      } else {
        set({ user: null, userProfile: null, loading: false });
      }
    });
  },

  listenForUserProfile: (uid: string) => {
    const userDocRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      async (snap) => {
        if (snap.exists()) {
          const profileData = snap.data();
          if (!profileData.subscription) {
            const currentUser = get().user;
            const isAdminUser = currentUser?.email === 'timdug4@gmail.com';
            const updatedProfile = {
              ...profileData,
              subscription: {
                status: isAdminUser ? 'admin' : 'basic',
                plan: isAdminUser ? 'admin' : 'basic',
                expiresAt: null,
                features: isAdminUser
                  ? ['all_features']
                  : ['basic_logging', 'basic_tracking'],
              },
            };
            await setDoc(userDocRef, updatedProfile, { merge: true });
            set({ userProfile: updatedProfile, loading: false });
          } else {
            set({ userProfile: profileData, loading: false });
          }
        } else {
          const currentUser = get().user;
          const isAdminUser = currentUser?.email === 'timdug4@gmail.com';
          const defaultProfile: UserProfile = {
            goals: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
            pinnedFoods: [],
            pinnedExercises: [],
            favoriteExercises: [],
            recipes: [],
            muscleScores: {},
            totalXP: 0,
            subscription: {
              status: isAdminUser ? 'admin' : 'basic',
              plan: isAdminUser ? 'admin' : 'basic',
              expiresAt: null,
              features: isAdminUser
                ? ['all_features']
                : ['basic_logging', 'basic_tracking'],
            },
            hiddenExercises: [],
            hideCount: {
              date: new Date().toISOString().split('T')[0],
              count: 0,
            },
            exerciseSubmissions: {
              submitted: [],
              rejected: [],
            },
          } as UserProfile;
          await setDoc(userDocRef, defaultProfile);
          set({ userProfile: defaultProfile, loading: false });
        }
      },
      (error) => {
        console.error('Error listening to user profile:', error);
        set({ loading: false });
      }
    );
    return unsubscribe;
  },

  fetchUserProfile: async (uid: string) => {
    set({ loading: true });
    const userDocRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        set({ userProfile: snap.data(), loading: false });
      } else {
        const currentUser = get().user;
        const isAdminUser = currentUser?.email === 'timdug4@gmail.com';
        const defaultProfile: UserProfile = {
          goals: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
          pinnedFoods: [],
          pinnedExercises: [],
          favoriteExercises: [],
          recipes: [],
          totalXP: 0,
          subscription: {
            status: isAdminUser ? 'admin' : 'basic',
            plan: isAdminUser ? 'admin' : 'basic',
            expiresAt: null,
            features: isAdminUser
              ? ['all_features']
              : ['basic_logging', 'basic_tracking'],
          },
          hiddenExercises: [],
          hideCount: {
            date: new Date().toISOString().split('T')[0],
            count: 0,
          },
          exerciseSubmissions: {
            submitted: [],
            rejected: [],
          },
        } as UserProfile;
        await setDoc(userDocRef, defaultProfile);
        set({ userProfile: defaultProfile, loading: false });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      set({ loading: false });
    }
  },

  saveUserProfile: async (profile: Partial<UserProfile>) => {
    const user = get().user;
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, profile, { merge: true });
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },

  isAdmin: () => {
    const { user, userProfile } = get();
    return (
      user?.email === 'timdug4@gmail.com' ||
      userProfile?.subscription?.status === 'admin'
    );
  },

  isPremium: () => {
    const { userProfile } = get();
    return (
      userProfile?.subscription?.status === 'premium' ||
      userProfile?.subscription?.status === 'admin'
    );
  },

  toggleSubscriptionStatus: async () => {
    const { userProfile } = get();
    if (!userProfile) return;
    const currentStatus = userProfile.subscription?.status || 'basic';
    let newStatus: 'basic' | 'premium' | 'admin';
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
        plan: newStatus === 'admin' ? 'admin' : newStatus,
      },
    };
    await get().saveUserProfile(newProfile);
  },

  hideExercise: async (exerciseId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const today = new Date().toISOString().split('T')[0];
    const hideCount = userProfile.hideCount || { date: today, count: 0 };
    if (hideCount.date !== today) {
      hideCount.date = today;
      hideCount.count = 0;
    }
    const isBasic = userProfile.subscription?.status === 'basic';
    const maxHides = isBasic ? 1 : Infinity;
    if (hideCount.count >= maxHides) {
      return false;
    }
    const currentHidden = userProfile.hiddenExercises || [];
    if (!currentHidden.includes(exerciseId)) {
      const newHidden = [...currentHidden, exerciseId];
      const newHideCount = { ...hideCount, count: hideCount.count + 1 };
      const newProfile = {
        ...userProfile,
        hiddenExercises: newHidden,
        hideCount: newHideCount,
      };
      await get().saveUserProfile(newProfile);
      return true;
    }
    return true;
  },

  unhideExercise: async (exerciseId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const currentHidden = userProfile.hiddenExercises || [];
    const newHidden = currentHidden.filter((id) => id !== exerciseId);
    const newProfile = {
      ...userProfile,
      hiddenExercises: newHidden,
    };
    await get().saveUserProfile(newProfile);
  },

  getRemainingHides: () => {
    const { userProfile } = get();
    if (!userProfile) return 0;
    const today = new Date().toISOString().split('T')[0];
    const hideCount = userProfile.hideCount || { date: today, count: 0 };
    if (hideCount.date !== today) {
      return userProfile.subscription?.status === 'basic' ? 1 : Infinity;
    }
    const maxHides =
      userProfile.subscription?.status === 'basic' ? 1 : Infinity;
    return Math.max(0, maxHides - hideCount.count);
  },

  addXP: async (xpAmount: number) => {
    const { userProfile } = get();
    if (!userProfile) {
      return;
    }
    const isBasic = userProfile.subscription?.status === 'basic';
    let currentXP = userProfile.totalXP || 0;
    let newXP = currentXP + xpAmount;
    if (isBasic) {
      const { calculateTotalXPForLevel } = await import(
        '../services/gamification/levelService'
      );
      const capXP = calculateTotalXPForLevel(
        5,
        userProfile.accountCreationDate
          ? new Date(userProfile.accountCreationDate)
          : new Date()
      );
      if (currentXP >= capXP) {
        return;
      }
      newXP = Math.min(newXP, capXP);
    }
    const newProfile = { ...userProfile, totalXP: newXP };
    await get().saveUserProfile(newProfile);
  },

  migrateMuscleScores: async (exerciseLogs: any[] = [], exerciseLibrary: any[] = []) => {
    const { userProfile } = get();
    if (!userProfile) {
      return;
    }
    const { addWorkoutToMuscleReps } = await import(
      '../services/gamification/exerciseScoringService'
    );
    const newMuscleReps = {};
    const updatedProfile = { ...userProfile, muscleReps: newMuscleReps };
    await get().saveUserProfile(updatedProfile);
    return newMuscleReps;
  },

  fixXPDiscrepancy: async (exerciseLogs: any[] = [], foodLogs: any[] = []) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const { recalculateTotalXPFromLogs, validateUserXP } = await import(
      '../services/gamification/levelService'
    );
    const validation = validateUserXP(userProfile, exerciseLogs, foodLogs);
    if (!validation.isValid) {
      const correctedProfile = {
        ...userProfile,
        totalXP: validation.calculatedXP,
      };
      await get().saveUserProfile(correctedProfile);
      return validation.calculatedXP;
    }
    return validation.storedXP;
  },

  recalculateAndSyncXP: async (exerciseLogs: any[] = [], foodLogs: any[] = []) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const { recalculateTotalXPFromLogs } = await import(
      '../services/gamification/levelService'
    );
    const calculatedXP = recalculateTotalXPFromLogs(exerciseLogs, foodLogs);
    const currentXP = userProfile.totalXP || 0;
    if (calculatedXP !== currentXP) {
      const correctedProfile = { ...userProfile, totalXP: calculatedXP };
      await get().saveUserProfile(correctedProfile);
      return calculatedXP;
    }
    return currentXP;
  },

  togglePinFood: async (foodId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const currentPinned = userProfile.pinnedFoods || [];
    const isCurrentlyPinned = currentPinned.includes(foodId);
    const newPinned = isCurrentlyPinned
      ? currentPinned.filter((id) => id !== foodId)
      : [...currentPinned, foodId];
    const optimisticProfile = { ...userProfile, pinnedFoods: newPinned };
    set({ userProfile: optimisticProfile });
    try {
      const newProfile = { ...userProfile, pinnedFoods: newPinned };
      await get().saveUserProfile(newProfile);
    } catch (error) {
      set({ userProfile });
    }
  },

  togglePinExercise: async (exerciseId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const currentPinned = userProfile.pinnedExercises || [];
    const isCurrentlyPinned = currentPinned.includes(exerciseId);
    const newPinned = isCurrentlyPinned
      ? currentPinned.filter((id) => id !== exerciseId)
      : [...currentPinned, exerciseId];
    const optimisticProfile = { ...userProfile, pinnedExercises: newPinned };
    set({ userProfile: optimisticProfile });
    try {
      const newProfile = { ...userProfile, pinnedExercises: newPinned };
      await get().saveUserProfile(newProfile);
    } catch (error) {
      set({ userProfile });
    }
  },

  addRecipe: async (recipe: Recipe) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const currentRecipes = userProfile.recipes || [];
    const newRecipes = [...currentRecipes, recipe];
    const newProfile = { ...userProfile, recipes: newRecipes };
    await get().saveUserProfile(newProfile);
  },

  updateRecipe: async (updatedRecipe: Recipe) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const currentRecipes = userProfile.recipes || [];
    const newRecipes = currentRecipes.map((recipe) =>
      recipe.id === updatedRecipe.id ? updatedRecipe : recipe
    );
    const newProfile = { ...userProfile, recipes: newRecipes };
    await get().saveUserProfile(newProfile);
  },

  deleteRecipe: async (recipeId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const currentRecipes = userProfile.recipes || [];
    const newRecipes = currentRecipes.filter(
      (recipe) => recipe.id !== recipeId
    );
    const newProfile = { ...userProfile, recipes: newRecipes };
    await get().saveUserProfile(newProfile);
  },

  ensureSubscriptionField: async () => {
    const { userProfile } = get();
    if (!userProfile) return;
    if (!userProfile.subscription) {
      const currentUser = get().user;
      const isAdminUser = currentUser?.email === 'timdug4@gmail.com';
      const newProfile = {
        ...userProfile,
        subscription: {
          status: isAdminUser ? 'admin' : 'basic',
          plan: isAdminUser ? 'admin' : 'basic',
          expiresAt: null,
          features: isAdminUser
            ? ['all_features']
            : ['basic_logging', 'basic_tracking'],
        },
      };
      await get().saveUserProfile(newProfile);
      return newProfile;
    }
    return userProfile;
  },

  toggleFavoriteExercise: async (exerciseId: string) => {
    const { userProfile, saveUserProfile } = get();
    if (!userProfile) return;
    const currentFavorites = userProfile.favoriteExercises || [];
    const isCurrentlyFavorite = currentFavorites.includes(exerciseId);
    const newFavorites = isCurrentlyFavorite
      ? currentFavorites.filter((id) => id !== exerciseId)
      : [...currentFavorites, exerciseId];
    const optimisticProfile = {
      ...userProfile,
      favoriteExercises: newFavorites,
    };
    set({ userProfile: optimisticProfile });
    try {
      const newProfile = { ...userProfile, favoriteExercises: newFavorites };
      await saveUserProfile(newProfile);
    } catch (error) {}
  },

  addExerciseSubmission: async (submissionId: string) => {
    const { userProfile } = get();
    if (!userProfile) return false;
    const currentSubmissions = userProfile.exerciseSubmissions?.submitted || [];
    if (!currentSubmissions.includes(submissionId)) {
      const newSubmissions = [...currentSubmissions, submissionId];
      const newProfile = {
        ...userProfile,
        exerciseSubmissions: {
          ...userProfile.exerciseSubmissions,
          submitted: newSubmissions,
        },
      };
      await get().saveUserProfile(newProfile);
      return true;
    }
    return false;
  },

  markExerciseSubmissionRejected: async (submissionId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;
    const currentSubmitted = userProfile.exerciseSubmissions?.submitted || [];
    const currentRejected = userProfile.exerciseSubmissions?.rejected || [];
    const newSubmitted = currentSubmitted.filter((id) => id !== submissionId);
    const newRejected = currentRejected.includes(submissionId)
      ? currentRejected
      : [...currentRejected, submissionId];
    const newProfile = {
      ...userProfile,
      exerciseSubmissions: {
        submitted: newSubmitted,
        rejected: newRejected,
      },
    };
    await get().saveUserProfile(newProfile);
  },

  getExerciseSubmissionCount: () => {
    const { userProfile } = get();
    if (!userProfile) return 0;
    return userProfile.exerciseSubmissions?.submitted?.length || 0;
  },

  canSubmitExercise: () => {
    const { userProfile } = get();
    if (!userProfile) return false;
    const submittedCount =
      userProfile.exerciseSubmissions?.submitted?.length || 0;
    return submittedCount < 3;
  },

  setUser: (user: any) => set({ user }),
  setUserProfile: (profile: UserProfile) => set({ userProfile: profile }),
}));

export default useAuthStore; 