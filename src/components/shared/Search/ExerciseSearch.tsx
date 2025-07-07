import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSvgGroupDisplayName } from '@/services/svgMappingService';
import { ChevronDown, ChevronUp, Filter, Lightbulb, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ExerciseDisplay from '../../exercise/ExerciseDisplay';
import ExerciseLibraryAdditionModal from '../../exercise/ExerciseLibraryAdditionModal';
import { SearchRowRight } from './Search';

interface ExerciseItem {
  id?: string;
  name?: string;
  target?: string;
  secondaryMuscles?: string[];
  equipment?: string;
  bodyPart?: string;
  category?: string;
}

interface FilterOptions {
  targets?: string[];
  equipmentCategories?: string[];
}

interface Filters {
  targetCategory: string;
  equipmentCategory: string;
  [key: string]: string;
}

interface SetFilters {
  [key: string]: (value: string) => void;
}

interface LaggingMuscle {
  muscle: string;
  laggingType: string;
  bonus: number;
}

interface ExerciseFilterControlsProps {
  options?: FilterOptions;
  filters: Filters;
  setFilters: SetFilters;
  onFilterChange: (filterType: string, value: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

interface FilterSelectProps {
  placeholder: string;
  value: string;
  options?: string[];
  onValueChange: (value: string) => void;
  onClear: () => void;
}

interface ExerciseSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults?: ExerciseItem[];
  handleSelect: (item: ExerciseItem) => void;
  userProfile?: any;
  togglePin: (id: string) => void;
  placeholder?: string;
  filters: Filters;
  setFilters: SetFilters;
  filterOptions?: FilterOptions;
  laggingMuscles?: LaggingMuscle[];
}

const ExerciseFilterControls = ({
  options = {},
  filters,
  setFilters,
  onFilterChange,
  isExpanded,
  onToggleExpanded,
}: ExerciseFilterControlsProps) => {
  const seen = new Set();
  const uniqueSvgGroups = (options.targets || []).filter((svgGroup) => {
    const displayName = getSvgGroupDisplayName(svgGroup);
    if (seen.has(displayName)) return false;
    seen.add(displayName);
    return true;
  });

  return (
    <div className="my-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleExpanded}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Filter by Muscle Group / Equipment</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isExpanded && (
        <div className="flex flex-col sm:flex-row gap-2 mt-2 p-3 border rounded-md bg-gray-50">
          <Select
            value={filters.targetCategory || 'all'}
            onValueChange={(value) =>
              onFilterChange('targetCategory', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by Muscle Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscle Groups</SelectItem>
              {uniqueSvgGroups.map((svgGroup) => (
                <SelectItem key={svgGroup} value={svgGroup}>
                  {getSvgGroupDisplayName(svgGroup)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FilterSelect
            placeholder="Filter by Equipment Category"
            value={filters.equipmentCategory}
            options={options.equipmentCategories}
            onValueChange={(value) =>
              onFilterChange('equipmentCategory', value)
            }
            onClear={() => onFilterChange('equipmentCategory', '')}
          />
        </div>
      )}
    </div>
  );
};

const FilterSelect = ({
  placeholder,
  value,
  options = [],
  onValueChange,
  onClear,
}: FilterSelectProps) => (
  <div className="flex items-center gap-1 w-full">
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option} className="capitalize">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {value && (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onClear}
        title={`Clear ${placeholder}`}
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
);

export default function ExerciseSearch({
  searchQuery,
  setSearchQuery,
  searchResults = [],
  handleSelect,
  userProfile,
  togglePin,
  placeholder = 'Search exercises...',
  filters,
  setFilters,
  filterOptions,
  laggingMuscles = [],
}: ExerciseSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchQuery]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters[filterType](value);
    if (value) {
      setSearchQuery('');
    }
  };

  const handleToggleFilterExpanded = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const uniqueResults = searchResults
    .slice(0, 40)
    .reduce((acc: ExerciseItem[], item, index) => {
      const key = item.id || `exercise-${index}`;
      if (!acc.find((existing) => existing.id === key)) {
        acc.push(item);
      }
      return acc;
    }, []);

  return (
    <div className="relative">
      <ExerciseLibraryAdditionModal
        open={showAddExerciseModal}
        onOpenChange={setShowAddExerciseModal}
        searchQuery={searchQuery}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div className="flex items-center space-x-2">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAddExerciseModal(true)}
              title="Add Exercise to Library"
              className="ml-1"
            >
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </Button>
          </div>
        </PopoverAnchor>

        <ExerciseFilterControls
          options={filterOptions}
          filters={filters}
          setFilters={setFilters}
          onFilterChange={handleFilterChange}
          isExpanded={isFilterExpanded}
          onToggleExpanded={handleToggleFilterExpanded}
        />

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            style={{
              maxHeight: '400px',
              minHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {searchResults.length === 0 && searchQuery && (
              <div className="p-4 text-sm text-center text-gray-500">
                No results found. Try a different search term.
              </div>
            )}
            {uniqueResults.map((item, index) => {
              let laggingType: string | undefined, bonusXP: number | undefined;
              if (item.target) {
                const match = laggingMuscles.find(
                  (lag) =>
                    lag.muscle && item.target!.toLowerCase().includes(lag.muscle)
                );
                if (match) {
                  laggingType = match.laggingType;
                  bonusXP = match.bonus;
                }
              }
              if (!laggingType && Array.isArray(item.secondaryMuscles)) {
                for (const sec of item.secondaryMuscles) {
                  const match = laggingMuscles.find(
                    (lag) =>
                      lag.muscle && sec.toLowerCase().includes(lag.muscle)
                  );
                  if (match) {
                    laggingType = match.laggingType;
                    bonusXP = match.bonus;
                    break;
                  }
                }
              }
              const isPinned = !!(userProfile?.pinnedExercises?.includes?.(item.id || ''));
              return (
                <div
                  key={item.id || `exercise-${index}`}
                  className={`flex items-center justify-between w-full mb-2 rounded ${isPinned ? 'bg-blue-100' : ''}`}
                  style={{ minHeight: '44px' }}
                >
                  <div className="flex flex-1 min-w-0" style={{ fontSize: '1rem' }} onClick={() => {
                    handleSelect(item);
                    setSearchQuery('');
                    setIsOpen(false);
                  }}>
                    <ExerciseDisplay
                      exercise={{
                        ...item,
                        id: item.id || '',
                        name: item.name || '',
                        target: item.target || '',
                        equipment: item.equipment || '',
                        category: item.category || '',
                        secondaryMuscles: Array.isArray(item.secondaryMuscles) ? item.secondaryMuscles : [],
                      }}
                      variant="row"
                      showPinIcon={false}
                      showCategory={true}
                      showBodyPart={true}
                      showSecondaryMuscles={true}
                      userProfile={userProfile}
                      className="w-full"
                      bonusXP={bonusXP}
                      laggingType={laggingType}
                    />
                  </div>
                  <SearchRowRight
                    isPinned={isPinned}
                    onPin={item.id ? (() => togglePin(item.id!)) : () => {}}
                  />
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 