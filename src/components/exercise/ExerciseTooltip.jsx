import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState } from 'react';

export default function ExerciseTooltip({ exercise, children, bonusXP, laggingType }) {
  if (!exercise) return children;

  const [gifError, setGifError] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="max-w-xs">
            {/* GIF at the top */}
            {exercise.gifUrl && !gifError && (
              <img
                src={exercise.gifUrl}
                alt={exercise.name + ' demo'}
                className="w-full h-36 object-contain rounded mb-2 border border-gray-200 bg-gray-50"
                onError={() => setGifError(true)}
              />
            )}
            {/* Fallback if GIF fails */}
            {exercise.gifUrl && gifError && (
              <div className="w-full h-36 flex items-center justify-center bg-gray-100 text-xs text-gray-500 rounded mb-2 border border-gray-200">
                GIF unavailable
              </div>
            )}
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
            {/* XP and Lagging Type */}
            {(bonusXP !== undefined || laggingType) && (
              <div className="mb-2 flex items-center gap-3">
                {bonusXP !== undefined && (
                  <span className="flex items-center text-green-700 font-semibold text-sm">
                    <span className="mr-1">⚡</span>+{bonusXP} XP
                  </span>
                )}
                {laggingType && (
                  <span className="flex items-center text-red-600 font-semibold text-sm">
                    <span className="mr-1">🌀</span>
                    {laggingType === 'neverTrained' ? 'Never Trained' : laggingType.replace(/([A-Z])/g, ' $1')}
                  </span>
                )}
              </div>
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