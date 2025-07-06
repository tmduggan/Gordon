import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { ReactNode } from 'react';
import useExerciseLogStore from '../../store/useExerciseLogStore';
import { getEquipmentIcon, getMuscleIcon } from '../../utils/iconMappings';
import ExerciseTooltip from './ExerciseTooltip';
import type { Exercise, UserProfile } from '../../types';
import { toTitleCase } from '@/utils/dataUtils';

export interface ExerciseDisplayProps {
  exercise: Exercise;
  variant?: 'row' | 'card' | 'detailed';
  showXP?: boolean;
  showPinIcon?: boolean;
  showUnhideButton?: boolean;
  showSecondaryMuscles?: boolean;
  showBodyPart?: boolean;
  showCategory?: boolean;
  bonusXP?: number;
  laggingType?: string;
  reason?: string;
  showTooltip?: boolean;
  onPinToggle?: () => void;
  onUnhide?: (id: string) => void;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
  nameClassName?: string;
  children?: ReactNode;
  showHideButton?: boolean;
  onHide?: (id: string) => void;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  userProfile?: UserProfile;
}

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
  className = '',
  nameClassName = 'text-lg',
  children,
  showHideButton = false,
  onHide,
  showRefreshButton = false,
  onRefresh,
  userProfile = undefined,
}: ExerciseDisplayProps) {
  if (!exercise) return null;

  const {
    id,
    name,
    target,
    equipment,
    difficulty,
    secondaryMuscles,
    category,
  } = exercise;
  const equipmentIcon = getEquipmentIcon(equipment);
  const muscleIcon = getMuscleIcon(target);

  const { logs: workoutLog } = useExerciseLogStore();

  // Lagging type badge/icon logic
  const getLaggingTypeIcon = (type: string) => {
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
  const getLaggingTypeColor = (laggingType?: string) => {
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

  // Layout selection
  if (variant === 'detailed') {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex flex-col gap-2">
          <strong className="block text-lg">{toTitleCase(name)}</strong>
          <div className="flex flex-row items-center gap-2">
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
            {showXP && bonusXP !== undefined && (
              <Badge className="bg-green-100 text-green-800 border-green-200 text-sm ml-2">
                <Zap className="h-4 w-4 mr-1" />+{bonusXP} XP
              </Badge>
            )}
            {laggingType && (
              <Badge
                className={`text-sm ml-2 ${getLaggingTypeColor(laggingType)}`}
              >
                {getLaggingTypeIcon(laggingType)}
                <span className="ml-1 capitalize">
                  {laggingType.replace(/([A-Z])/g, ' $1')}
                </span>
              </Badge>
            )}
          </div>
          {showSecondaryMuscles && secondaryMuscles && (
            <div className="text-sm text-gray-600">
              Secondary:{' '}
              {Array.isArray(secondaryMuscles)
                ? secondaryMuscles.join(', ')
                : secondaryMuscles}
            </div>
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
  const mainContent = (
    <div className="flex flex-row items-center w-full justify-between">
      {/* Left: Exercise Name */}
      <strong className={nameClassName}>{toTitleCase(name)}</strong>
      {/* Right: Icons and Status */}
      <div className="flex flex-row items-center gap-2 ml-4">
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
        {showXP && bonusXP !== undefined && (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-sm ml-2">
            <Zap className="h-4 w-4 mr-1" />+{bonusXP} XP
          </Badge>
        )}
        {laggingType && (
          <Badge
            className={`text-sm ml-2 ${getLaggingTypeColor(laggingType)}`}
          >
            {getLaggingTypeIcon(laggingType)}
            <span className="ml-1 capitalize">
              {laggingType.replace(/([A-Z])/g, ' $1')}
            </span>
          </Badge>
        )}
      </div>
    </div>
  );

  const content = (
    <div className="flex items-center justify-between">
      <ExerciseTooltip
        exercise={exercise}
        bonusXP={bonusXP}
        laggingType={laggingType}
        userProfile={userProfile}
      >
        {mainContent}
      </ExerciseTooltip>
      {/* Exercise Actions */}
      <div className="flex items-center gap-2">
        {showPinIcon && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => { e.stopPropagation(); onPinToggle && onPinToggle(); }}
                  className="text-gray-500 hover:text-gray-900"
                >
                  {onPinToggle ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {onPinToggle ? 'Unpin' : 'Pin'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {showUnhideButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => { e.stopPropagation(); onUnhide?.(id); }}
                  className="text-gray-500 hover:text-gray-900"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Unhide
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {showHideButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => { e.stopPropagation(); onHide?.(id); }}
                  className="text-gray-500 hover:text-gray-900"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Hide
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {showRefreshButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => { e.stopPropagation(); onRefresh && onRefresh(); }}
                  className="text-gray-500 hover:text-gray-900"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Refresh
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  return (
    <Card className={`p-4 ${className}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      {content}
    </Card>
  );
} 