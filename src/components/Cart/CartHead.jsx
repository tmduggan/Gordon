import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FoodCartHead = () => (
  <thead>
    <tr className="border-b">
      <th className="text-left py-2 px-1 font-semibold">Food</th>
      <th className="text-left py-2 px-1 font-semibold">Qty</th>
      <th className="text-left py-2 px-1 font-semibold">Unit</th>
      <TooltipProvider>
        <th className="text-right py-2 px-1 font-semibold">
          <Tooltip>
            <TooltipTrigger asChild><span>🔥</span></TooltipTrigger>
            <TooltipContent><p>Calories</p></TooltipContent>
          </Tooltip>
        </th>
        <th className="text-right py-2 px-1 font-semibold">
          <Tooltip>
            <TooltipTrigger asChild><span>🥑</span></TooltipTrigger>
            <TooltipContent><p>Fat</p></TooltipContent>
          </Tooltip>
        </th>
        <th className="text-right py-2 px-1 font-semibold">
          <Tooltip>
            <TooltipTrigger asChild><span>🍞</span></TooltipTrigger>
            <TooltipContent><p>Carbs</p></TooltipContent>
          </Tooltip>
        </th>
        <th className="text-right py-2 px-1 font-semibold">
          <Tooltip>
            <TooltipTrigger asChild><span>🍗</span></TooltipTrigger>
            <TooltipContent><p>Protein</p></TooltipContent>
          </Tooltip>
        </th>
        <th className="text-right py-2 px-1 font-semibold">
          <Tooltip>
            <TooltipTrigger asChild><span>🌱</span></TooltipTrigger>
            <TooltipContent><p>Fiber</p></TooltipContent>
          </Tooltip>
        </th>
      </TooltipProvider>
      <th className="py-2 px-1"></th>
    </tr>
  </thead>
);

const ExerciseCartHead = () => (
    <thead>
        <tr className="border-b">
            <th className="text-left py-2 px-1 font-semibold">Exercise</th>
            <th className="text-left py-2 px-1 font-semibold" colSpan="4">Details</th>
            <th className="py-2 px-1"></th>
        </tr>
    </thead>
);

export default function CartHead({ type }) {
  if (type === 'food') {
    return <FoodCartHead />;
  }
  if (type === 'exercise') {
    return <ExerciseCartHead />;
  }
  return null;
} 