import React from 'react';

const ViewToggler = ({ currentView, onSwitchView }) => {
  const activeClasses = 'bg-blue-600 text-white';
  const inactiveClasses = 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <div className="flex justify-center mb-6">
      <div className="flex rounded-lg shadow-sm">
        <button
          onClick={() => onSwitchView('nutrition')}
          className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors duration-200 ${currentView === 'nutrition' ? activeClasses : inactiveClasses}`}
        >
          Nutrition
        </button>
        <button
          onClick={() => onSwitchView('exercise')}
          className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors duration-200 ${currentView === 'exercise' ? activeClasses : inactiveClasses}`}
        >
          Exercise
        </button>
      </div>
    </div>
  );
};

export default ViewToggler; 