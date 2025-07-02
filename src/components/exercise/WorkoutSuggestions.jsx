import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Infinity as InfinityIcon,
  RefreshCw
} from 'lucide-react';
import { 
  analyzeLaggingMuscles, 
  generateWorkoutSuggestions 
} from '../../services/gamification/suggestionService';
import useAuthStore from '../../store/useAuthStore';
import { useToast } from '../../hooks/useToast';
import ExerciseDisplay from './ExerciseDisplay';
import CompletedExerciseBar from './CompletedExerciseBar';
import useExerciseLogStore from '../../store/useExerciseLogStore';

const difficultyColorMap = {
  beginner: 'bg-sky-500',
  intermediate: 'bg-emerald-600',
  advanced: 'bg-orange-500',
};

export default function WorkoutSuggestions({ 
  muscleScores = {}, 
  exerciseLibrary = [], 
  availableEquipment = [],
  onAddToCart,
  className = "",
  exerciseCategory = 'bodyweight',
  selectedBodyweight = [],
  selectedGym = [],
  selectedCardio = [],
  equipmentButtons = null,
  userProfile
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [hiddenSuggestions, setHiddenSuggestions] = useState([]);
  const [recentlyHidden, setRecentlyHidden] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { userProfile: authUserProfile, saveUserProfile, hideExercise, getRemainingHides } = useAuthStore();
  const { toast } = useToast();
  const [completedSuggestions, setCompletedSuggestions] = useState([]);
  const { logs: workoutLogs } = useExerciseLogStore();
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Helper: get remaining refreshes for today (basic: 3 per day)
  const getRemainingRefreshes = () => {
    if (!authUserProfile) return 0;
    const today = new Date().toISOString().split('T')[0];
    const refreshCount = authUserProfile.refreshCount || { date: today, count: 0 };
    if (refreshCount.date !== today) {
      return authUserProfile.subscription?.status === 'admin' || authUserProfile.subscription?.status === 'premium' ? Infinity : 3;
    }
    return authUserProfile.subscription?.status === 'admin' || authUserProfile.subscription?.status === 'premium' ? Infinity : Math.max(0, 3 - refreshCount.count);
  };

  // Increment refresh count in profile (shared for all/per-suggestion)
  const incrementRefreshCount = async () => {
    if (!authUserProfile) return;
    const today = new Date().toISOString().split('T')[0];
    let refreshCount = authUserProfile.refreshCount || { date: today, count: 0 };
    if (refreshCount.date !== today) {
      refreshCount = { date: today, count: 0 };
    }
    const newRefreshCount = { date: today, count: refreshCount.count + 1 };
    const newProfile = { ...authUserProfile, refreshCount: newRefreshCount };
    await saveUserProfile(newProfile);
  };

  // Modified refreshSuggestions to enforce limit
  const refreshSuggestions = async () => {
    if (!authUserProfile.subscription?.status === 'admin' && !authUserProfile.subscription?.status === 'premium') {
      const remaining = getRemainingRefreshes();
      if (remaining <= 0) {
        toast({
          title: "Daily Refresh Limit Reached",
          description: "You can only refresh suggestions once per day as a Basic user. Upgrade to Premium for unlimited refreshes.",
          variant: "destructive",
        });
        return;
      }
      await incrementRefreshCount();
    }
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
        selectedCardio,
        authUserProfile?.pinnedExercises || [],
        authUserProfile?.favoriteExercises || []
      );
      setSuggestions(newSuggestions);
      await saveSuggestionsToProfile(newSuggestions, exerciseCategory);
      setLoading(false);
    }, 800);
  };

  // Save suggestions to user profile
  const saveSuggestionsToProfile = async (newSuggestions, category) => {
    if (!authUserProfile) return;
    
    const updatedProfile = { ...authUserProfile };
    
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
    if (!authUserProfile) return;
    setCompletedSuggestions([]); // Clear completed suggestions on refresh
    setSuggestions([]); // Clear all suggestions from local state immediately
    const updatedProfile = { ...authUserProfile };
    if (updatedProfile.workoutSuggestions) {
      updatedProfile.workoutSuggestions = {
        allExercises: [],
        bodyweightOnly: [],
        gymEquipment: [],
        cardioOnly: []
      };
      try {
        await saveUserProfile(updatedProfile);
        // Generate new suggestions, ensuring no repeats from previous set
        const usedIds = new Set(suggestions.map(s => s.exercise.id));
        const allExercises = exerciseLibrary.filter(e => !usedIds.has(e.id));
        let newSuggestions = [];
        // If not enough alternatives, allow reuse
        if (allExercises.length < suggestions.length) {
          newSuggestions = generateWorkoutSuggestions(
            analyzeLaggingMuscles(muscleScores, workoutLogs, exerciseLibrary),
            exerciseLibrary,
            availableEquipment,
            hiddenSuggestions,
            exerciseCategory,
            selectedBodyweight,
            selectedGym,
            selectedCardio,
            authUserProfile?.pinnedExercises || [],
            authUserProfile?.favoriteExercises || []
          );
        } else {
          // Pick new unique exercises
          for (let i = 0; i < suggestions.length; i++) {
            const idx = Math.floor(Math.random() * allExercises.length);
            const exercise = allExercises.splice(idx, 1)[0];
            newSuggestions.push({
              ...suggestions[i],
              id: `${exercise.id}-${Date.now()}-${i}`,
              exercise,
            });
          }
        }
        setSuggestions(newSuggestions);
        await saveSuggestionsToProfile(newSuggestions, exerciseCategory);
        if (!authUserProfile.subscription?.status === 'admin' && !authUserProfile.subscription?.status === 'premium') await incrementRefreshCount();
        refreshSuggestions();
      } catch (error) {
        console.error('Error clearing suggestions:', error);
      }
    }
  };

  // Load suggestions from profile on mount
  useEffect(() => {
    if (authUserProfile?.workoutSuggestions && exerciseLibrary.length > 0) {
      const categoryKey = exerciseCategory === 'bodyweight' ? 'bodyweightOnly' : 
                         exerciseCategory === 'gym' ? 'gymEquipment' : 
                         exerciseCategory === 'cardio' ? 'cardioOnly' : 'allExercises';
      
      const savedSuggestions = authUserProfile.workoutSuggestions[categoryKey] || [];
      
      if (savedSuggestions.length > 0) {
        // Clear stale suggestions
        const freshSuggestions = clearStaleSuggestions(savedSuggestions);
        
        if (freshSuggestions.length > 0) {
          // Reconstruct suggestions from saved data
          const reconstructedSuggestions = freshSuggestions
            .map(saved => {
              const exercise = exerciseLibrary.find(e => e.id === saved.exerciseId);
              if (!exercise) {
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
            setSuggestions(reconstructedSuggestions);
            setLoading(false);
            return;
          }
        }
      }
    }
    
    // If no saved suggestions or they're invalid, generate new ones
    refreshSuggestions();
  }, [muscleScores, workoutLogs, exerciseLibrary, availableEquipment, hiddenSuggestions, exerciseCategory, selectedBodyweight, selectedGym, selectedCardio, authUserProfile]);
  
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
        description: `You can only hide ${authUserProfile.subscription?.status === 'basic' ? '1' : 'unlimited'} exercises per day. Upgrade to Premium for unlimited hides.`,
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
        return 'bg-status-error text-status-error border-status-error';
      case 'underTrained':
        return 'bg-status-warning text-status-warning border-status-warning';
      case 'neglected':
        return 'bg-status-warning text-status-warning border-status-warning';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
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
  const isAdmin = authUserProfile?.subscription?.status === 'admin';
  const isPremium = authUserProfile?.subscription?.status === 'premium';
  const isBasic = authUserProfile?.subscription?.status === 'basic' || (!isAdmin && !isPremium);
  const remainingHides = getRemainingHides();
  const remainingRefreshes = getRemainingRefreshes();
  // Limit basic users to 1 refresh per day
  const refreshCount = isAdmin || isPremium ? '∞' : 1;
  const hideCount = isAdmin ? '∞' : isPremium ? '∞' : remainingHides;

  // Per-suggestion refresh handler
  const handleRefreshSuggestion = async (suggestionId) => {
    if (!isAdmin && !isPremium && getRemainingRefreshes() <= 0) {
      toast({
        title: "Daily Refresh Limit Reached",
        description: "You can only refresh 3 suggestions per day as a Basic user. Upgrade to Premium for unlimited refreshes.",
        variant: "destructive",
      });
      return;
    }
    const idx = suggestions.findIndex(s => s.id === suggestionId);
    if (idx === -1) return;
    // Exclude current suggestions from pool
    const usedIds = new Set(suggestions.map(s => s.exercise.id));
    // Find all possible alternatives for this slot
    const allAlternatives = exerciseLibrary.filter(e => !usedIds.has(e.id) || e.id === suggestions[idx].exercise.id);
    // Exclude the current exercise
    const alternatives = allAlternatives.filter(e => e.id !== suggestions[idx].exercise.id);
    if (alternatives.length === 0) {
      toast({
        title: "No Alternative Exercise",
        description: "No other available exercise for this slot.",
        variant: "destructive",
      });
      return;
    }
    // Pick a random alternative
    const newExercise = alternatives[Math.floor(Math.random() * alternatives.length)];
    const newSuggestion = {
      ...suggestions[idx],
      id: `${newExercise.id}-${Date.now()}`,
      exercise: newExercise,
    };
    const newSuggestions = [...suggestions];
    newSuggestions[idx] = newSuggestion;
    setSuggestions(newSuggestions);
    await saveSuggestionsToProfile(newSuggestions, exerciseCategory);
    if (!isAdmin && !isPremium) await incrementRefreshCount();
  };

  if (loading) {
    return (
      <div className={className}>
        <Card className="w-full mb-6 p-4 shadow-md border border-suggestion bg-suggestion min-h-[340px]">
          {equipmentButtons && (
            isAdmin || isPremium ? (
              equipmentButtons
            ) : (
              <>
                <div className="opacity-50 pointer-events-none select-none mb-2">
                  {equipmentButtons}
                </div>
                <div className="mb-2 text-xs text-blue-700 font-medium">
                  Equipment selection is a Premium feature. Upgrade to unlock gym and cardio suggestions!
                </div>
              </>
            )
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
              </CardTitle>
              <div className="flex flex-col items-end gap-1 min-w-[90px]">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">Refreshes:</span>
                  {isAdmin || isPremium ? <InfinityIcon className="h-4 w-4" /> : remainingRefreshes}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">Hides:</span>
                  {hideCount === '∞' ? <InfinityIcon className="h-4 w-4" /> : hideCount}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto min-h-[180px]">
              {/* Show 3 loading placeholder cards to maintain consistent height */}
              {Array.from({ length: 3 }, (_, index) => (
                <Card
                  key={`loading-${index}`}
                  className="p-4 flex flex-row items-center justify-between min-w-full relative min-h-[56px]"
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
      <Card className="w-full mb-6 p-4 shadow-md border border-suggestion bg-suggestion min-h-[340px]">
        {equipmentButtons && (
          isAdmin || isPremium ? (
            equipmentButtons
          ) : (
            <>
              <div className="opacity-50 pointer-events-none select-none mb-2">
                {equipmentButtons}
              </div>
              <div className="mb-2 text-xs text-blue-700 font-medium">
                Equipment selection is a Premium feature. Upgrade to unlock gym and cardio suggestions!
              </div>
            </>
          )
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </CardTitle>
            <div className="flex flex-col items-end gap-1 min-w-[90px]">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Refreshes:</span>
                {isAdmin || isPremium ? <InfinityIcon className="h-4 w-4" /> : remainingRefreshes}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Hides:</span>
                {hideCount === '∞' ? <InfinityIcon className="h-4 w-4" /> : hideCount}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllSuggestions}
                className="h-8 px-2 text-xs flex items-center gap-1"
                disabled={loading || (!isAdmin && !isPremium && remainingRefreshes <= 0)}
              >
                <span className="font-bold">3X</span>
                <RefreshCw className="h-4 w-4" />
                {loading && <span className="ml-2">Refreshing...</span>}
              </Button>
              
              {/* Undo Hide Button */}
              {recentlyHidden && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUndoHide}
                  className="h-8 px-2 text-xs"
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  Undo Hide
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto min-h-[180px]">
            {/* Show completed suggestions first */}
            {completedSuggestions.map((suggestion) => (
              <ExerciseDisplay
                key={`completed-${suggestion.id}`}
                exercise={suggestion.exercise}
                bonusXP={suggestion.bonus}
                laggingType={suggestion.laggingMuscle?.laggingType}
                showPinIcon={false}
                showUnhideButton={false}
                showHideButton={true}
                onHide={() => handleHideSuggestion(suggestion.id)}
                onPinToggle={null}
                onUnhide={null}
                loading={false}
                className={'bg-status-success border-status-success'}
                onClick={() => handleAddToCart(suggestion)}
                variant="row"
                nameClassName="text-xs"
                userProfile={authUserProfile}
                workoutLog={workoutLogs}
              />
            ))}
            
            {/* Show active suggestions */}
            {getActiveSuggestions().map((suggestion) => {
              const isCompleted = isSuggestionCompleted(suggestion);
              return (
                <ExerciseDisplay
                  key={suggestion.id}
                  exercise={suggestion.exercise}
                  bonusXP={suggestion.bonus}
                  laggingType={suggestion.laggingMuscle?.laggingType}
                  showPinIcon={false}
                  showUnhideButton={false}
                  showHideButton={true}
                  showRefreshButton={true}
                  onHide={() => handleHideSuggestion(suggestion.id)}
                  onPinToggle={null}
                  onUnhide={null}
                  onRefresh={() => handleRefreshSuggestion(suggestion.id)}
                  loading={false}
                  className={isCompleted ? 'opacity-60 pointer-events-none' : ''}
                  onClick={() => handleAddToCart(suggestion)}
                  variant="row"
                  nameClassName="text-xs"
                  userProfile={authUserProfile}
                  workoutLog={workoutLogs}
                >
                  <strong className="block text-xs mr-2">{suggestion.exercise.name}</strong>
                </ExerciseDisplay>
              );
            })}
            
            {/* Add placeholder cards to maintain consistent sizing */}
            {Array.from({ length: placeholderCount }, (_, index) => (
              <Card
                key={`placeholder-${index}`}
                className="min-h-[56px]"
              ></Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}