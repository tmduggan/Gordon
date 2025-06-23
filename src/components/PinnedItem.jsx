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
      const thumb = item.photo?.thumb;
      return (
        <div className="flex flex-col h-full">
          {/* Food name and image at top */}
          <div className="flex-1 flex items-center justify-center min-h-0 w-full">
            {thumb && (
              <img src={thumb} alt="food thumb" className="h-5 w-5 rounded mr-1 flex-shrink-0" />
            )}
            <strong className="block text-center truncate w-full">{label}</strong>
          </div>
          {/* Nutrition preview at bottom */}
          {/*
          <div className="mt-auto pt-1">
            <span className="text-xs text-gray-600 block text-center">
              <span title="Calories" className="mr-2">🔥{macros.calories}</span>
              <span title="Fat" className="mr-2">🥑{macros.fat}g</span>
              <span title="Carbs" className="mr-2">🍞{macros.carbs}g</span>
              <span title="Protein">🍗{macros.protein}g</span>
            </span>
          </div>
          */}
        </div>
      );
    }
    if (itemType === 'exercise') {
      const { target, equipment, difficulty } = item;
      const equipmentIcon = getEquipmentIcon(equipment);
      const difficultyColor = difficulty ? difficultyColorMap[difficulty.toLowerCase()] : null;
      const muscleIcon = getMuscleIcon(target);

      return (
        <div className="flex flex-col w-full">
          {/* First row: Exercise Name */}
          <div className="pr-2 min-w-0">
            <strong className="block truncate text-center">{label}</strong>
          </div>
          {/* Second row: Icons */}
          <div className="flex items-center gap-1 flex-shrink-0 justify-center mt-1">
            {muscleIcon && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <img src={muscleIcon} alt={target} className="h-5 w-5 rounded-md border border-black" onClick={e => e.stopPropagation()} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">{target}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {equipmentIcon && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <img src={equipmentIcon} alt={equipment} className="h-5 w-5 p-0.5 bg-blue-100 rounded-md" onClick={e => e.stopPropagation()} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">{equipment}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {difficultyColor && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`h-5 w-5 rounded-md ${difficultyColor}`} onClick={e => e.stopPropagation()} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">{difficulty}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      );
    }
    return <strong className="block">{label}</strong>;
  };
  
  const TooltipContentComponent = itemType === 'food' 
    ? (
        <div className="mb-2">
          <div className="font-semibold text-base mb-1 text-center">
            {item.food_name || item.label || item.name}
            {item.serving_qty && item.serving_unit && (
              <span className="block text-xs font-normal text-gray-600 mt-0.5">
                {item.serving_qty} {item.serving_unit}
                {item.serving_weight_grams ? ` (${item.serving_weight_grams}g)` : ''}
              </span>
            )}
          </div>
          <NutritionLabel food={item} />
        </div>
      )
    : <ExerciseInfoCard exercise={item} />;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 p-2 flex flex-col items-stretch min-w-[120px] max-w-[180px] relative"
      onClick={() => onSelect?.(item)}
      tabIndex={0}
      role="button"
      aria-label={label}
    >
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-stretch w-full h-full">
              {renderContent()}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {TooltipContentComponent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-500 z-10"
        onClick={e => {
          e.stopPropagation();
          onPinToggle?.(item.id);
        }}
        tabIndex={-1}
        aria-label="Unpin"
      >
        <span style={{ display: 'inline-block', transform: 'rotate(-90deg)', fontSize: '1.1rem', lineHeight: 1 }} role="img" aria-label="Unpin">📌</span>
      </Button>
    </Card>
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