import React from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const Muscle = ({ id, path, normalizedScore = 0, totalScore = 0 }) => {
  const opacity = Math.max(0.05, normalizedScore); // Ensure even small scores are slightly visible
  const isTrained = normalizedScore > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <path
            d={path}
            fill={isTrained ? `rgba(220, 38, 38, ${opacity})` : 'rgba(200, 200, 200, 0.3)'}
            stroke="#333"
            strokeWidth="2"
            className="transition-all duration-300 hover:fill-sky-500"
            data-muscle-id={id}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">{id}</p>
          {isTrained && <p>Total XP: {Math.round(totalScore)}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const musclePaths = {
    // THIS IS A VERY ABRIDGED VERSION - THE REAL FILE WILL BE MUCH LARGER
    front: {
        pectorals: "M252.5,188.5 C253.5,188.5 292,203 292,203 C292,203 292,230 292,230 C292,230 252.5,229 252.5,229 C252.5,229 252.5,188.5 252.5,188.5z",
        abs: "M252,235 C252,235 292,235 292,235 C292,235 292,289 292,289 C292,289 252,289 252,289 C252,289 252,235 252,235z",
        quads: "M253.5,338 C253.5,338 259,420 259,420 C259,420 286,420 286,420 C286,420 291,338 291,338 C291,338 253.5,338 253.5,338z",
        // ... other front muscles
    },
    back: {
        traps: "M252,175 C252,175 292,175 292,175 C292,175 272,221 272,221 C272,221 252,175 252,175z",
        lats: "M252,229 C252,229 292,229 292,229 C292,229 285,283 285,283 C285,283 259,283 259,283 C259,283 252,229 252,229z",
        glutes: "M253,296 C253,296 291,296 291,296 C291,296 288,332 288,332 C288,332 256,332 256,332 C256,332 253,296 253,296z",
        // ... other back muscles
    }
};


const MuscleMapView = ({ scores, normalizedScores, view }) => {
    const paths = musclePaths[view] || {};
    return (
        <svg viewBox="100 100 350 500" xmlns="http://www.w3.org/2000/svg">
             {/* Base Image could go here if it was an SVG itself */}
            {Object.entries(paths).map(([id, path]) => (
                <Muscle 
                    key={id} 
                    id={id} 
                    path={path}
                    normalizedScore={normalizedScores[id]}
                    totalScore={scores[id]}
                />
            ))}
        </svg>
    );
};

export default MuscleMapView; 