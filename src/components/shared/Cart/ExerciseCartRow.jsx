import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import ExerciseLogInputs from '../../exercise/ExerciseLogInputs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ExerciseTooltipContent } from '../../exercise/ExerciseTooltip';

export default function ExerciseCartRow({
  item,
  removeFromCart = () => {},
  logData,
  onLogDataChange = () => {},
  userWorkoutHistory
}) {
  // Runtime check: throw if not an exercise item
  if ('label' in item || item.type === 'recipe') {
    throw new Error('Tried to render a non-exercise item in ExerciseCartRow');
  }
  const { name, id } = item;
  const [showConfirm, setShowConfirm] = useState(false);
  const itemLogData = logData && logData[id] ? logData[id] : {};
  const handleLogChange = (id, newValues) => {
    onLogDataChange(id, newValues);
  };
  let lastSetPlaceholder = null;
  if (Array.isArray(userWorkoutHistory)) {
    const lastLog = userWorkoutHistory.find(log => log.exerciseId === id && Array.isArray(log.sets) && log.sets.length > 0);
    if (lastLog) {
      const lastSet = lastLog.sets[lastLog.sets.length - 1];
      if (lastSet) {
        lastSetPlaceholder = { weight: lastSet.weight, reps: lastSet.reps };
      }
    }
  }
  const InfoDialog = ({ item }) => (
    <Dialog>
      <DialogContent className="w-auto max-w-sm p-0">
        <ExerciseTooltipContent exercise={item} />
      </DialogContent>
    </Dialog>
  );
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{name}</span>
              <InfoDialog item={item} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowConfirm(true)} className="text-red-600">
                  Remove Exercise
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          <div className="mb-4">Are you sure you want to remove this exercise and all its sets from your cart?</div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setShowConfirm(false); removeFromCart(item.id); }}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 