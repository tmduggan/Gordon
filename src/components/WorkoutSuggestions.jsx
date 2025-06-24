import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Lightbulb, 
  X, 
  Undo2, 
  Target, 
  Zap,
  Clock,
  TrendingUp,
  Info
} from 'lucide-react';
import { 
  analyzeLaggingMuscles, 
  generateWorkoutSuggestions 
} from '../services/suggestionService';

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
  className = "" 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [hiddenSuggestions, setHiddenSuggestions] = useState([]);
  const [recentlyHidden, setRecentlyHidden] = useState(null);
  
  // Generate suggestions when dependencies change
  useEffect(() => {
    const laggingMuscles = analyzeLaggingMuscles(muscleScores, workoutLogs, exerciseLibrary);
    const newSuggestions = generateWorkoutSuggestions(
      laggingMuscles, 
      exerciseLibrary, 
      availableEquipment, 
      hiddenSuggestions
    );
    setSuggestions(newSuggestions);
  }, [muscleScores, workoutLogs, exerciseLibrary, availableEquipment, hiddenSuggestions]);
  
  const handleHideSuggestion = (suggestionId) => {
    setHiddenSuggestions(prev => [...prev, suggestionId]);
    setRecentlyHidden(suggestionId);
    
    // Auto-clear recently hidden after 5 seconds
    setTimeout(() => {
      setRecentlyHidden(null);
    }, 5000);
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
  
  if (suggestions.length === 0) {
    return null;
  }
  
  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Suggested Workouts
            </CardTitle>
            
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
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {suggestions.map((suggestion) => {
              const { target, equipment, difficulty } = suggestion.exercise;
              const equipmentIcon = getEquipmentIcon(equipment);
              const difficultyColor = difficulty ? difficultyColorMap[difficulty.toLowerCase()] : null;
              const muscleIcon = getMuscleIcon(target);
              const isNeverTrained = suggestion.laggingMuscle.laggingType === 'neverTrained';
              
              return (
                <Card
                  key={suggestion.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 p-2 flex flex-col items-stretch min-w-[120px] max-w-[180px] relative"
                  onClick={() => handleAddToCart(suggestion)}
                  tabIndex={0}
                  role="button"
                  aria-label={suggestion.exercise.name}
                >
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-stretch w-full h-full">
                          {/* Exercise Name + Info Icon */}
                          <div className="pr-2 min-w-0 flex items-center justify-center gap-1">
                            <strong className="block truncate text-center text-sm">
                              {suggestion.exercise.name}
                            </strong>
                            {/* Info icon for mobile tooltip */}
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="ml-1 p-0.5 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    onClick={e => e.stopPropagation()}
                                    tabIndex={0}
                                    aria-label="Show info"
                                  >
                                    <Info className="h-4 w-4 text-gray-400" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <div className="mb-2">
                                    <div className="font-semibold text-base mb-1">
                                      {suggestion.exercise.name}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {suggestion.reason}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>Target: {suggestion.exercise.target}</span>
                                      {suggestion.exercise.equipment && (
                                        <span>Equipment: {suggestion.exercise.equipment}</span>
                                      )}
                                      {suggestion.exercise.category && (
                                        <span>Type: {suggestion.exercise.category}</span>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          {/* Icons Row */}
                          <div className="flex items-center gap-1 flex-shrink-0 justify-center mt-1">
                            {muscleIcon && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <img 
                                    src={muscleIcon} 
                                    alt={target} 
                                    className="h-5 w-5 rounded-md border border-black" 
                                    onClick={e => e.stopPropagation()} 
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="capitalize">{target}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {equipmentIcon && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <img 
                                    src={equipmentIcon} 
                                    alt={equipment} 
                                    className="h-5 w-5 p-0.5 bg-blue-100 rounded-md" 
                                    onClick={e => e.stopPropagation()} 
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="capitalize">{equipment}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {difficultyColor && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`h-5 w-5 rounded-md ${difficultyColor}`} 
                                    onClick={e => e.stopPropagation()} 
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="capitalize">{difficulty}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          
                          {/* Lagging Type Badge */}
                          <div className="flex justify-center mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getLaggingTypeColor(suggestion.laggingMuscle.laggingType)}`}
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
                          <div className="flex justify-center mt-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
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
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <div className="mb-2">
                          <div className="font-semibold text-base mb-1">
                            {suggestion.exercise.name}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {suggestion.reason}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Target: {suggestion.exercise.target}</span>
                            {suggestion.exercise.equipment && (
                              <span>Equipment: {suggestion.exercise.equipment}</span>
                            )}
                            {suggestion.exercise.category && (
                              <span>Type: {suggestion.exercise.category}</span>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* Hide Button */}
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
                </Card>
              );
            })}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Suggestions are based on your muscle training history and available equipment.
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 