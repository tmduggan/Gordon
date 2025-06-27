import React from 'react';
import { Button } from '@/components/ui/button';

const bodyweightOptions = [
  'body weight',
  'band',
  'medicine ball',
  'roller',
  'wheel roller',
  'stability ball',
];
const gymOptions = [
  'dumbbell',
  'barbell',
  'cable',
  'leverage machine',
  'sled machine',
  'ez barbell',
  'weighted (e.g. weight vest, ankle weights)',
  'band',
  'medicine ball',
  'roller',
  'wheel roller',
  'stability ball',
];
const cardioOptions = [
  'stationary bike',
  'upper body ergometer',
  'elliptical machine',
  'skierg machine',
];

export default function EquipmentModal({ equipmentCategory, setEquipmentCategory, selectedBodyweight, setSelectedBodyweight, selectedGym, setSelectedGym, selectedCardio, setSelectedCardio, gymInvalid, cardioInvalid, onSave, onCancel }) {
  const handleBodyweightCheckboxChange = (option) => {
    if (selectedBodyweight.includes(option)) {
      setSelectedBodyweight(selectedBodyweight.filter(e => e !== option));
    } else {
      setSelectedBodyweight([...selectedBodyweight, option]);
    }
  };
  const handleGymCheckboxChange = (option) => {
    if (selectedGym.includes(option)) {
      setSelectedGym(selectedGym.filter(e => e !== option));
    } else {
      setSelectedGym([...selectedGym, option]);
    }
  };
  const handleCardioCheckboxChange = (option) => {
    if (selectedCardio.includes(option)) {
      setSelectedCardio(selectedCardio.filter(e => e !== option));
    } else {
      setSelectedCardio([...selectedCardio, option]);
    }
  };
  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-2">Available Equipment</h3>
      <div className="mb-2">
        <div className="w-full flex gap-2 mb-4">
          <Button variant={equipmentCategory === 'bodyweight' ? 'default' : 'outline'} onClick={() => setEquipmentCategory('bodyweight')}>Body Weight</Button>
          <Button variant={equipmentCategory === 'gym' ? 'default' : 'outline'} onClick={() => setEquipmentCategory('gym')}>Gym Equipment</Button>
          <Button variant={equipmentCategory === 'cardio' ? 'default' : 'outline'} onClick={() => setEquipmentCategory('cardio')}>Cardio</Button>
        </div>
      </div>
      {equipmentCategory === 'bodyweight' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          <button
            key="body weight"
            type="button"
            className="px-3 py-2 rounded border text-sm font-medium transition-colors bg-blue-600 text-white border-blue-600 shadow cursor-not-allowed opacity-70"
            disabled
          >
            body weight
          </button>
          {bodyweightOptions.filter(opt => opt !== 'body weight').map(option => (
            <button
              key={option}
              type="button"
              onClick={() => handleBodyweightCheckboxChange(option)}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors
                ${selectedBodyweight.includes(option) ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50'}
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {equipmentCategory === 'gym' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {gymOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => handleGymCheckboxChange(option)}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors
                ${selectedGym.includes(option) ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50'}
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2`}
            >
              {option}
            </button>
          ))}
          {gymInvalid && (
            <div className="col-span-full text-red-600 text-sm mt-2">Must select at least one equipment option</div>
          )}
        </div>
      )}
      {equipmentCategory === 'cardio' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {cardioOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => handleCardioCheckboxChange(option)}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors
                ${selectedCardio.includes(option) ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50'}
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2`}
            >
              {option}
            </button>
          ))}
          {cardioInvalid && (
            <div className="col-span-full text-red-600 text-sm mt-2">Must select at least one equipment option</div>
          )}
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={gymInvalid || cardioInvalid}>Save Equipment</Button>
      </div>
    </div>
  );
} 