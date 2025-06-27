import React from 'react';

/**
 * Shared layout component for pinned items
 * Provides consistent flex structure for both food and exercise items
 */
export const PinnedItemLayout = React.forwardRef(function PinnedItemLayout({ children, ...props }, ref) {
  return (
    <div ref={ref} className="flex flex-col h-full" {...props}>
      {children}
    </div>
  );
}); 