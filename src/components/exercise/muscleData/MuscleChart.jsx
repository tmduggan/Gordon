import React, { useMemo, useRef, useState } from 'react';
import useAuthStore from '../../../store/useAuthStore';
import {
  muscleMapping,
  specialMuscleGroups,
} from '../../../utils/muscleMapping';
import { combinedMuscles } from './combinedMuscles';
import MuscleTooltip from './MuscleTooltip';

// Helper to compute color based on score
const getMuscleColor = (score) => {
  if (!score || score === 0) return '#000000'; // black = untrained
  const red = 100 + Math.floor(score * 155); // score from 0 to 1
  return `rgb(${Math.min(red, 255)}, 0, 0)`; // max out at red
};

// Define which muscle groups should be interactive
const INTERACTIVE_MUSCLES = [
  'forearms',
  'adductors',
  'abductors',
  'lower_back',
  'triceps',
  'lats',
  'rear_delts',
  'hands',
  'glutes',
  'hamstrings',
  'calves',
  'rhomboids',
  'upper_traps',
  'lower_traps',
  'neck',
  'quads',
  'biceps',
  'pectorals',
  'abdominals',
  'obliques',
  'deltoids',
  'trapezius',
];

// Define which should be rendered as background/outline (non-interactive)
const BACKGROUND_MUSCLES = ['body_outline'];

export default function MuscleChart({ className = '', onMuscleClick }) {
  const { userProfile } = useAuthStore();
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Calculate muscle scores from user profile
  const { normalizedScores, rawScores, extraScores, specialScores } =
    useMemo(() => {
      const libraryScores = userProfile?.muscleScores || {};

      // Map library muscle scores to SVG muscle scores
      const svgScores = {};
      const svg3DayScores = {};
      const svg7DayScores = {};
      const specialMuscleScores = {};

      // For each SVG muscle group, sum up scores from all mapped library muscles
      Object.entries(muscleMapping).forEach(([svgMuscle, libraryMuscles]) => {
        let todayScore = 0;
        let score3day = 0;
        let score7day = 0;

        libraryMuscles.forEach((libraryMuscle) => {
          const muscleData = libraryScores[libraryMuscle] || {};
          todayScore += muscleData.today || 0;
          score3day += muscleData['3day'] || 0;
          score7day += muscleData['7day'] || 0;
        });
        // New weights: today (1.0), 3day (0.5), 7day (0.1)
        // Cap each component: today max 60 reps, 3day max 120 reps, 7day max 500 reps (but only up to 50% shading)
        const todayPct = Math.min(todayScore, 60) / 60; // 60 reps = 100%
        const threeDayPct = (Math.min(score3day, 120) / 120) * 0.5; // 120 reps = 50%
        const sevenDayPct = (Math.min(score7day, 500) / 500) * 0.1; // 500 reps = 10%
        let weightedScore = todayPct + threeDayPct + sevenDayPct;
        weightedScore = Math.min(weightedScore, 1.0); // Cap at 100%
        svgScores[svgMuscle] = weightedScore;
        svg3DayScores[svgMuscle] = score3day;
        svg7DayScores[svgMuscle] = score7day;
      });

      // Handle special muscle groups (don't map to SVG but track separately)
      Object.entries(specialMuscleGroups).forEach(
        ([specialGroup, libraryMuscles]) => {
          let todayScore = 0;
          let score3day = 0;
          let score7day = 0;

          libraryMuscles.forEach((libraryMuscle) => {
            const muscleData = libraryScores[libraryMuscle] || {};
            todayScore += muscleData.today || 0;
            score3day += muscleData['3day'] || 0;
            score7day += muscleData['7day'] || 0;
          });

          const weightedScore =
            todayScore * 1.0 + score3day * 0.25 + score7day * 0.1;
          specialMuscleScores[specialGroup] = {
            weighted: weightedScore,
            today: todayScore,
            '3day': score3day,
            '7day': score7day,
          };
        }
      );

      // Normalize scores for color display (only SVG muscles)
      const normalized = { ...svgScores };
      const maxScore = Math.max(
        ...Object.values(normalized).filter((v) => typeof v === 'number'),
        1
      );

      if (maxScore > 0) {
        for (const muscle in normalized) {
          normalized[muscle] = (normalized[muscle] || 0) / maxScore;
        }
      }

      return {
        normalizedScores: normalized,
        rawScores: svgScores,
        extraScores: { svg3DayScores, svg7DayScores },
        specialScores: specialMuscleScores,
      };
    }, [userProfile]);

  // Get contributing muscles for tooltip
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

    // Keep tooltip within chart bounds
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

  // Handle muscle hover
  const handleMuscleHover = (id, e) => {
    setHovered(id);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Handle muscle leave
  const handleMuscleLeave = () => {
    setHovered(null);
  };

  // Handle muscle click
  const handleMuscleClick = (id) => {
    onMuscleClick?.(id);
  };

  return (
    <div
      className={`w-full aspect-[5/3] relative ${className}`}
      ref={containerRef}
    >
      {/* SVG Muscle Chart */}
      <svg viewBox="0 0 3528.37 3203.47" width="100%" height="100%">
        {Object.entries(combinedMuscles).map(([id, paths]) => {
          const isInteractive = INTERACTIVE_MUSCLES.includes(id);
          const isBackground = BACKGROUND_MUSCLES.includes(id);

          return (
            <g
              key={id}
              id={id}
              onMouseEnter={
                isInteractive ? (e) => handleMuscleHover(id, e) : undefined
              }
              onMouseLeave={isInteractive ? handleMuscleLeave : undefined}
              onClick={isInteractive ? () => handleMuscleClick(id) : undefined}
              style={{ cursor: isInteractive ? 'pointer' : 'default' }}
            >
              {paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill={
                    isBackground
                      ? '#f0f0f0'
                      : getMuscleColor(normalizedScores[id])
                  }
                  stroke="#333"
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <MuscleTooltip
        hovered={hovered}
        mousePos={mousePos}
        rawMuscleScores={rawScores}
        extraScores={extraScores}
        getContributingMuscles={getContributingMuscles}
        getTooltipStyle={getTooltipStyle}
      />
    </div>
  );
}
