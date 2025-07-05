import { cn } from '@/lib/utils';
import { Info, Smartphone } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ExerciseTooltip from '../exercise/ExerciseTooltip';
import { Button } from './button';

interface MobileTooltipProps {
  children: React.ReactNode;
  content?: React.ReactNode;
  exercise?: any; // Pass the exercise object for exercise tooltips
  bonusXP?: number;
  laggingType?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
  showInfoButton?: boolean;
  infoButtonPosition?:
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-left';
  className?: string;
  triggerClassName?: string;
}

export function MobileTooltip({
  children,
  content,
  exercise,
  bonusXP,
  laggingType,
  side = 'top',
  delayDuration = 500,
  showInfoButton = true,
  infoButtonPosition = 'top-right',
  className,
  triggerClassName,
}: MobileTooltipProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchHolding, setIsTouchHolding] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ensure portal root exists
  useEffect(() => {
    if (!document.getElementById('tooltip-root')) {
      const div = document.createElement('div');
      div.id = 'tooltip-root';
      document.body.appendChild(div);
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchStartTime(Date.now());
    touchTimeoutRef.current = setTimeout(() => {
      setIsTouchHolding(true);
      setShowTooltip(true);
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setTooltipPos({
          top: rect.bottom + window.scrollY + 8, // 8px below
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }
    }, delayDuration);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touchDuration = Date.now() - touchStartTime;
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    if (touchDuration < delayDuration) {
      setIsTouchHolding(false);
      setShowTooltip(false);
      setTooltipPos(null);
    } else {
      setTimeout(() => {
        setIsTouchHolding(false);
        setShowTooltip(false);
        setTooltipPos(null);
      }, 1000);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setIsTouchHolding(false);
    setShowTooltip(false);
    setTooltipPos(null);
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setShowTooltip(false);
  };

  // For info icon tap-to-show, tap-anywhere-to-hide
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
    setShowTooltip(true);
  };

  const getInfoButtonPositionClasses = () => {
    switch (infoButtonPosition) {
      case 'top-right':
        return 'absolute top-1 right-1';
      case 'bottom-right':
        return 'absolute bottom-1 right-1';
      case 'bottom-left':
        return 'absolute bottom-1 left-1';
      case 'top-left':
        return 'absolute top-1 left-1';
      default:
        return 'absolute top-1 right-1';
    }
  };

  const getTooltipPositionStyle = () => {
    if (!tooltipPos) return { display: 'none' };
    return {
      position: 'absolute',
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
    };
  };

  // Use ExerciseTooltip if exercise is provided, else fallback to content
  const tooltipContent = exercise ? (
    <ExerciseTooltip
      exercise={exercise}
      bonusXP={bonusXP}
      laggingType={laggingType}
    />
  ) : (
    content
  );

  // Portalized tooltip for mobile with overlay for tap-away
  const portalTooltip =
    showTooltip && isMobile && tooltipPos
      ? createPortal(
          <>
            {/* Transparent overlay to close tooltip on tap-away */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9998,
                background: 'transparent',
              }}
              onClick={() => {
                setShowTooltip(false);
                setTooltipPos(null);
              }}
            />
            <div style={getTooltipPositionStyle()}>{tooltipContent}</div>
          </>,
          document.getElementById('tooltip-root')!
        )
      : null;

  return (
    <div className={cn('relative', className)}>
      {/* Main Trigger */}
      <div
        ref={triggerRef}
        className={cn('relative', triggerClassName)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-touch-holding={isTouchHolding}
      >
        {children}
        {/* Mobile Indicator (subtle) */}
        {isMobile && (
          <div className="absolute -top-1 -right-1">
            <Smartphone className="h-3 w-3 text-gray-400 opacity-50" />
          </div>
        )}
        {/* Info Button for Mobile: tap to show, tap-away to hide */}
        {isMobile && showInfoButton && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 p-0 text-gray-400 hover:text-blue-500 z-10',
              getInfoButtonPositionClasses()
            )}
            onClick={handleInfoClick}
            type="button"
          >
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Touch-and-Hold Tooltip (portalized for mobile) */}
      {portalTooltip}
      {/* Desktop Hover Tooltip */}
      {showTooltip && !isMobile && (
        <div className="absolute z-50 bg-popover border rounded-md shadow-md p-3 text-sm text-popover-foreground max-w-xs">
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

// Hook for detecting mobile devices
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

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
