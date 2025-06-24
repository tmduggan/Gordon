import React from 'react';

/**
 * Shared title component for pinned items
 * Displays the item name with consistent styling
 */
export function PinnedItemTitle({ label }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0 w-full mb-2">
      <strong className="block text-center truncate w-full text-sm">{label}</strong>
    </div>
  );
} 