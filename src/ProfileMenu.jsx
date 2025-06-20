import React from 'react';

export default function ProfileMenu({ user, onSignOut, onOpenGoals, onSwitchView, currentView }) {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
      <div className="py-1">
        <button
          onClick={onOpenGoals}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Daily Goals
        </button>
        <button
          onClick={onSignOut}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 