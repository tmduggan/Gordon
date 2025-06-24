import React from 'react';
import { Button } from "@/components/ui/button";

/**
 * Shared actions component for pinned items
 * Handles the pin/unpin button functionality
 */
export function PinnedItemActions({ onPinToggle, itemId }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
      onClick={(e) => {
        e.stopPropagation();
        onPinToggle?.(itemId);
      }}
    >
      <span 
        style={{ 
          display: 'inline-block', 
          transform: 'rotate(-90deg)', 
          fontSize: '1rem', 
          lineHeight: 1 
        }} 
        role="img" 
        aria-label="Unpin"
      >
        📌
      </span>
    </Button>
  );
} 