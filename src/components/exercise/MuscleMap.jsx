import React, { useState } from 'react';
import MuscleSvg from './MuscleSvg';

const MuscleMap = ({ muscleScores, rawMuscleScores, onMuscleClick }) => {
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <div className="relative w-full h-full">
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
          className="absolute px-2 py-1 bg-black text-white text-xs rounded"
          style={{ 
            top: mousePos.y, 
            left: mousePos.x,
            // Add a small offset to prevent the tooltip from flickering
            transform: 'translate(10px, -30px)', 
            pointerEvents: 'none' // Make sure tooltip doesn't block mouse events
          }}
        >
          <div className="capitalize">{hovered.replace(/_/g, ' ')}</div>
          {rawMuscleScores && rawMuscleScores[hovered] && (
            <div>Score: {Math.round(rawMuscleScores[hovered])}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MuscleMap; 