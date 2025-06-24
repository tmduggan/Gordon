import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { MobileTooltip, useIsMobile } from "@/components/ui/mobileTooltip";
import MacroDisplay from './nutrition/MacroDisplay';
import { getFoodMacros } from '../utils/dataUtils';
import React from 'react';
import ScoreDisplay from './ScoreDisplay';
import NutritionLabel from "./nutrition/NutritionLabel";
import ExerciseInfoCard from "./exercise/ExerciseInfoCard";
import { Info } from 'lucide-react';

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
  const isMobile = useIsMobile();
  
  const renderContent = () => {
    if (itemType === 'food') {
      const macros = getFoodMacros(item);
      const thumb = item.photo?.thumb;
      return (
        <div className="flex flex-col h-full">
          {/* Title at the top */}
          <div className="flex-1 flex items-center justify-center min-h-0 w-full mb-2">
            <strong className="block text-center truncate w-full text-sm">{label}</strong>
          </div>
          
          {/* Icons row at the bottom */}
          <div className="flex items-center justify-center gap-2 flex-shrink-0">
            {/* Food image */}
            {thumb && (
              <img 
                src={thumb} 
                alt="food thumb" 
                className="h-6 w-6 rounded object-cover" 
              />
            )}
            
            {/* Pin button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onPinToggle?.(item.id);
              }}
            >
              <span style={{ display: 'inline-block', transform: 'rotate(-90deg)', fontSize: '1rem', lineHeight: 1 }} role="img" aria-label="Unpin">📌</span>
            </Button>
          </div>
        </div>
      );
    }
    
    if (itemType === 'exercise') {
      const { target, equipment, difficulty } = item;
      const equipmentIcon = getEquipmentIcon(equipment);
      const difficultyColor = difficulty ? difficultyColorMap[difficulty.toLowerCase()] : null;
      const muscleIcon = getMuscleIcon(target);
      
      return (
        <div className="flex flex-col h-full">
          {/* Title at the top */}
          <div className="flex-1 flex items-center justify-center min-h-0 w-full mb-2">
            <strong className="block text-center truncate w-full text-sm">{label}</strong>
          </div>
          
          {/* Icons row at the bottom */}
          <div className="flex items-center justify-center gap-2 flex-shrink-0">
            {/* Muscle icon */}
            {muscleIcon && (
              <img 
                src={muscleIcon} 
                alt={target} 
                className="h-6 w-6 rounded-md border border-black object-cover" 
              />
            )}
            
            {/* Equipment icon */}
            {equipmentIcon && (
              <img 
                src={equipmentIcon} 
                alt={equipment} 
                className="h-6 w-6 p-0.5 bg-blue-100 rounded-md object-cover" 
              />
            )}
            
            {/* Difficulty indicator */}
            {difficultyColor && (
              <div className={`h-6 w-6 rounded-md ${difficultyColor}`} />
            )}
            
            {/* Pin button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onPinToggle?.(item.id);
              }}
            >
              <span style={{ display: 'inline-block', transform: 'rotate(-90deg)', fontSize: '1rem', lineHeight: 1 }} role="img" aria-label="Unpin">📌</span>
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center min-h-0 w-full mb-2">
          <strong className="block text-center truncate w-full text-sm">{label}</strong>
        </div>
        <div className="flex items-center justify-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onPinToggle?.(item.id);
            }}
          >
            <span style={{ display: 'inline-block', transform: 'rotate(-90deg)', fontSize: '1rem', lineHeight: 1 }} role="img" aria-label="Unpin">📌</span>
          </Button>
        </div>
      </div>
    );
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
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 p-3 flex flex-col items-stretch min-w-[120px] max-w-[180px] h-24 relative"
      onClick={() => onSelect?.(item)}
      tabIndex={0}
      role="button"
      aria-label={label}
    >
      <MobileTooltip
        content={TooltipContentComponent}
        side="bottom"
        delayDuration={300}
        showInfoButton={true}
        infoButtonPosition="top-right"
        className="w-full h-full"
      >
        <div className="flex flex-col items-stretch w-full h-full">
          {renderContent()}
        </div>
      </MobileTooltip>
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