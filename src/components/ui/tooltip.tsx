import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> & {
    mobileTouchDelay?: number;
  }
>(({ className, mobileTouchDelay = 500, children, ...props }, ref) => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTouchHolding, setIsTouchHolding] = React.useState(false);
  const touchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    touchTimeoutRef.current = setTimeout(() => {
      setIsTouchHolding(true);
    }, mobileTouchDelay);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    
    // Delay hiding to allow for tooltip interaction
    setTimeout(() => {
      setIsTouchHolding(false);
    }, 100);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setIsTouchHolding(false);
  };

  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      className={cn(className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      data-touch-holding={isTouchHolding}
      {...props}
    >
      {children}
    </TooltipPrimitive.Trigger>
  );
});
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
