import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogTrigger } from './dialog';
import { Info, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
  showInfoButton?: boolean;
  infoButtonPosition?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  className?: string;
  triggerClassName?: string;
}

export function MobileTooltip({
  children,
  content,
  side = 'top',
  delayDuration = 500,
  showInfoButton = true,
  infoButtonPosition = 'top-right',
  className,
  triggerClassName
}: MobileTooltipProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchHolding, setIsTouchHolding] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStartTime, setTouchStartTime] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    setTouchStartTime(Date.now());
    touchTimeoutRef.current = setTimeout(() => {
      setIsTouchHolding(true);
      setShowTooltip(true);
    }, delayDuration);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touchDuration = Date.now() - touchStartTime;
    
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    
    // If it was a short touch, hide the tooltip immediately
    if (touchDuration < delayDuration) {
      setIsTouchHolding(false);
      setShowTooltip(false);
    } else {
      // If it was a long touch, keep tooltip visible for a bit longer
      setTimeout(() => {
        setIsTouchHolding(false);
        setShowTooltip(false);
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
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setShowTooltip(false);
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

  const getTooltipPositionClasses = () => {
    const baseClasses = 'absolute z-50 bg-popover border rounded-md shadow-md p-3 text-sm text-popover-foreground max-w-xs';
    
    switch (side) {
      case 'top':
        return cn(baseClasses, 'bottom-full left-1/2 transform -translate-x-1/2 mb-2');
      case 'bottom':
        return cn(baseClasses, 'top-full left-1/2 transform -translate-x-1/2 mt-2');
      case 'left':
        return cn(baseClasses, 'right-full top-1/2 transform -translate-y-1/2 mr-2');
      case 'right':
        return cn(baseClasses, 'left-full top-1/2 transform -translate-y-1/2 ml-2');
      default:
        return cn(baseClasses, 'bottom-full left-1/2 transform -translate-x-1/2 mb-2');
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main Trigger */}
      <div
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
      </div>

      {/* Touch-and-Hold Tooltip */}
      {showTooltip && isMobile && (
        <div className={getTooltipPositionClasses()}>
          {content}
        </div>
      )}

      {/* Desktop Hover Tooltip */}
      {showTooltip && !isMobile && (
        <div className={getTooltipPositionClasses()}>
          {content}
        </div>
      )}

      {/* Info Button for Mobile */}
      {isMobile && showInfoButton && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6 p-0 text-gray-400 hover:text-blue-500 z-10',
                getInfoButtonPositionClasses()
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            {content}
          </DialogContent>
        </Dialog>
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