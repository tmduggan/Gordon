import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import parse, { domToReact } from 'html-react-parser';

const MuscleMap = ({ view, muscleScores, rawMuscleScores, allMuscleIds }) => {
  const [svgContent, setSvgContent] = useState(null);

  const getColorForScore = (score) => {
    if (!score || score === 0) return '#000000'; // Black for untrained
    const red = 100 + Math.floor(score * 155);
    return `rgb(${red}, 0, 0)`;
  };

  useEffect(() => {
    fetch('/Muscles-simplified.svg')
      .then(res => res.text())
      .then(text => {
        // Clean the SVG to prevent the 'd' attribute parsing error.
        // This removes newlines and collapses whitespace within the 'd' attribute string.
        const cleanedText = text.replace(/d="[^"]+"/g, (match) => {
          return match.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');
        });

        const options = {
          replace: (domNode) => {
            if (domNode.attribs && allMuscleIds.includes(domNode.attribs.id)) {
              const muscleId = domNode.attribs.id;
              const score = muscleScores[muscleId] || 0;
              const rawScore = rawMuscleScores[muscleId] || 0;
              const color = getColorForScore(score);

              // Override style for all path children
              if (domNode.children) {
                  domNode.children.forEach(child => {
                      if (child.name === 'path' && child.attribs) {
                          child.attribs.style = `fill: ${color}; transition: fill 0.3s ease;`;
                      }
                  })
              }

              if (rawScore > 0) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <g {...domNode.attribs}>{domToReact(domNode.children, options)}</g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="capitalize">{muscleId.replace(/_/g, ' ')}: {rawScore.toLocaleString()} Volume</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
            }
            // Hide front/back views based on state
            if (domNode.attribs && (domNode.attribs.id === 'front' || domNode.attribs.id === 'front_borders')) {
                domNode.attribs.style = `display: ${view === 'front' ? 'inline' : 'none'};`;
            }
            if (domNode.attribs && (domNode.attribs.id === 'rear' || domNode.attribs.id === 'rear_borders')) {
                domNode.attribs.style = `display: ${view === 'back' ? 'inline' : 'none'};`;
            }

            return domNode;
          },
        };
        setSvgContent(parse(cleanedText, options));
      });
  }, [view, muscleScores, rawMuscleScores, allMuscleIds]);

  if (!svgContent) {
    return <p>Loading Muscle Map...</p>;
  }

  return (
    <TooltipProvider>
      <div style={{ width: '100%', height: '100%' }}>
        {svgContent}
      </div>
    </TooltipProvider>
  );
};

export default MuscleMap; 