import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, EyeOff, Target, Zap, Pin, PinOff, Clock, TrendingUp } from 'lucide-react';
import { getEquipmentIcon, getMuscleIcon } from '../../utils/iconMappings';
import ExerciseTooltip from './ExerciseTooltip';

/**
 * ExerciseDisplay - unified component for rendering an exercise in any context (pinned, suggestion, detailed, etc.)
 * Props:
 *   - exercise: object (required)
 *   - variant: 'row' | 'card' | 'detailed' (default: 'row')
 *   - showXP: bool
 *   - showPinIcon: bool
 *   - showUnhideButton: bool
 *   - showSecondaryMuscles: bool
 *   - showBodyPart: bool
 *   - showCategory: bool
 *   - bonusXP: number
 *   - laggingType: string
 *   - reason: string
 *   - showTooltip: bool
 *   - onPinToggle: function
 *   - onUnhide: function
 *   - onClick: function
 *   - loading: bool
 *   - className: string
 *   - children: node
 */
export default function ExerciseDisplay({ 
  exercise, 
  variant = 'row',
  showXP = true, 
  showPinIcon = false, 
  showUnhideButton = false,
  showSecondaryMuscles = false,
  showBodyPart = false,
  showCategory = false,
  bonusXP = undefined,
  laggingType = undefined,
  reason = undefined,
  showTooltip = false,
  onPinToggle,
  onUnhide,
  onClick,
  loading = false,
  className = "",
  children
}) {
  if (!exercise) return null;

  const { id, name, target, equipment, difficulty, xp, secondaryMuscles, bodyPart, category } = exercise;
  const equipmentIcon = getEquipmentIcon(equipment);
  const muscleIcon = getMuscleIcon(target);

  // Lagging type badge/icon logic
  const getLaggingTypeIcon = (type) => {
    switch (type) {
      case 'neverTrained':
        return <Target className="h-4 w-4 text-red-500" />;
      case 'underTrained':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'neglected':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };
  const getLaggingTypeColor = (type) => {
    switch (type) {
      case 'neverTrained':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'underTrained':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'neglected':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Layout selection
  if (variant === 'detailed') {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex flex-col gap-2">
          <strong className="block text-lg">{name}</strong>
          <div className="flex flex-row items-center gap-2">
            {muscleIcon && <img src={muscleIcon} alt={target} className="h-6 w-6 rounded-md border border-black" />}
            {equipmentIcon && <img src={equipmentIcon} alt={equipment} className="h-6 w-6 p-0.5 bg-blue-100 rounded-md" />}
            {showXP && xp !== undefined && <Badge variant="secondary" className="text-sm"><Zap className="h-4 w-4 mr-1" />{xp} XP</Badge>}
            {bonusXP !== undefined && (
              <Badge className="bg-green-100 text-green-800 border-green-200 text-sm ml-2">
                <Zap className="h-4 w-4 mr-1" />+{bonusXP} XP
              </Badge>
            )}
            {laggingType && (
              <Badge variant="outline" className={`text-sm ml-2 ${getLaggingTypeColor(laggingType)}`}>
                {getLaggingTypeIcon(laggingType)}
                <span className="ml-1 capitalize">{laggingType.replace(/([A-Z])/g, ' $1')}</span>
              </Badge>
            )}
          </div>
          {showSecondaryMuscles && secondaryMuscles && (
            <div className="text-sm text-gray-600">Secondary: {Array.isArray(secondaryMuscles) ? secondaryMuscles.join(', ') : secondaryMuscles}</div>
          )}
          {showBodyPart && bodyPart && (
            <div className="text-sm text-gray-600">Body Part: {bodyPart}</div>
          )}
          {showCategory && category && (
            <div className="text-sm text-gray-600">Category: {category}</div>
          )}
          {children}
        </div>
      </Card>
    );
  }

  // Default: row/card
  const content = (
    <div className="flex items-center justify-between">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
        {/* Exercise Name */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <strong className="block text-lg">
            {name}
          </strong>
        </div>
        {/* Icons and Badges Row */}
        <div className="flex flex-row items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          {/* Icons Row */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {muscleIcon && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <img 
                      src={muscleIcon} 
                      alt={target} 
                      className="h-6 w-6 rounded-md border border-black" 
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="capitalize">{target}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {equipmentIcon && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <img 
                      src={equipmentIcon} 
                      alt={equipment} 
                      className="h-6 w-6 p-0.5 bg-blue-100 rounded-md" 
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="capitalize">{equipment}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {/* XP Display */}
          {showXP && xp !== undefined && (
            <div className="flex-shrink-0">
              <Badge variant="secondary" className="text-sm">
                <Zap className="h-4 w-4 mr-1" />
                {xp} XP
              </Badge>
            </div>
          )}
          {/* Bonus XP Badge */}
          {bonusXP !== undefined && (
            <div className="flex-shrink-0">
              <Badge className="bg-green-100 text-green-800 border-green-200 text-sm">
                <Zap className="h-4 w-4 mr-1" />+{bonusXP} XP
              </Badge>
            </div>
          )}
          {/* Lagging Type Badge */}
          {laggingType && (
            <div className="flex-shrink-0">
              <Badge variant="outline" className={`text-sm ${getLaggingTypeColor(laggingType)}`}>
                {getLaggingTypeIcon(laggingType)}
                <span className="ml-1 capitalize">{laggingType.replace(/([A-Z])/g, ' $1')}</span>
              </Badge>
            </div>
          )}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex-shrink-0 ml-4 flex gap-2">
        {/* Pin/Unpin Button */}
        {showPinIcon && onPinToggle && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPinToggle(exercise)}
                  disabled={loading}
                  className="h-8 px-3"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  ) : (
                    <>
                      <Pin className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unpin exercise</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {/* Unhide Button */}
        {showUnhideButton && onUnhide && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUnhide(id)}
                  disabled={loading}
                  className="h-8 px-3"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Unhide
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show this exercise in suggestions again</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  const cardProps = onClick ? {
    role: 'button',
    tabIndex: 0,
    onClick: (e) => {
      if (onClick) onClick(e);
    },
    className: `cursor-pointer ${className}`
  } : { className };

  // Optionally wrap in a tooltip for reason
  if (showTooltip) {
    return (
      <ExerciseTooltip exercise={exercise}>
        <Card {...cardProps}>{content}</Card>
      </ExerciseTooltip>
    );
  }

  return <Card {...cardProps}>{content}</Card>;
} 