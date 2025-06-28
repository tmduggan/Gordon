import React, { useState, useRef } from 'react';
import MuscleSvg from './MuscleSvg';
import { muscleMapping } from '../../../utils/muscleMapping';
import MuscleTooltip from './MuscleTooltip';

const MuscleMap = ({ muscleScores, rawMuscleScores, extraScores, onMuscleClick }) => {
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

      <MuscleTooltip
        hovered={hovered}
        mousePos={mousePos}
        rawMuscleScores={rawMuscleScores}
        extraScores={extraScores}
        getContributingMuscles={getContributingMuscles}
        getTooltipStyle={getTooltipStyle}
      />
    </div>
  );
};

export default MuscleMap; 