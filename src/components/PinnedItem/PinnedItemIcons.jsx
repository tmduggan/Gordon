import React from 'react';
import { getEquipmentIcon, getMuscleIcon, difficultyColorMap } from '../../utils/iconMappings';

/**
 * Food-specific icons component
 */
function FoodIcons({ item }) {
  const thumb = item.photo?.thumb;
  
  return (
    <>
      {thumb && (
        <img 
          src={thumb} 
          alt="food thumb" 
          className="h-6 w-6 rounded object-cover" 
        />
      )}
    </>
  );
}

/**
 * Exercise-specific icons component
 */
function ExerciseIcons({ item }) {
  const { target, equipment, difficulty } = item;
  const equipmentIcon = getEquipmentIcon(equipment);
  const difficultyColor = difficulty ? difficultyColorMap[difficulty.toLowerCase()] : null;
  const muscleIcon = getMuscleIcon(target);
  
  return (
    <>
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
    </>
  );
}

/**
 * Shared icons component for pinned items
 * Renders appropriate icons based on item type
 */
export function PinnedItemIcons({ item, itemType }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-shrink-0">
      {itemType === 'food' ? (
        <FoodIcons item={item} />
      ) : (
        <ExerciseIcons item={item} />
      )}
    </div>
  );
} 