import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, EyeOff, Target, Zap } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useLibrary from '../../hooks/fetchLibrary';

// Equipment icon mapping (same as WorkoutSuggestions)
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

// Muscle icon mapping (same as WorkoutSuggestions)
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
};

export default function HiddenExercisesModal({ open, onOpenChange }) {
  const { userProfile, unhideExercise, getRemainingHides } = useAuthStore();
  const exerciseLibrary = useLibrary('exercise');
  const [hiddenExercises, setHiddenExercises] = useState([]);
  const [loading, setLoading] = useState({});

  // Get hidden exercises with full details
  useEffect(() => {
    if (open && exerciseLibrary.items && userProfile?.hiddenExercises) {
      const hiddenWithDetails = userProfile.hiddenExercises
        .map(exerciseId => {
          const exercise = exerciseLibrary.items.find(e => e.id === exerciseId);
          return exercise ? { ...exercise, id: exerciseId } : null;
        })
        .filter(Boolean);
      setHiddenExercises(hiddenWithDetails);
    }
  }, [open, exerciseLibrary.items, userProfile?.hiddenExercises]);

  const handleUnhide = async (exerciseId) => {
    setLoading(prev => ({ ...prev, [exerciseId]: true }));
    try {
      await unhideExercise(exerciseId);
      // Remove from local state
      setHiddenExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    } catch (error) {
      console.error('Error unhiding exercise:', error);
    } finally {
      setLoading(prev => ({ ...prev, [exerciseId]: false }));
    }
  };

  const remainingHides = getRemainingHides();
  const isBasic = userProfile?.subscription?.status === 'basic';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-gray-600" />
            Hidden Exercises
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <EyeOff className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">
                  Manage Hidden Exercises
                </div>
                <div className="text-blue-700">
                  These are exercises you've manually hidden from suggestions. 
                  Unhide them to see them again in your workout suggestions.
                </div>
                {isBasic && (
                  <div className="mt-2 text-blue-600 font-medium">
                    Remaining hides today: {remainingHides}/2
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden exercises list */}
          {hiddenExercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <EyeOff className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No hidden exercises</p>
              <p className="text-sm">Exercises you hide from suggestions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenExercises.map((exercise) => {
                const { target, equipment, difficulty } = exercise;
                const equipmentIcon = getEquipmentIcon(equipment);
                const muscleIcon = getMuscleIcon(target);
                const isLoading = loading[exercise.id];

                return (
                  <Card key={exercise.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
                        {/* Exercise Name */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <strong className="block text-lg">
                            {exercise.name}
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
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="capitalize">{equipment}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          
                          {/* Target Badge */}
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="text-sm">
                              <Target className="h-4 w-4 mr-1" />
                              {target}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Unhide Button */}
                      <div className="flex-shrink-0 ml-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnhide(exercise.id)}
                                disabled={isLoading}
                                className="h-8 px-3"
                              >
                                {isLoading ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Unhide
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Show this exercise in suggestions again</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 