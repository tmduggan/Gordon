import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Target, Zap } from 'lucide-react';

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

const CompletedExerciseBar = ({ exercise, completedAt, bonus, className = "" }) => {
  const { target, equipment, difficulty } = exercise;
  const equipmentIcon = getEquipmentIcon(equipment);
  const muscleIcon = getMuscleIcon(target);
  
  const renderTooltipContent = () => (
    <div className="max-w-xs">
      <div className="font-semibold text-base mb-2">{exercise.name}</div>
      <div className="mb-2">
        <p className="text-sm text-green-600 font-medium">
          <CheckCircle className="inline h-4 w-4 mr-1" />Completed {completedAt ? new Date(completedAt).toLocaleDateString() : 'recently'}
        </p>
        {bonus && (
          <p className="text-sm text-green-700 font-semibold mt-1">
            <Zap className="inline h-4 w-4 mr-1" />+{bonus} XP
          </p>
        )}
      </div>
      {exercise.description && (
        <div className="mb-3">
          <div className="font-medium text-sm mb-1 text-blue-600">Description:</div>
          <p className="text-sm text-gray-700 leading-relaxed">{exercise.description}</p>
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2">
        <span>Target: {target}</span>
        {equipment && <span>Equipment: {equipment}</span>}
        {difficulty && <span>Difficulty: {difficulty}</span>}
      </div>
    </div>
  );

  return (
    <Card className={`cursor-default p-4 flex flex-row items-center justify-between min-w-full relative bg-green-50 border-green-200 ${className}`}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
              {/* Exercise Name with Check Icon */}
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <strong className="block text-lg text-green-800">{exercise.name}</strong>
                </div>
              </div>
              {/* Right-aligned icons row */}
              <div className="flex flex-row items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                {muscleIcon && (
                  <img 
                    src={muscleIcon} 
                    alt={target} 
                    className="h-6 w-6 rounded-md border border-black" 
                  />
                )}
                {equipmentIcon && (
                  <img 
                    src={equipmentIcon} 
                    alt={equipment} 
                    className="h-6 w-6 p-0.5 bg-blue-100 rounded-md" 
                  />
                )}
                {/* Completed Icon Only */}
                <CheckCircle className="h-4 w-4 text-green-600" title="Completed" />
                {/* Bonus XP Icon Only */}
                {bonus && <Zap className="h-4 w-4 text-green-600" title="XP" />}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {renderTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>
  );
};

export default CompletedExerciseBar;