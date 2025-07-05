import React, { useEffect, useRef, useState } from 'react';
import { Progress } from './progress';

interface AnimatedProgressBarProps {
  value: number;
  previousValue: number;
  className?: string;
  onAnimationEnd?: () => void;
  [key: string]: any;
}

interface AnimationStep {
  start: number;
  end: number;
}

/**
 * AnimatedProgressBar animates from previousValue to value, showing the gained portion in green.
 * - Delayed start (300ms)
 * - 1s per full bar (level/tier)
 * - Handles multi-level/tier gains by animating to 100%, resetting, and continuing
 */
export default function AnimatedProgressBar({
  value,
  previousValue,
  className = '',
  onAnimationEnd,
  ...props
}: AnimatedProgressBarProps) {
  const [displayValue, setDisplayValue] = useState<number>(previousValue);
  const [animating, setAnimating] = useState<boolean>(false);
  const [gainStart, setGainStart] = useState<number>(previousValue);
  const [gainEnd, setGainEnd] = useState<number>(value);
  const [step, setStep] = useState<number>(0);
  const animationRef = useRef<number | null>(null);

  // Helper: animate from start to end
  const animateTo = (start: number, end: number, duration: number, cb?: () => void) => {
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (end - start) * progress;
      setDisplayValue(current);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        cb && cb();
      }
    }
    animationRef.current = requestAnimationFrame(animate);
  };

  // Multi-level/tier handling
  useEffect(() => {
    let cancelled = false;
    let levels: AnimationStep[] = [];
    let prev = previousValue;
    let target = value;
    // If gain crosses 100, split into steps
    while (target - prev > 100 - (prev % 100)) {
      levels.push({ start: prev, end: 100 });
      prev = 0;
      target = target - (100 - (prev % 100));
    }
    levels.push({ start: prev, end: target });

    setStep(0);
    setGainStart(levels[0].start);
    setGainEnd(levels[0].end);
    setAnimating(false);
    setTimeout(() => {
      if (cancelled) return;
      setAnimating(true);
      let i = 0;
      function nextStep() {
        if (cancelled) return;
        setGainStart(levels[i].start);
        setGainEnd(levels[i].end);
        animateTo(levels[i].start, levels[i].end, 1000, () => {
          if (levels[i].end === 100 && i < levels.length - 1) {
            setTimeout(() => {
              setDisplayValue(0);
              i++;
              nextStep();
            }, 200);
          } else {
            setAnimating(false);
            onAnimationEnd && onAnimationEnd();
          }
        });
      }
      nextStep();
    }, 300); // 300ms delay before starting
    return () => {
      cancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line
  }, [previousValue, value]);

  // Calculate green overlay width
  const gainWidth = gainEnd > gainStart ? gainEnd - gainStart : 0;

  return (
    <div
      className={`relative w-full ${className}`}
      style={{ height: 'inherit' }}
    >
      {/* Base bar */}
      <Progress value={displayValue} className={className} {...props} />
      {/* Green gain overlay */}
      {animating && gainWidth > 0 && (
        <div
          className="absolute left-0 top-0 h-full bg-status-success/80 pointer-events-none rounded-full"
          style={{
            width: `${gainEnd}%`,
            clipPath: `inset(0 ${100 - gainEnd}% 0 ${gainStart}%)`,
            transition: 'width 0.2s',
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
} 