import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, EyeOff, Target, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import useLibrary from '../../hooks/useLibrary';
import useAuthStore from '../../store/useAuthStore';

// Equipment icon mapping (same as WorkoutSuggestions)
const equipmentIconMap = {
  'smith machine': '/icons/smith.png',
  dumbbell: '/icons/dumbbell.png',
  barbell: '/icons/barbell.png',
  kettlebell: '/icons/kettlebell.png',
  'sled machine': '/icons/sled machine.jpg',
  'body weight': '/icons/bodyweight.png',
  machine: '/icons/machine.png',
};

const getEquipmentIcon = (equipmentName: string) => {
  if (!equipmentName) return null;
  const lowerCaseEquipment = equipmentName.toLowerCase();

  if (lowerCaseEquipment.includes('dumbbell'))
    return equipmentIconMap['dumbbell'];
  if (lowerCaseEquipment.includes('barbell'))
    return equipmentIconMap['barbell'];
  if (lowerCaseEquipment.includes('kettlebell'))
    return equipmentIconMap['kettlebell'];
  if (lowerCaseEquipment === 'smith machine')
    return equipmentIconMap['smith machine'];
  if (lowerCaseEquipment === 'sled machine')
    return equipmentIconMap['sled machine'];
  if (lowerCaseEquipment === 'body weight')
    return equipmentIconMap['body weight'];
  if (
    lowerCaseEquipment === 'leverage machine' ||
    lowerCaseEquipment === 'cable'
  ) {
    return equipmentIconMap['machine'];
  }
  return null;
};

// Muscle icon mapping (same as WorkoutSuggestions)
const muscleIconMap = {
  quads: '/icons/Muscle-Quads.jpeg',
  abductors: '/icons/Muscle-Abductors.jpeg',
  abs: '/icons/Muscle-Abs.jpeg',
  adductors: '/icons/Muscle-Adductors.jpeg',
  biceps: '/icons/Muscle-Biceps.jpeg',
  calves: '/icons/Muscle-Calves.jpeg',
  delts: '/icons/Muscle-Deltoids.jpeg',
  forearms: '/icons/Muscle-Forearms.jpeg',
  hamstrings: '/icons/Muscle-Hamstrings.jpeg',
  pectorals: '/icons/Muscle-Pectorals.jpeg',
  'serratus anterior': '/icons/Muscle-serratus anterior.jpeg',
  traps: '/icons/Muscle-Traps.jpeg',
  triceps: '/icons/Muscle-Triceps.jpeg',
  glutes: '/icons/Muscle-glutes.jpeg',
};

const getMuscleIcon = (muscleName: string) => {
  if (!muscleName) return null;
  const lowerCaseMuscle = muscleName.toLowerCase();
  return muscleIconMap[lowerCaseMuscle] || null;
};

const muscleMap: Record<string, string> = { quads: 'Quads', abductors: 'Abductors', abs: 'Abs', adductors: 'Adductors', biceps: 'Biceps', calves: 'Calves', delts: 'Delts', forearms: 'Forearms', hamstrings: 'Hamstrings', pectorals: 'Pectorals', 'serratus anterior': 'Serratus Anterior', traps: 'Traps', triceps: 'Triceps', glutes: 'Glutes' };

const getEquipmentName = (equipmentName: string) => {
  // ... existing code ...
};

const getMuscleName = (muscleName: string) => {
  // ... existing code ...
};

// Add a type guard for muscleMap
function getMuscleLabel(muscle: string): string {
  const map = muscleMap as Record<string, string>;
  return Object.prototype.hasOwnProperty.call(map, muscle)
    ? map[muscle]
    : muscle;
}

const HiddenExercisesModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { userProfile, unhideExercise, getRemainingHides } = useAuthStore();
  const exerciseLibrary = useLibrary('exercise');
  const [hiddenExercises, setHiddenExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Always run hooks at the top, render loading placeholder below
  const showLoading = !userProfile || !exerciseLibrary;

  useEffect(() => {
    if (open && exerciseLibrary.items && userProfile?.hiddenExercises) {
      const hiddenWithDetails = userProfile.hiddenExercises
        .map((exerciseId: string) => {
          const exercise = exerciseLibrary.items.find((e: any) => e.id === exerciseId);
          return exercise ? { ...exercise, id: exerciseId } : null;
        })
        .filter(Boolean);
      setHiddenExercises(hiddenWithDetails);
    }
  }, [open, exerciseLibrary.items, userProfile?.hiddenExercises]);

  const handleUnhide = async (exerciseId: string) => {
    setLoading((prev) => ({ ...prev, [exerciseId]: true }));
    try {
      await unhideExercise(exerciseId);
      setHiddenExercises((prev: any[]) => prev.filter((ex) => ex.id !== exerciseId));
    } catch (error) {
      console.error('Error unhiding exercise:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [exerciseId]: false }));
    }
  };

  const remainingHides = getRemainingHides();
  const isBasic = userProfile?.subscription?.status === 'basic';

  if (showLoading) {
    return <div className="p-4 text-center text-gray-400">Loading...</div>;
  }

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
          <div className="bg-equipment border border-equipment rounded-lg p-3">
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
                    Remaining hides today: {remainingHides}/1
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
              <p className="text-sm">
                Exercises you hide from suggestions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenExercises
                .filter((ex: any) => ex)
                .map((exercise: any) => {
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
                                        className="h-6 w-6 p-0.5 bg-equipment rounded-md"
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
                              <Badge className="mr-1">{getMuscleLabel(target)}</Badge>
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

          {userProfile.hiddenExercises && userProfile.hiddenExercises.length > 0 && (
            <Badge className="ml-auto text-xs">
              {userProfile.hiddenExercises.length}
            </Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HiddenExercisesModal;
