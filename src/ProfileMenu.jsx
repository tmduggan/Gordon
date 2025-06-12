import React from 'react';

export default function ProfileMenu({ onClose, onOpenGoals, onSignOut }) {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100"
        onClick={() => { onOpenGoals(); onClose(); }}
      >
        Daily Goals
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
        onClick={onSignOut}
      >
        Sign Out
      </button>
    </div>
  );
} 