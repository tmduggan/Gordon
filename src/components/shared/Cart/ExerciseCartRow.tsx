import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import React, { useState } from 'react';
import ExerciseLogInputs from '../../exercise/ExerciseLogInputs';
import { ExerciseTooltipContent } from '../../exercise/ExerciseTooltip';
import type { Exercise } from '../../../types';
import { toTitleCase } from '@/utils/dataUtils';
import ExerciseTooltip from '../../exercise/ExerciseTooltip';
import { getEquipmentIcon, getMuscleIcon } from '@/utils/iconMappings';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface ExerciseLogData {
  [exerciseId: string]: {
    sets?: Array<{
      weight?: number;
      reps?: number;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
}

interface LastSetPlaceholder {
  weight?: number;
  reps?: number;
}

interface ExerciseCartRowProps {
  item: Exercise;
  removeFromCart?: (id: string) => void;
  logData?: ExerciseLogData;
  onLogDataChange?: (id: string, newValues: any) => void;
  userWorkoutHistory?: any[];
}

interface InfoDialogProps {
  item: Exercise;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

export default function ExerciseCartRow({
  item,
  removeFromCart = () => {},
  logData,
  onLogDataChange = () => {},
  userWorkoutHistory,
}: ExerciseCartRowProps) {
  if ('label' in item) {
    throw new Error('Tried to render a non-exercise item in ExerciseCartRow');
  }
  const { name, id, target, equipment } = item;
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const itemLogData = logData && logData[id] ? logData[id] : {};
  const equipmentIcon = getEquipmentIcon(equipment);
  const muscleIcon = getMuscleIcon(target);
  const isMobile = useIsMobile();
  
  const handleLogChange = (id: string, newValues: any) => {
    onLogDataChange(id, newValues);
  };
  
  let lastSetPlaceholder: LastSetPlaceholder | null = null;
  if (Array.isArray(userWorkoutHistory)) {
    const lastLog = userWorkoutHistory.find(
      (log) =>
        log.exerciseId === id && Array.isArray(log.sets) && log.sets.length > 0
    );
    if (lastLog) {
      const lastSet = lastLog.sets[lastLog.sets.length - 1];
      if (lastSet) {
        lastSetPlaceholder = { weight: lastSet.weight, reps: lastSet.reps };
      }
    }
  }
  
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <ExerciseTooltip exercise={item}>
              <span className="font-semibold text-sm cursor-pointer">{toTitleCase(name)}</span>
            </ExerciseTooltip>
            <div className="flex flex-row items-center gap-2">
              {muscleIcon && (
                <img src={muscleIcon} alt={target} className="h-5 w-5 rounded border border-black" />
              )}
              {equipmentIcon && (
                <img src={equipmentIcon} alt={equipment} className="h-5 w-5 p-0.5 bg-equipment rounded" />
              )}
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs flex items-center gap-1">
                <Zap className="h-4 w-4" />
                {!isMobile && <span>Log Sets</span>}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowConfirm(true)}
                className="text-red-600"
              >
                Remove Exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ExerciseLogInputs
            exercise={item}
            logData={itemLogData}
            onLogDataChange={handleLogChange}
            lastSetPlaceholder={lastSetPlaceholder}
          />
        </div>
      </CardContent>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Exercise?</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            Are you sure you want to remove this exercise and all its sets from
            your cart?
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowConfirm(false);
                removeFromCart(item.id);
              }}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 