import React from 'react';

export default function SearchBar({
  query,
  setQuery,
  onSearch,
  isLoading,
  placeholder,
  label
}) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex flex-col gap-1 relative">
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder={placeholder}
            value={query || ''}
            onChange={e => setQuery(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading && query) {
                onSearch();
              }
            }}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 disabled:bg-gray-400"
            disabled={isLoading || !query}
            onClick={onSearch}
            type="button"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </div>
  );
} 