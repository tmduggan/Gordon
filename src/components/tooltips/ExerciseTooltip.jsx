import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';

export default function ExerciseTooltip({ exercise, children }) {
  if (!exercise) return children;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="max-w-xs">
            <div className="font-semibold text-base mb-2">{exercise.name}</div>
            {exercise.description && (
              <div className="mb-3">
                <div className="font-medium text-sm mb-1 text-blue-600">Description:</div>
                <p className="text-sm text-gray-700 leading-relaxed">{exercise.description}</p>
              </div>
            )}
            {exercise.instructions && Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
              <div className="mb-3">
                <div className="font-medium text-sm mb-1 text-green-600">Instructions:</div>
                <ol className="text-sm text-gray-700 space-y-1">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={index} className="leading-relaxed">{index + 1}. {instruction}</li>
                  ))}
                </ol>
              </div>
            )}
            {exercise.laggingMessage && (
              <div className="mb-2 text-sm text-purple-700">{exercise.laggingMessage}</div>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2 mt-2">
              <span>Target: {exercise.target}</span>
              {exercise.equipment && <span>Equipment: {exercise.equipment}</span>}
              {exercise.category && <span>Type: {exercise.category}</span>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 