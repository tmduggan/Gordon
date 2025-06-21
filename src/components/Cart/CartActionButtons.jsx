import React from 'react';

const CartActionButtons = ({ onLog, onClear, logDisabled = false, clearDisabled = false }) => {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <button
        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg p-3 flex items-center justify-center text-xl shadow"
        disabled={logDisabled}
        onClick={onLog}
        title="Log All"
        aria-label="Log All"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg p-3 flex items-center justify-center text-xl shadow"
        disabled={clearDisabled}
        onClick={onClear}
        title="Clear Cart"
        aria-label="Clear Cart"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default CartActionButtons; 