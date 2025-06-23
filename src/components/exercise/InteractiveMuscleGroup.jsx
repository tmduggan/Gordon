import React from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const InteractiveMuscleGroup = ({ id, score = 0, rawScore = 0, children }) => {
  const isTrained = score > 0;
  
  // Use a minimum opacity for trained muscles, but make it more sensitive
  const opacity = isTrained ? Math.max(0.2, score) : 1;
  
  // Define styles for trained and untrained states
  const fill = isTrained ? `rgba(220, 38, 38, ${opacity})` : '#f8f8f8'; // Use a solid off-white for untrained
  const stroke = isTrained ? `rgba(139, 0, 0, ${opacity})` : '#cccccc'; // Lighter gray for untrained outlines
  const strokeWidth = isTrained ? '2' : '1';

  // Assign a unique key to each path to fix the React warning
  const styledChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === 'path') {
      const existingStyle = child.props.style || {};
      const newStyle = {
        ...existingStyle,
        fill,
        stroke,
        strokeWidth,
        transition: 'all 0.2s ease-in-out',
      };
      // Add a unique key here using the muscle ID and the path's index
      return React.cloneElement(child, { key: `${id}-${index}`, style: newStyle });
    }
    return child;
  });

  const displayName = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <g id={id} className="cursor-pointer transition-all duration-300 hover:opacity-80">
            {styledChildren}
          </g>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-800 text-white rounded-md shadow-lg p-2 border-0">
          <p className="font-bold">{displayName}</p>
          {isTrained ? <p>Score: {Math.round(rawScore)}</p> : <p>Not Trained</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InteractiveMuscleGroup; 