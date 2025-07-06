import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import NutritionLabel from '@/components/nutrition/NutritionLabel';
import type { FoodItem } from './FoodItemDisplay';

interface FoodItemTooltipProps {
  food: FoodItem;
  children: React.ReactNode; // the trigger (usually name/image)
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

const FoodItemTooltip: React.FC<FoodItemTooltipProps> = ({ food, children }) => {
  const isMobile = useIsMobile();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStartTime, setTouchStartTime] = useState(0);

  // Ensure a portal root exists
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('tooltip-root')) {
      const div = document.createElement('div');
      div.id = 'tooltip-root';
      document.body.appendChild(div);
    }
  }, []);

  // --- Desktop (mouse) handlers ---
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isMobile) return;
    const offset = 12;
    setTooltipPos({ top: e.clientY + offset, left: e.clientX + offset });
    setShowTooltip(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !showTooltip) return;
    const offset = 12;
    setTooltipPos({ top: e.clientY + offset, left: e.clientX + offset });
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setShowTooltip(false);
    setTooltipPos(null);
  };

  // --- Mobile (touch) handlers ---
  const TOUCH_DELAY = 500; // ms until tooltip shows

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchStartTime(Date.now());
    const touch = e.touches[0];
    touchTimeoutRef.current = setTimeout(() => {
      const offset = 12;
      setTooltipPos({ top: touch.clientY + offset, left: touch.clientX + offset });
      setShowTooltip(true);
    }, TOUCH_DELAY);
  };

  const cleanupTouch = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setShowTooltip(false);
    setTooltipPos(null);
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    const duration = Date.now() - touchStartTime;
    if (duration < TOUCH_DELAY) {
      // tap – do nothing
      cleanupTouch();
    } else {
      // allow brief view after long-press
      setTimeout(() => {
        cleanupTouch();
      }, 1200);
    }
  };

  const handleTouchMove = () => {
    if (!isMobile) return;
    cleanupTouch();
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!tooltipPos) return { display: 'none' };
    const style: React.CSSProperties = {
      position: 'fixed',
      top: tooltipPos.top,
      left: tooltipPos.left,
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      padding: 12,
      maxWidth: 320,
      minWidth: 220,
      pointerEvents: 'none',
    };
    return style;
  };

  const tooltipBody = (
    <div className="w-80 max-w-xs text-sm">
      {/* Image */}
      {food.photo?.thumb && (
        <img src={food.photo.thumb} alt={food.food_name || food.label || food.name} className="w-20 h-20 object-cover rounded mb-2 mx-auto" />
      )}
      {/* Name and brand */}
      <div className="font-bold text-base text-center mb-1">{food.food_name || food.label || food.name}</div>
      {food.brand_name && <div className="text-xs text-gray-500 text-center mb-1">{food.brand_name}</div>}
      {/* Serving size */}
      {food.serving_qty && food.serving_unit && (
        <div className="text-xs text-gray-500 text-center mb-1">
          Serving: {food.serving_qty} {food.serving_unit}
        </div>
      )}
      {/* Calories/macros summary */}
      <div className="flex justify-center gap-3 text-xs mb-2">
        {food.calories !== undefined && <span>Cal: <b>{food.calories}</b></span>}
        {food.macros?.protein !== undefined && <span>P: <b>{food.macros.protein}g</b></span>}
        {food.macros?.carbs !== undefined && <span>C: <b>{food.macros.carbs}g</b></span>}
        {food.macros?.fat !== undefined && <span>F: <b>{food.macros.fat}g</b></span>}
      </div>
      {/* Nutrition label */}
      <NutritionLabel food={food} />
    </div>
  );

  // Render portal when tooltip should be visible
  const portal =
    showTooltip && tooltipPos
      ? createPortal(<div style={getTooltipStyle()}>{tooltipBody}</div>, document.getElementById('tooltip-root') as HTMLElement)
      : null;

  return (
    <span
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {children}
      {portal}
    </span>
  );
};

export default FoodItemTooltip; 