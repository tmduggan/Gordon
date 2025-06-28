import React from 'react';

const MuscleTooltip = ({ hovered, mousePos, rawMuscleScores, extraScores, getContributingMuscles, getTooltipStyle }) => {
  if (!hovered) return null;
  return (
    <div
      className="px-3 py-2 bg-black text-white text-xs rounded shadow-lg max-w-xs"
      style={getTooltipStyle()}
    >
      <div className="font-semibold capitalize mb-1">
        {hovered.replace(/_/g, ' ')}
      </div>
      {rawMuscleScores && rawMuscleScores[hovered] !== undefined && (
        <div className="mb-1">
          Today Score: {Math.round(rawMuscleScores[hovered])}
        </div>
      )}
      {extraScores && (
        <>
          {extraScores.svg3DayScores && extraScores.svg3DayScores[hovered] !== undefined && (
            <div>3-Day Score: {Math.round(extraScores.svg3DayScores[hovered])}</div>
          )}
          {extraScores.svg7DayScores && extraScores.svg7DayScores[hovered] !== undefined && (
            <div>7-Day Score: {Math.round(extraScores.svg7DayScores[hovered])}</div>
          )}
        </>
      )}
      <div className="text-xs text-gray-300 mt-1">
        {getContributingMuscles(hovered).length > 0 && (
          <div>
            Includes: {getContributingMuscles(hovered).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default MuscleTooltip; 