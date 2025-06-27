import React, { useState, useRef } from 'react';
import MuscleSvg from './MuscleSvg';
import { muscleMapping } from '../../../utils/muscleMapping';

const MuscleMap = ({ muscleScores, rawMuscleScores, onMuscleClick }) => {
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const getContributingMuscles = (svgMuscle) => {
    const libraryMuscles = muscleMapping[svgMuscle] || [];
    return libraryMuscles;
  };

  // Calculate tooltip position with offset and keep within bounds
  const getTooltipStyle = () => {
    const offsetX = 12;
    const offsetY = 12;
    let left = mousePos.x + offsetX;
    let top = mousePos.y - offsetY;
    // Optionally, keep tooltip within chart bounds
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const tooltipWidth = 200; // estimate
      const tooltipHeight = 80; // estimate
      if (left + tooltipWidth > rect.right) left = rect.right - tooltipWidth;
      if (top + tooltipHeight > rect.bottom) top = rect.bottom - tooltipHeight;
      if (left < rect.left) left = rect.left;
      if (top < rect.top) top = rect.top;
    }
    return {
      top,
      left,
      pointerEvents: 'none',
      zIndex: 1000,
      position: 'fixed',
    };
  };

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      <MuscleSvg
        muscleScores={muscleScores}
        onHover={(id, e) => {
          setHovered(id);
          setMousePos({ x: e.clientX, y: e.clientY });
        }}
        onLeave={() => setHovered(null)}
        onClick={(id) => onMuscleClick?.(id)}
      />

      {hovered && (
        <div
          className="px-3 py-2 bg-black text-white text-xs rounded shadow-lg max-w-xs"
          style={getTooltipStyle()}
        >
          <div className="font-semibold capitalize mb-1">
            {hovered.replace(/_/g, ' ')}
          </div>
          {rawMuscleScores && rawMuscleScores[hovered] && (
            <div className="mb-1">
              Score: {Math.round(rawMuscleScores[hovered])}
            </div>
          )}
          <div className="text-xs text-gray-300">
            {getContributingMuscles(hovered).length > 0 && (
              <div>
                Includes: {getContributingMuscles(hovered).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MuscleMap; 