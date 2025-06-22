import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import MacroDisplay from './nutrition/MacroDisplay';
import { getFoodMacros } from '../utils/dataUtils';
import React from 'react';
import ScoreDisplay from './ScoreDisplay';
import NutritionLabel from "./nutrition/NutritionLabel";
import ExerciseInfoCard from "./exercise/ExerciseInfoCard";

export function PinnedItem({ item, onSelect, onPinToggle, itemType }) {
  const label = item.label || item.food_name || item.name;
  
  const renderContent = () => {
    if (itemType === 'food') {
      const macros = getFoodMacros(item);
      return <MacroDisplay macros={macros} format="stacked">{label}</MacroDisplay>;
    }
    if (itemType === 'exercise') {
      const { target, equipment, difficulty } = item;
      const subtext = [target, equipment, difficulty].filter(Boolean).join(' • ');
      return (
        <>
          <strong className="block">{label}</strong>
          <span className="text-xs text-gray-600">{subtext}</span>
        </>
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
          className="p-2 flex justify-between items-start cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelect(item)}
        >
          <div className="flex-grow">{renderContent()}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
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