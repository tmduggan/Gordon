import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, EyeOff, Target, Zap, Pin, PinOff, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { getEquipmentIcon, getMuscleIcon } from '../../utils/iconMappings';
import ExerciseTooltip from './ExerciseTooltip';
import useExerciseLogStore from '../../store/useExerciseLogStore';

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
 *   - nameClassName: string
 *   - children: node
 *   - showHideButton: bool
 *   - onHide: function
 *   - showRefreshButton: bool
 *   - onRefresh: function
 *   - userProfile: object
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
  nameClassName = "text-lg",
  children,
  showHideButton = false,
  onHide,
  showRefreshButton = false,
  onRefresh,
  userProfile = undefined
}) {
  if (!exercise) return null;

  const { id, name, target, equipment, difficulty, xp, secondaryMuscles, bodyPart, category } = exercise;
  const equipmentIcon = getEquipmentIcon(equipment);
  const muscleIcon = getMuscleIcon(target);

  const { logs: workoutLog } = useExerciseLogStore();

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
  const getLaggingTypeColor = (laggingType) => {
    switch (laggingType) {
      case 'neverTrained':
        return 'bg-status-error text-status-error border-status-error';
      case 'underTrained':
        return 'bg-status-warning text-status-warning border-status-warning';
      case 'neglected':
        return 'bg-status-warning text-status-warning border-status-warning';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Utility: Convert string to Title Case (capitalize first letter of each word, leave numbers/symbols as-is)
  function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
  }

  // Layout selection
  if (variant === 'detailed') {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex flex-col gap-2">
          <strong className="block text-lg">{toTitleCase(name)}</strong>
          <div className="flex flex-row items-center gap-2">
            {muscleIcon && <img src={muscleIcon} alt={target} className="h-6 w-6 rounded-md border border-black" />}
            {equipmentIcon && <img src={equipmentIcon} alt={equipment} className="h-6 w-6 p-0.5 bg-equipment rounded-md" />}
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
        <ExerciseTooltip exercise={exercise} bonusXP={bonusXP} laggingType={laggingType} userProfile={userProfile} workoutLog={workoutLog}>
          <div className="flex flex-1 min-w-0 w-full sm:w-auto items-center justify-between">
            <strong className={`block mr-2 ${nameClassName}`}>{toTitleCase(name)}</strong>
            <div className="flex flex-row items-center gap-2 flex-shrink-0 justify-end">
              {muscleIcon && (
                <img 
                  src={muscleIcon} 
                  alt={target} 
                  className="h-6 w-6 rounded-md border border-black" 
                />
              )}
              {equipmentIcon && (
                <img 
                  src={equipmentIcon} 
                  alt={equipment} 
                  className="h-6 w-6 p-0.5 bg-equipment rounded-md" 
                />
              )}
              {bonusXP !== undefined && (
                <Zap className="h-4 w-4 text-green-600" title="XP" />
              )}
              {laggingType === 'neverTrained' && (
                <Target className="h-4 w-4 text-red-500" title="Never Trained" />
              )}
              {laggingType === 'underTrained' && (
                <TrendingUp className="h-4 w-4 text-orange-500" title="Under Trained" />
              )}
              {laggingType === 'neglected' && (
                <Clock className="h-4 w-4 text-yellow-500" title="Neglected" />
              )}
            </div>
          </div>
        </ExerciseTooltip>
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
        {/* Hide Button */}
        {showHideButton && onHide && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onHide(id)}
                  disabled={loading}
                  className="h-8 px-3"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-1" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hide this exercise from suggestions and search</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {/* Per-suggestion Refresh Button */}
        {showRefreshButton && onRefresh && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                  className="h-8 px-3"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh this suggestion</p>
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