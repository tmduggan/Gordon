import React from 'react';

export default function ProfileMenu({ onSignOut, onOpenGoals, onSwitchView, currentView }) {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
      <div className="py-1">
        <button
          onClick={() => onSwitchView('nutrition')}
          className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${currentView === 'nutrition' ? 'font-bold' : ''}`}
          disabled={currentView === 'nutrition'}
        >
          Nutrition
        </button>
        <button
          onClick={() => onSwitchView('exercise')}
          className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${currentView === 'exercise' ? 'font-bold' : ''}`}
          disabled={currentView === 'exercise'}
        >
          Exercise
        </button>
        <button
          onClick={() => onSwitchView('exerciseLibrary')}
          className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${currentView === 'exerciseLibrary' ? 'font-bold' : ''}`}
        >
          Exercise Library
        </button>
        <div className="border-t border-gray-200 my-1"></div>
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