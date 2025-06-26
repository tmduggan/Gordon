import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Lightbulb, 
  X, 
  Undo2, 
  Target, 
  Zap,
  Clock,
  TrendingUp,
  Info,
  Infinity as InfinityIcon
} from 'lucide-react';
import { 
  analyzeLaggingMuscles, 
  generateWorkoutSuggestions 
} from '../services/suggestionService';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../hooks/use-toast';
import CompletedExerciseBar from './exercise/CompletedExerciseBar';

// Equipment icon mapping (same as PinnedItem)
const equipmentIconMap = {
  'smith machine': '/icons/smith.png',
  'dumbbell': '/icons/dumbbell.png',
  'barbell': '/icons/barbell.png',
  'kettlebell': '/icons/kettlebell.png',
  'sled machine': '/icons/sled machine.jpg',
  'body weight': '/icons/bodyweight.png',
  'machine': '/icons/machine.png',
};

const getEquipmentIcon = (equipmentName) => {
  if (!equipmentName) return null;
  const lowerCaseEquipment = equipmentName.toLowerCase();
  
  if (lowerCaseEquipment.includes('dumbbell')) return equipmentIconMap['dumbbell'];
  if (lowerCaseEquipment.includes('barbell')) return equipmentIconMap['barbell'];
  if (lowerCaseEquipment.includes('kettlebell')) return equipmentIconMap['kettlebell'];
  if (lowerCaseEquipment === 'smith machine') return equipmentIconMap['smith machine'];
  if (lowerCaseEquipment === 'sled machine') return equipmentIconMap['sled machine'];
  if (lowerCaseEquipment === 'body weight') return equipmentIconMap['body weight'];
  if (lowerCaseEquipment === 'leverage machine' || lowerCaseEquipment === 'cable') {
    return equipmentIconMap['machine'];
  }

  return null;
};

// Muscle icon mapping (same as PinnedItem)
const muscleIconMap = {
  'quads': '/icons/Muscle-Quads.jpeg',
  'abductors': '/icons/Muscle-Abductors.jpeg',
  'abs': '/icons/Muscle-Abs.jpeg',
  'adductors': '/icons/Muscle-Adductors.jpeg',
  'biceps': '/icons/Muscle-Biceps.jpeg',
  'calves': '/icons/Muscle-Calves.jpeg',
  'delts': '/icons/Muscle-Deltoids.jpeg',
  'forearms': '/icons/Muscle-Forearms.jpeg',
  'hamstrings': '/icons/Muscle-Hamstrings.jpeg',
  'pectorals': '/icons/Muscle-Pectorals.jpeg',
  'serratus anterior': '/icons/Muscle-serratus anterior.jpeg',
  'traps': '/icons/Muscle-Traps.jpeg',
  'triceps': '/icons/Muscle-Triceps.jpeg',
  'glutes': '/icons/Muscle-glutes.jpeg',
};

const getMuscleIcon = (muscleName) => {
  if (!muscleName) return null;
  const lowerCaseMuscle = muscleName.toLowerCase();
  return muscleIconMap[lowerCaseMuscle] || null;
}

const difficultyColorMap = {
  beginner: 'bg-sky-500',
  intermediate: 'bg-emerald-600',
  advanced: 'bg-orange-500',
};

