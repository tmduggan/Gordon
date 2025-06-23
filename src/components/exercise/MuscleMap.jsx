import React, { useState } from 'react';
import MuscleSvg from './MuscleSvg';
import { muscleMapping } from '../../utils/muscleMapping';

const MuscleMap = ({ muscleScores, rawMuscleScores, onMuscleClick }) => {
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getContributingMuscles = (svgMuscle) => {
    const libraryMuscles = muscleMapping[svgMuscle] || [];
    return libraryMuscles;
  };

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
          className="absolute px-3 py-2 bg-black text-white text-xs rounded shadow-lg max-w-xs"
          style={{ 
            top: mousePos.y, 
            left: mousePos.x,
            transform: 'translate(10px, -30px)', 
            pointerEvents: 'none',
            zIndex: 1000
          }}
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