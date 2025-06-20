import React from 'react';

/**
 * Renders a generic grid of pinned items for quick adding.
 * It is made reusable by accepting a `renderItem` prop, which defines
 * how to display the content of each pinned item.
 */
export default function PinnedQuickAdd({
  items,
  onItemClick,
  onPinToggle,
  onAddClick,
  renderItem,
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {items && items.map(item => (
          <div key={item.id} className="relative">
            <button
              onClick={() => onItemClick(item)}
              className="bg-gray-100 border hover:bg-blue-100 rounded p-2 text-sm flex flex-col w-full text-left"
              style={{ minHeight: '60px' }}
            >
              {renderItem(item)}
            </button>
            <button
              className="absolute top-1 right-1 text-yellow-500 hover:text-yellow-700 text-lg font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                onPinToggle(item.id);
              }}
              title="Unpin item"
              style={{ lineHeight: 1 }}
            >
              📌
            </button>
          </div>
        ))}
        <div className="relative">
          <button
            className="bg-green-500 hover:bg-green-600 text-white rounded p-2 flex flex-col items-center justify-center w-full h-full min-h-[60px] border-2 border-green-700 text-3xl"
            onClick={onAddClick}
            title="Add New"
          >
            <span>+</span>
          </button>
        </div>
      </div>
    </div>
  );
} 