export default function WorkoutSuggestions({ 
  muscleScores = {}, 
  workoutLogs = [], 
  exerciseLibrary = [], 
  availableEquipment = [],
  onAddToCart,
  className = "",
  exerciseCategory = 'bodyweight',
  selectedBodyweight = [],
  selectedGym = [],
  selectedCardio = [],
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [hiddenSuggestions, setHiddenSuggestions] = useState([]);
  const [recentlyHidden, setRecentlyHidden] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { userProfile, saveUserProfile, hideExercise, getRemainingHides } = useAuthStore();
  const { toast } = useToast();
  const [completedSuggestions, setCompletedSuggestions] = useState([]);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Generate suggestions when dependencies change
  const refreshSuggestions = async () => {
    setLoading(true);
    setTimeout(async () => {
      const laggingMuscles = analyzeLaggingMuscles(muscleScores, workoutLogs, exerciseLibrary);
      let selectedEquipment = [];
      if (exerciseCategory === 'bodyweight') selectedEquipment = selectedBodyweight;
      else if (exerciseCategory === 'gym') selectedEquipment = selectedGym;
      else if (exerciseCategory === 'cardio') selectedEquipment = selectedCardio;
      const newSuggestions = generateWorkoutSuggestions(
        laggingMuscles, 
        exerciseLibrary, 
        availableEquipment, 
        hiddenSuggestions,
        exerciseCategory,
        selectedBodyweight,
        selectedGym,
        selectedCardio
      );
      setSuggestions(newSuggestions);
      
      // Save suggestions to user profile
      await saveSuggestionsToProfile(newSuggestions, exerciseCategory);
      
      setLoading(false);
    }, 800); // 800ms for a brief loading animation
  };

  // Save suggestions to user profile
  const saveSuggestionsToProfile = async (newSuggestions, category) => {
    if (!userProfile) return;
    
    const updatedProfile = { ...userProfile };
    
    // Initialize workoutSuggestions if it doesn't exist
    if (!updatedProfile.workoutSuggestions) {
      updatedProfile.workoutSuggestions = {
        allExercises: [],
        bodyweightOnly: [],
        gymEquipment: [],
        cardioOnly: []
      };
    }
    
    // Map category to profile key
    const categoryKey = category === 'bodyweight' ? 'bodyweightOnly' : 
                       category === 'gym' ? 'gymEquipment' : 
                       category === 'cardio' ? 'cardioOnly' : 'allExercises';
    
    // Save suggestions for this category
    updatedProfile.workoutSuggestions[categoryKey] = newSuggestions.map(suggestion => ({
      id: suggestion.id,
      exerciseId: suggestion.exercise.id,
      laggingMuscle: suggestion.laggingMuscle,
      reason: suggestion.reason,
      bonus: suggestion.bonus,
      timestamp: new Date().toISOString()
    }));
    
    try {
      await saveUserProfile(updatedProfile);
      console.log(`✅ Saved ${newSuggestions.length} suggestions for ${categoryKey}`);
    } catch (error) {
      console.error('Error saving workout suggestions to profile:', error);
    }
  };

  // Clear stale suggestions (older than 24 hours)
  const clearStaleSuggestions = (suggestions) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return suggestions.filter(suggestion => {
      const suggestionTime = new Date(suggestion.timestamp);
      return suggestionTime > twentyFourHoursAgo;
    });
  };

  // Clear all saved suggestions and generate new ones
  const clearAllSuggestions = async () => {
    if (!userProfile) return;
    
    const updatedProfile = { ...userProfile };
    if (updatedProfile.workoutSuggestions) {
      updatedProfile.workoutSuggestions = {
        allExercises: [],
        bodyweightOnly: [],
        gymEquipment: [],
        cardioOnly: []
      };
      
      try {
        await saveUserProfile(updatedProfile);
        console.log('🗑️ Cleared all saved suggestions');
        // Generate new suggestions
        refreshSuggestions();
      } catch (error) {
        console.error('Error clearing suggestions:', error);
      }
    }
  };

  // Load suggestions from profile on mount
  useEffect(() => {
    if (userProfile?.workoutSuggestions && exerciseLibrary.length > 0) {
      const categoryKey = exerciseCategory === 'bodyweight' ? 'bodyweightOnly' : 
                         exerciseCategory === 'gym' ? 'gymEquipment' : 
                         exerciseCategory === 'cardio' ? 'cardioOnly' : 'allExercises';
      
      const savedSuggestions = userProfile.workoutSuggestions[categoryKey] || [];
      
      if (savedSuggestions.length > 0) {
        // Clear stale suggestions
        const freshSuggestions = clearStaleSuggestions(savedSuggestions);
        
        if (freshSuggestions.length > 0) {
          console.log(`📋 Loading ${freshSuggestions.length} saved suggestions for ${categoryKey}`);
          
          // Reconstruct suggestions from saved data
          const reconstructedSuggestions = freshSuggestions
            .map(saved => {
              const exercise = exerciseLibrary.find(e => e.id === saved.exerciseId);
              if (!exercise) {
                console.warn(`❌ Exercise not found in library: ${saved.exerciseId}`);
                return null;
              }
              
              return {
                id: saved.id,
                exercise,
                laggingMuscle: saved.laggingMuscle,
                reason: saved.reason,
                bonus: saved.bonus
              };
            })
            .filter(Boolean);
          
          if (reconstructedSuggestions.length > 0) {
            console.log(`✅ Successfully loaded ${reconstructedSuggestions.length} suggestions`);
            setSuggestions(reconstructedSuggestions);
            setLoading(false);
            return;
          } else {
            console.log(`⚠️ No valid suggestions found after reconstruction`);
          }
        } else {
          console.log(`⏰ Saved suggestions are stale, generating new ones`);
        }
      } else {
        console.log(`📭 No saved suggestions found for ${categoryKey}`);
      }
    }
    
    // If no saved suggestions or they're invalid, generate new ones
    console.log(`🔄 Generating new suggestions for ${exerciseCategory}`);
    refreshSuggestions();
  }, [muscleScores, workoutLogs, exerciseLibrary, availableEquipment, hiddenSuggestions, exerciseCategory, selectedBodyweight, selectedGym, selectedCardio, userProfile]);
  
  const handleHideSuggestion = async (suggestionId) => {
    const exerciseId = suggestions.find(s => s.id === suggestionId)?.exercise.id;
    if (!exerciseId) return;

    const success = await hideExercise(exerciseId);
    
    if (success) {
      setHiddenSuggestions(prev => [...prev, suggestionId]);
      setRecentlyHidden(suggestionId);
      
      // Auto-clear recently hidden after 5 seconds
      setTimeout(() => {
        setRecentlyHidden(null);
      }, 5000);

      // Generate a new suggestion to replace the hidden one
      refreshSuggestions();
    } else {
      // Show error toast for daily limit
      const remainingHides = getRemainingHides();
      toast({
        title: "Daily Hide Limit Reached",
        description: `You can only hide ${userProfile.subscription?.status === 'basic' ? '2' : 'unlimited'} exercises per day. Upgrade to Premium for unlimited hides.`,
        variant: "destructive",
      });
    }
  };
  
  const handleUndoHide = () => {
    if (recentlyHidden) {
      setHiddenSuggestions(prev => prev.filter(id => id !== recentlyHidden));
      setRecentlyHidden(null);
    }
  };
  
  const handleAddToCart = (suggestion) => {
    onAddToCart(suggestion.exercise);
  };
  
  const getLaggingTypeIcon = (laggingType) => {
    switch (laggingType) {
      case 'neverTrained':
        return <Target className="h-4 w-4 text-red-500" />;
      case 'underTrained':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'neglected':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getLaggingTypeColor = (laggingType) => {
    switch (laggingType) {
      case 'neverTrained':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'underTrained':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'neglected':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const renderTooltipContent = (suggestion) => (
    <div className="max-w-xs">
      <div className="font-semibold text-base mb-2">
        {suggestion.exercise.name}
      </div>
      
      {/* Description */}
      {suggestion.exercise.description && (
        <div className="mb-3">
          <div className="font-medium text-sm mb-1 text-blue-600">Description:</div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {suggestion.exercise.description}
          </p>
        </div>
      )}
      
      {/* Instructions */}
      {suggestion.exercise.instructions && Array.isArray(suggestion.exercise.instructions) && suggestion.exercise.instructions.length > 0 && (
        <div className="mb-3">
          <div className="font-medium text-sm mb-1 text-green-600">Instructions:</div>
          <ol className="text-sm text-gray-700 space-y-1">
            {suggestion.exercise.instructions.map((instruction, index) => (
              <li key={index} className="leading-relaxed">
                {index + 1}. {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}
      
      {/* Reason */}
      <div className="mb-2">
        <p className="text-sm text-gray-600">
          {suggestion.reason}
        </p>
      </div>
      
      {/* Exercise Details */}
      <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2">
        <span>Target: {suggestion.exercise.target}</span>
        {suggestion.exercise.equipment && (
          <span>Equipment: {suggestion.exercise.equipment}</span>
        )}
        {suggestion.exercise.category && (
          <span>Type: {suggestion.exercise.category}</span>
        )}
      </div>
    </div>
  );

  // Check if a suggestion has been completed today
  const isSuggestionCompleted = (suggestion) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return workoutLogs.some(log => {
      const logDate = new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      
      return logDate.getTime() === today.getTime() && 
             log.exerciseId === suggestion.exercise.id;
    });
  };

  // Get completed suggestions for today
  const getCompletedSuggestions = () => {
    return suggestions.filter(suggestion => isSuggestionCompleted(suggestion));
  };

  // Get active (uncompleted) suggestions
  const getActiveSuggestions = () => {
    return suggestions.filter(suggestion => !isSuggestionCompleted(suggestion));
  };

  // Update completed suggestions when workout logs change
  useEffect(() => {
    const completed = getCompletedSuggestions();
    setCompletedSuggestions(completed);
  }, [workoutLogs, suggestions]);

  // Determine refresh/hide counts
  const isAdmin = userProfile?.subscription?.status === 'admin';
  const isPremium = userProfile?.subscription?.status === 'premium';
  const isBasic = userProfile?.subscription?.status === 'basic' || (!isAdmin && !isPremium);
  const remainingHides = getRemainingHides();
  // For now, assume unlimited refreshes for all, but you can add logic if you want to limit refreshes for basic
  const refreshCount = isAdmin || isPremium ? '∞' : '∞'; // Placeholder for future logic
  const hideCount = isAdmin ? '∞' : isPremium ? '∞' : remainingHides;

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Suggested Workouts
              </CardTitle>
              <div className="flex flex-col items-end gap-1 min-w-[90px]">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">Refreshes:</span>
                  {refreshCount === '∞' ? <InfinityIcon className="h-4 w-4" /> : refreshCount}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">Hides:</span>
                  {hideCount === '∞' ? <InfinityIcon className="h-4 w-4" /> : hideCount}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {/* Show 3 loading placeholder cards to maintain consistent height */}
              {Array.from({ length: 3 }, (_, index) => (
                <Card
                  key={`loading-${index}`}
                  className="p-4 flex flex-row items-center justify-between min-w-full relative"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex flex-row items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Loading suggestions...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (suggestions.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-8">
          <div className="mb-2 text-gray-700">No exercises available for your current equipment selection.</div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            onClick={refreshSuggestions}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }
  
  // Show at least 3 suggestions to maintain consistent sizing
  const minSuggestions = 3;
  const placeholderCount = Math.max(0, minSuggestions - suggestions.length);
  
  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Suggested Workouts
            </CardTitle>
            <div className="flex flex-col items-end gap-1 min-w-[90px]">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Refreshes:</span>
                {refreshCount === '∞' ? <InfinityIcon className="h-4 w-4" /> : refreshCount}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Hides:</span>
                {hideCount === '∞' ? <InfinityIcon className="h-4 w-4" /> : hideCount}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllSuggestions}
                      className="h-8 px-2 text-xs"
                      disabled={loading}
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate fresh workout suggestions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Undo Hide Button */}
              {recentlyHidden && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleUndoHide}
                        className="h-8 px-2 text-xs"
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        Undo Hide
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Restore recently hidden suggestion</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {/* Show completed suggestions first */}
            {completedSuggestions.map((suggestion) => (
              <CompletedExerciseBar
                key={`completed-${suggestion.id}`}
                exercise={suggestion.exercise}
                completedAt={new Date()}
                bonus={suggestion.bonus}
              />
            ))}
            
            {/* Show active suggestions */}
            {getActiveSuggestions().map((suggestion) => {
              const { target, equipment, difficulty } = suggestion.exercise;
              const equipmentIcon = getEquipmentIcon(equipment);
              const difficultyColor = difficulty ? difficultyColorMap[difficulty.toLowerCase()] : null;
              const muscleIcon = getMuscleIcon(target);
              const isNeverTrained = suggestion.laggingMuscle.laggingType === 'neverTrained';
              
              return (
                <Card
                  key={suggestion.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 p-4 flex flex-row items-center justify-between min-w-full relative"
                  onClick={() => handleAddToCart(suggestion)}
                  tabIndex={0}
                  role="button"
                  aria-label={suggestion.exercise.name}
                >
                  {/* Desktop Tooltip */}
                  {!isMobile && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
                            {/* Exercise Name */}
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                              <strong className="block text-lg">
                                {suggestion.exercise.name}
                              </strong>
                            </div>
                            
                            {/* Icons and Badges Row */}
                            <div className="flex flex-row items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                              {/* Icons Row */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {muscleIcon && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <img 
                                          src={muscleIcon} 
                                          alt={target} 
                                          className="h-6 w-6 rounded-md border border-black" 
                                          onClick={e => e.stopPropagation()} 
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="capitalize">{target}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {equipmentIcon && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <img 
                                          src={equipmentIcon} 
                                          alt={equipment} 
                                          className="h-6 w-6 p-0.5 bg-blue-100 rounded-md" 
                                          onClick={e => e.stopPropagation()} 
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="capitalize">{equipment}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {difficultyColor && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div 
                                          className={`h-6 w-6 rounded-md ${difficultyColor}`} 
                                          onClick={e => e.stopPropagation()} 
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="capitalize">{difficulty}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              
                              {/* Lagging Type Badge */}
                              <div className="flex-shrink-0">
                                <Badge 
                                  variant="outline" 
                                  className={`text-sm ${getLaggingTypeColor(suggestion.laggingMuscle.laggingType)}`}
                                >
                                  {getLaggingTypeIcon(suggestion.laggingMuscle.laggingType)}
                                  <span className="ml-1">
                                    {suggestion.laggingMuscle.laggingType === 'neverTrained' && 'Never Trained'}
                                    {suggestion.laggingMuscle.laggingType === 'underTrained' && 'Under Trained'}
                                    {suggestion.laggingMuscle.laggingType === 'neglected' && 'Neglected'}
                                  </span>
                                </Badge>
                              </div>
                              
                              {/* Bonus XP Badge */}
                              <div className="flex-shrink-0">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-green-100 text-green-800 border-green-200 text-sm">
                                        <Zap className="h-4 w-4 mr-1" />
                                        +{suggestion.bonus} XP
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Bonus XP for targeting lagging muscle group</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {renderTooltipContent(suggestion)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Mobile Layout */}
                  {isMobile && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
                      {/* Exercise Name */}
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <strong className="block text-lg">
                          {suggestion.exercise.name}
                        </strong>
                      </div>
                      
                      {/* Icons and Badges Row */}
                      <div className="flex flex-row items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                        {/* Icons Row */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {muscleIcon && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <img 
                                    src={muscleIcon} 
                                    alt={target} 
                                    className="h-6 w-6 rounded-md border border-black" 
                                    onClick={e => e.stopPropagation()} 
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="capitalize">{target}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {equipmentIcon && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <img 
                                    src={equipmentIcon} 
                                    alt={equipment} 
                                    className="h-6 w-6 p-0.5 bg-blue-100 rounded-md" 
                                    onClick={e => e.stopPropagation()} 
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="capitalize">{equipment}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {difficultyColor && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`h-6 w-6 rounded-md ${difficultyColor}`} 
                                    onClick={e => e.stopPropagation()} 
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="capitalize">{difficulty}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        
                        {/* Lagging Type Badge */}
                        <div className="flex-shrink-0">
                          <Badge 
                            variant="outline" 
                            className={`text-sm ${getLaggingTypeColor(suggestion.laggingMuscle.laggingType)}`}
                          >
                            {getLaggingTypeIcon(suggestion.laggingMuscle.laggingType)}
                            <span className="ml-1">
                              {suggestion.laggingMuscle.laggingType === 'neverTrained' && 'Never Trained'}
                              {suggestion.laggingMuscle.laggingType === 'underTrained' && 'Under Trained'}
                              {suggestion.laggingMuscle.laggingType === 'neglected' && 'Neglected'}
                            </span>
                          </Badge>
                        </div>
                        
                        {/* Bonus XP Badge */}
                        <div className="flex-shrink-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-sm">
                                  <Zap className="h-4 w-4 mr-1" />
                                  +{suggestion.bonus} XP
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bonus XP for targeting lagging muscle group</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Mobile Info Button */}
                  {isMobile && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute bottom-1 left-1 h-6 w-6 p-0 text-gray-400 hover:text-blue-500 z-10"
                          onClick={e => e.stopPropagation()}
                          tabIndex={0}
                          aria-label="Show exercise info"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        {renderTooltipContent(suggestion)}
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {/* Hide Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-500 z-10"
                          onClick={e => {
                            e.stopPropagation();
                            handleHideSuggestion(suggestion.id);
                          }}
                          tabIndex={-1}
                          aria-label="Hide suggestion"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hide this exercise from suggestions</p>
                        {userProfile?.subscription?.status === 'basic' && (
                          <p className="text-xs text-gray-500 mt-1">
                            {getRemainingHides()} hides remaining today
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Card>
              );
            })}
            
            {/* Add placeholder cards to maintain consistent sizing */}
            {Array.from({ length: placeholderCount }, (_, index) => (
              <Card
                key={`placeholder-${index}`}
                className="p-4 flex flex-row items-center justify-between min-w-full relative opacity-30"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex flex-row items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            {completedSuggestions.length > 0 && (
              <div className="mb-2 text-green-600">
                ✓ Completed {completedSuggestions.length} suggestion{completedSuggestions.length !== 1 ? 's' : ''} today
              </div>
            )}
            Suggestions are based on your muscle training history and available equipment.
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 