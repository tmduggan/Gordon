import React from 'react';

interface ExtraScores {
  svg3DayScores?: Record<string, number>;
  svg7DayScores?: Record<string, number>;
}

interface MuscleTooltipProps {
  hovered: string | null;
  mousePos: { x: number; y: number };
  rawMuscleScores: Record<string, number>;
  extraScores: ExtraScores;
  getContributingMuscles: (muscle: string) => string[];
  getTooltipStyle: () => React.CSSProperties;
}

const MuscleTooltip: React.FC<MuscleTooltipProps> = ({
  hovered,
  mousePos,
  rawMuscleScores,
  extraScores,
  getContributingMuscles,
  getTooltipStyle,
}) => {
  if (!hovered) return null;
  
  // Calculate total training percentage
  const score =
    rawMuscleScores && rawMuscleScores[hovered] !== undefined
      ? rawMuscleScores[hovered]
      : 0;
  const scorePct = Math.round((score || 0) * 100);

  // Get rep counts
  const todayReps =
    extraScores &&
    extraScores.svg3DayScores &&
    extraScores.svg3DayScores[hovered] !== undefined
      ? Math.round(rawMuscleScores[hovered] * 60)
      : 0;
  const threeDayReps =
    extraScores &&
    extraScores.svg3DayScores &&
    extraScores.svg3DayScores[hovered] !== undefined
      ? Math.round(extraScores.svg3DayScores[hovered])
      : 0;
  const sevenDayReps =
    extraScores &&
    extraScores.svg7DayScores &&
    extraScores.svg7DayScores[hovered] !== undefined
      ? Math.round(extraScores.svg7DayScores[hovered])
      : 0;

  // Calculate percent effect for each
  const todayPct = Math.round((Math.min(todayReps, 60) / 60) * 100);
  const threeDayPct = Math.round((Math.min(threeDayReps, 120) / 120) * 50);
  const sevenDayPct = Math.round((Math.min(sevenDayReps, 500) / 500) * 10);

  return (
    <div
      className="px-3 py-2 bg-black text-white text-xs rounded shadow-lg max-w-xs"
      style={getTooltipStyle()}
    >
      <div className="font-semibold capitalize mb-1">
        {hovered.replace(/_/g, ' ')}:{' '}
        <span className="text-yellow-300">{scorePct}% Trained</span>
      </div>
      <div>
        Today: {todayReps} ({todayPct}%)
      </div>
      <div>
        3-Day: {threeDayReps} ({threeDayPct}%)
      </div>
      <div>
        7-Day: {sevenDayReps} ({sevenDayPct}%)
      </div>
      <div className="text-xs text-gray-300 mt-1">
        {getContributingMuscles(hovered).length > 0 && (
          <div>Includes: {getContributingMuscles(hovered).join(', ')}</div>
        )}
      </div>
    </div>
  );
};

export default MuscleTooltip; 