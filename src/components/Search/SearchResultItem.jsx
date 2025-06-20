import React from 'react';

/**
 * A generic container for an item in a search results dropdown.
 * It provides the base styling and handles the select action, while
 * allowing the content and an optional action button to be passed in.
 */
export default function SearchResultItem({
  onSelect,
  children,
  actionButton,
  className = '',
}) {
  return (
    <li
      className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={onSelect}
    >
      <div className="flex-1 mr-2">{children}</div>
      {actionButton && (
        <div
          onClick={(e) => {
            // Prevent the main onSelect from firing when the action button is clicked
            e.stopPropagation();
          }}
        >
          {actionButton}
        </div>
      )}
    </li>
  );
} 