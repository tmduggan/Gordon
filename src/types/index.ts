// Core application types and interfaces

// User and Profile types
export interface UserProfile {
  id?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  goals?: NutritionGoals;
  availableEquipment?: string[];
  muscleReps?: Record<string, number>;
  personalBests?: Record<string, PersonalBests>;
  totalXP?: number;
  level?: number;
  pinnedExercises?: string[];
  favoriteExercises?: string[];
  exerciseSubmissions?: {
    submitted: string[];
  };
  isPremium?: boolean;
  subscriptionStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NutritionGoals {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  fiber: number;
}

export interface PersonalBests {
  current?: PersonalBest;
  quarter?: PersonalBest;
  year?: PersonalBest;
  allTime?: PersonalBest;
}

export interface PersonalBest {
  value: number;
  type: '1rm' | 'reps' | 'duration' | 'pace';
  unit: string;
  date: Date;
}

// Exercise types
export interface Exercise {
  id: string;
  name: string;
  category?: string;
  target?: string;
  secondaryMuscles?: string | string[];
  equipment?: string;
  instructions?: string[];
  difficulty?: string;
  muscleGroups?: string[];
}

export interface ExerciseSet {
  weight: string | number;
  reps: string | number;
}

export interface WorkoutData {
  sets?: ExerciseSet[];
  duration?: number | null;
  timestamp: Date;
}

export interface ExerciseLog {
  id?: string;
  userId: string;
  exerciseId: string;
  timestamp: Date;
  recordedTime?: Date;
  sets?: ExerciseSet[];
  duration?: number | null;
  score: number;
}

// Food types
export interface Food {
  id: string;
  food_name: string;
  brand_name?: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams: number;
  alt_measures?: AltMeasure[];
  nix_item_id?: string;
  photo?: {
    thumb: string;
  };
  nutrients?: Record<string, number>;
}

export interface AltMeasure {
  measure: string;
  qty: number;
  serving_weight: number;
}

export interface FoodLog {
  id?: string;
  userId: string;
  foodId: string;
  timestamp: Date;
  recordedTime?: Date;
  serving: number;
  units: string;
  xp: number;
}

// Gamification types
export interface LaggingMuscle {
  muscle: string;
  reps: number;
  laggingType: 'neverTrained' | 'underTrained' | 'neglected';
  bonus: number;
  daysSinceTrained: number;
  priority: number;
}

export interface WorkoutSuggestion {
  id: string;
  exercise: Exercise;
  laggingMuscle: LaggingMuscle;
  reason: string;
  bonus: number;
}

export interface LevelData {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  xpToNext: number;
  levelTitle: string;
}

export interface StreakBonuses {
  dailyStreak: number;
  weeklyStreak: number;
  dailyBonus: number;
  weeklyBonus: number;
}

export interface LevelInfo {
  title: string;
  isMilestone: boolean;
  nextMilestone: number | null;
}

export interface XPValidationResult {
  isValid: boolean;
  calculatedXP: number;
  discrepancy: number;
  storedXP: number;
}

// Cart types
export interface CartItem {
  id: string;
  name: string;
  type: 'exercise' | 'food';
  data?: any;
}

// Search types
export interface SearchFilters {
  category?: string;
  equipment?: string[];
  difficulty?: string;
  muscleGroups?: string[];
}

// API Response types
export interface NutritionixSearchResponse {
  common: Food[];
  branded: Food[];
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Hook return types
export interface UseExerciseLoggingReturn {
  handleSelect: (exercise: Exercise) => void;
  logCart: () => Promise<void>;
  cartProps: {
    logData: Record<string, any>;
    onLogDataChange: (id: string, data: any) => void;
  };
}

export interface UseCartReturn {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateCartItem: (id: string, data: any) => void;
}

// Component prop types
export interface ExerciseDisplayProps {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  isPinned?: boolean;
  isFavorite?: boolean;
  onTogglePin?: (exerciseId: string) => void;
  onToggleFavorite?: (exerciseId: string) => void;
  showTooltip?: boolean;
}

export interface LevelDisplayProps {
  level: number;
  progress: number;
  totalXP: number;
  xpToNext: number;
  levelTitle: string;
  showTooltip?: boolean;
} 