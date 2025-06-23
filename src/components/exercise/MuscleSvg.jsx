import React from 'react';
import { combinedMuscles } from './muscleData/combinedMuscles';

// Helper to compute color based on score
const getMuscleColor = (score) => {
  if (!score || score === 0) return '#000000'; // black = untrained
  const red = 100 + Math.floor(score * 155); // score from 0 to 1
  return `rgb(${Math.min(red, 255)}, 0, 0)`; // max out at red
};

// Combine all muscle data
const muscleMap = combinedMuscles;

const MuscleSvg = (props) => {
  const { muscleScores = {}, onHover, onLeave, onClick, ...rest } = props;

  // Define which muscle groups should be interactive
const interactiveMuscles = [
  'forearms', 'adductors', 'abductors', 'lower_back', 'triceps', 
  'lats', 'rear_delts', 'hands', 'glutes', 'hamstrings', 
  'calves', 'rhomboids', 'upper_traps', 'lower_traps', 'neck', 
  'quads', 'biceps', 'pectorals', 'abdominals', 'obliques', 
  'deltoids', 'trapezius'
];

// Define which should be rendered as background/outline (non-interactive)
const backgroundMuscles = ['body_outline'];


  return (
    <svg viewBox="0 0 3528.37 3203.47" {...rest}>
      {Object.entries(muscleMap).map(([id, paths]) => {
        const isInteractive = interactiveMuscles.includes(id);
        const isBackground = backgroundMuscles.includes(id);
        
        return (
          <g
            key={id}
            id={id}
            onMouseEnter={isInteractive ? (e => onHover && onHover(id, e)) : undefined}
            onMouseLeave={isInteractive ? onLeave : undefined}
            onClick={isInteractive ? (() => onClick && onClick(id)) : undefined}
            style={{ cursor: isInteractive ? 'pointer' : 'default' }}
          >
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={isBackground ? '#f0f0f0' : getMuscleColor(muscleScores[id])}
                stroke="#333"
                strokeWidth="2"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export default MuscleSvg;