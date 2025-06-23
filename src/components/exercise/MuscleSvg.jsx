import React from 'react';
import { frontMuscles } from './muscleData/frontMuscles';
import { backMuscles } from './muscleData/backMuscles';
import { combinedMuscles } from './muscleData/combinedMuscles';

// Helper to compute color based on score
const getMuscleColor = (score) => {
  if (!score || score === 0) return '#000000'; // black = untrained
  const red = 100 + Math.floor(score * 155); // score from 0 to 1
  return `rgb(${Math.min(red, 255)}, 0, 0)`; // max out at red
};

// Combine all muscle data
const muscleMap = {
  ...frontMuscles,
  ...backMuscles,
  ...combinedMuscles
};

const MuscleSvg = (props) => {
  const { muscleScores = {}, onHover, onLeave, onClick, ...rest } = props;

  return (
    <svg viewBox="0 0 3528.37 3203.47" {...rest}>
      {Object.entries(muscleMap).map(([id, paths]) => (
        <g
          key={id}
          id={id}
          onMouseEnter={e => onHover && onHover(id, e)}
          onMouseLeave={onLeave}
          onClick={() => onClick && onClick(id)}
          style={{ cursor: 'pointer' }}
        >
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={getMuscleColor(muscleScores[id])}
              stroke="#333"
              strokeWidth="2"
            />
          ))}
        </g>
      ))}
    </svg>
  );
};

export default MuscleSvg; 