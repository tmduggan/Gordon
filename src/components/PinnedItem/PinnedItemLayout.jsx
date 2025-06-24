import React from 'react';

/**
 * Shared layout component for pinned items
 * Provides consistent flex structure for both food and exercise items
 */
export function PinnedItemLayout({ children }) {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  );
} 