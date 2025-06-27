import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileTooltip } from "@/components/ui/mobileTooltip";
import React from 'react';
import ExerciseInfoCard from "./exercise/ExerciseInfoCard";
import { FoodTooltipContent } from "./PinnedItem/FoodTooltipContent";
import { 
  PinnedItemLayout, 
  PinnedItemTitle, 
  PinnedItemActions, 
  PinnedItemIcons 
} from './PinnedItem/index';
import ExerciseTooltip from './tooltips/ExerciseTooltip';

export function PinnedItem({ item, onSelect, onPinToggle, itemType }) {
  const label = item.label || item.food_name || item.name;
  
  const TooltipContentComponent = itemType === 'food' 
    ? <FoodTooltipContent item={item} />
    : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 p-3 flex flex-col items-stretch min-w-[120px] max-w-[180px] h-24 relative"
      onClick={() => onSelect?.(item)}
      tabIndex={0}
      role="button"
      aria-label={label}
    >
      {itemType === 'exercise' ? (
        <ExerciseTooltip exercise={item}>
          <PinnedItemLayout>
            <PinnedItemTitle label={label} />
            <PinnedItemIcons item={item} itemType={itemType} />
            <PinnedItemActions onPinToggle={onPinToggle} itemId={item.id} />
          </PinnedItemLayout>
        </ExerciseTooltip>
      ) : (
        <MobileTooltip
          content={TooltipContentComponent}
          side="bottom"
          delayDuration={300}
          showInfoButton={true}
          infoButtonPosition="top-right"
          className="w-full h-full"
        >
          <PinnedItemLayout>
            <PinnedItemTitle label={label} />
            <PinnedItemIcons item={item} itemType={itemType} />
            <PinnedItemActions onPinToggle={onPinToggle} itemId={item.id} />
          </PinnedItemLayout>
        </MobileTooltip>
      )}
    </Card>
  );
}

export function PinnedItemsGrid({ 
  items, 
  onSelectItem, 
  onPinToggleItem, 
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