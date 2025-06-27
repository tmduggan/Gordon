import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug, Target } from 'lucide-react';

export default function DebugControls({
  onValidateXP,
  onFixXP,
  onSyncXP,
  onMigrateMuscleScores,
  xpValidation,
  loading,
  userProfile,
  exerciseHistory,
  foodHistory
}) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Bug className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-sm">XP Debug</h3>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Stored XP:</span>
          <span className="font-mono">{userProfile?.totalXP || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Exercise Logs:</span>
          <span className="font-mono">{exerciseHistory?.logs?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Food Logs:</span>
          <span className="font-mono">{foodHistory?.logs?.length || 0}</span>
        </div>
        {xpValidation && (
          <div className="mt-3 p-2 rounded border">
            <div className="flex justify-between mb-1">
              <span>Calculated XP:</span>
              <span className="font-mono">{xpValidation.calculatedXP}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Discrepancy:</span>
              <span className={`font-mono ${xpValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>{xpValidation.discrepancy}</span>
            </div>
            <div className="text-xs text-gray-600">
              {xpValidation.isValid ? '✅ XP is accurate' : '⚠️ XP discrepancy detected'}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={onValidateXP} disabled={loading}>Validate XP</Button>
        <Button variant="destructive" size="sm" onClick={onFixXP} disabled={loading}>Fix XP</Button>
        <Button variant="outline" size="sm" onClick={onSyncXP} disabled={loading}>Sync XP</Button>
      </div>
      <div className="flex items-center gap-2 mt-6 mb-3">
        <Target className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-sm text-blue-800">Muscle Score Migration</h3>
      </div>
      <Button variant="outline" size="sm" onClick={onMigrateMuscleScores} disabled={loading} className="text-blue-700 border-blue-300 hover:bg-blue-100">Update Muscle Scores</Button>
    </div>
  );
} 