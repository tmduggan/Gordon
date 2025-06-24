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
  TrendingUp
} from 'lucide-react';
import { 
  analyzeLaggingMuscles, 
  generateWorkoutSuggestions 
} from '../services/suggestionService';

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
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-sm">
                        {suggestion.exercise.name}
                      </h4>
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
                  
                  <div className="flex items-center gap-2 ml-3">
                    {/* Bonus XP Display */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <Zap className="h-3 w-3 mr-1" />
                            +{suggestion.bonus} XP
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Bonus XP for targeting lagging muscle group</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {/* Add to Cart Button */}
                    <Button 
                      size="sm" 
                      onClick={() => handleAddToCart(suggestion)}
                      className="h-8 px-3"
                    >
                      Add
                    </Button>
                    
                    {/* Hide Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleHideSuggestion(suggestion.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Suggestions are based on your muscle training history and available equipment.
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 