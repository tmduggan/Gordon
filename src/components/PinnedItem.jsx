import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import MacroDisplay from './nutrition/MacroDisplay';
import { getFoodMacros } from '../utils/dataUtils';
import React from 'react';
import ScoreDisplay from './ScoreDisplay';
import NutritionLabel from "./nutrition/NutritionLabel";
import ExerciseInfoCard from "./exercise/ExerciseInfoCard";

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
  // Add other muscle-to-icon mappings here
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

export function PinnedItem({ item, onSelect, onPinToggle, itemType }) {
  const label = item.label || item.food_name || item.name;
  
  const renderContent = () => {
    if (itemType === 'food') {
      const macros = getFoodMacros(item);
      return <MacroDisplay macros={macros} format="stacked">{label}</MacroDisplay>;
    }
    if (itemType === 'exercise') {
      const { target, equipment, difficulty } = item;
      const subtext = [target].filter(Boolean).join(' • ');
      const equipmentIcon = getEquipmentIcon(equipment);
      const difficultyColor = difficulty ? difficultyColorMap[difficulty.toLowerCase()] : null;
      const muscleIcon = getMuscleIcon(target);

      return (
        <div className="flex-grow pr-1">
          <strong className="block">{label}</strong>
          <div className="flex items-center gap-1 text-xs text-gray-600 capitalize">
            <span>{subtext}</span>
          </div>
          {muscleIcon && (
            <Tooltip>
                <TooltipTrigger asChild>
                    <img 
                        src={muscleIcon} 
                        alt={target} 
                        className="absolute bottom-1 right-15 h-5 w-5 rounded-md border border-black"
                        onClick={(e) => e.stopPropagation()}
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
                        className="absolute bottom-1 right-8 h-5 w-5 p-0.5 bg-blue-100 rounded-md"
                        onClick={(e) => e.stopPropagation()}
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
                        className={`absolute bottom-1 right-1 h-5 w-5 rounded-md ${difficultyColor}`}
                        onClick={(e) => e.stopPropagation()}
                    />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="capitalize">{difficulty}</p>
                </TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    }
    return <strong className="block">{label}</strong>;
  };
  
  const TooltipContentComponent = itemType === 'food' 
    ? <NutritionLabel food={item} /> 
    : <ExerciseInfoCard exercise={item} />;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Card
          className="p-2 flex justify-between items-start cursor-pointer hover:shadow-md transition-shadow relative"
          onClick={() => onSelect(item)}
        >
          {renderContent()}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 absolute top-1 right-1"
            onClick={(e) => { e.stopPropagation(); onPinToggle(item.id); }}
            title="Unpin item"
          >
            📌
          </Button>
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        {TooltipContentComponent}
      </TooltipContent>
    </Tooltip>
  );
}

export function PinnedItemsGrid({ 
  items, 
  onSelectItem, 
  onPinToggleItem, 
  onAddItem, 
  itemType 
}) {
  const title = itemType === 'food' ? 'Foods' : 'Exercises';

  return (
    <div className="pb-4">
      <h3 className="text-sm font-semibold mb-2 text-foreground/80">Pinned {title}</h3>
      <TooltipProvider>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {items.map((item) => (
            <PinnedItem
              key={item.id}
              item={item}
              onSelect={onSelectItem}
              onPinToggle={onPinToggleItem}
              itemType={itemType}
            />
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
} 