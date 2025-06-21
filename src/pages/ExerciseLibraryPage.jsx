import React, { useState, useMemo } from 'react';
import { useExerciseLibrary } from '../hooks/useExerciseLibrary';

export default function ExerciseLibraryPage() {
  const { localExercises, loading } = useExerciseLibrary({ onExerciseAdd: () => {} });

  const [filters, setFilters] = useState({
    difficulty: '',
    bodyPart: '',
    category: '',
    equipment: '',
    target: '',
  });

  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  const filterOptions = useMemo(() => {
    const options = {
      difficulty: new Set(),
      bodyPart: new Set(),
      category: new Set(),
      equipment: new Set(),
      target: new Set(),
    };
    localExercises.forEach(ex => {
      options.difficulty.add(ex.difficulty);
      options.bodyPart.add(ex.bodyPart);
      options.category.add(ex.category);
      options.equipment.add(ex.equipment);
      options.target.add(ex.target);
    });
    return {
      difficulty: [...options.difficulty].sort(),
      bodyPart: [...options.bodyPart].sort(),
      category: [...options.category].sort(),
      equipment: [...options.equipment].sort(),
      target: [...options.target].sort(),
    };
  }, [localExercises]);

  const filteredAndSortedExercises = useMemo(() => {
    let filtered = [...localExercises];

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(ex => ex[key] === value);
      }
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [localExercises, filters, sortConfig]);
  
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div>Loading exercise library...</div>;

  const renderFilterDropdown = (name) => (
    <select name={name} onChange={handleFilterChange} value={filters[name]} className="border rounded p-1 text-sm">
        <option value="">All {name.charAt(0).toUpperCase() + name.slice(1)}</option>
        {filterOptions[name].map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );

  const renderSortableHeader = (key, title) => (
    <th onClick={() => handleSort(key)} className="p-2 text-left cursor-pointer hover:bg-gray-200">
      {title} {sortConfig.key === key ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
    </th>
  );
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Exercise Library ({filteredAndSortedExercises.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 p-2 bg-gray-50 rounded">
        {renderFilterDropdown('difficulty')}
        {renderFilterDropdown('bodyPart')}
        {renderFilterDropdown('category')}
        {renderFilterDropdown('equipment')}
        {renderFilterDropdown('target')}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-white border">
            <thead>
                <tr className="bg-gray-100">
                    {renderSortableHeader('name', 'Name')}
                    {renderSortableHeader('category', 'Category')}
                    {renderSortableHeader('difficulty', 'Difficulty')}
                    {renderSortableHeader('equipment', 'Equipment')}
                    {renderSortableHeader('target', 'Target Muscle')}
                    {renderSortableHeader('bodyPart', 'Body Part')}
                    <th className="p-2 text-left">Secondary Muscles</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {filteredAndSortedExercises.map(ex => (
                    <tr key={ex.id}>
                        <td className="p-2 font-medium">{ex.name}</td>
                        <td className="p-2">{ex.category}</td>
                        <td className="p-2">{ex.difficulty}</td>
                        <td className="p-2">{ex.equipment}</td>
                        <td className="p-2">{ex.target}</td>
                        <td className="p-2">{ex.bodyPart}</td>
                        <td className="p-2 text-xs">{ex.secondaryMuscles?.join(', ')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
} 