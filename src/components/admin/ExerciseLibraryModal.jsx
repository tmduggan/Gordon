import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  Filter, 
  Edit, 
  RotateCcw, 
  Save, 
  X, 
  Info,
  Target,
  Dumbbell,
  User,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import useLibrary from '../../hooks/fetchLibrary';
import useAuthStore from '../../store/useAuthStore';
import { 
  autoAssignSvgMappings, 
  getAvailableSvgGroups, 
  getAutoAssignedSvgGroups,
  getSvgGroupDisplayName,
  validateSvgMapping 
} from '../../services/svgMappingService';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';

// Equipment icon mapping (same as other components)
const equipmentIconMap = {
  'smith machine': '/icons/smith.png',
  'dumbbell': '/icons/dumbbell.png',
  'barbell': '/icons/barbell.png',
  'kettlebell': '/icons/kettlebell.png',
  'sled machine': '/icons/sled machine.jpg',
  'body weight': '/icons/bodyweight.png',
  'machine': '/icons/machine.png',
};

const getEquipmentIcon = (equipmentName) => {
  if (!equipmentName) return null;
  const lowerCaseEquipment = equipmentName.toLowerCase();
  
  if (lowerCaseEquipment.includes('dumbbell')) return equipmentIconMap['dumbbell'];
  if (lowerCaseEquipment.includes('barbell')) return equipmentIconMap['barbell'];
  if (lowerCaseEquipment.includes('kettlebell')) return equipmentIconMap['kettlebell'];
  if (lowerCaseEquipment === 'smith machine') return equipmentIconMap['smith machine'];
  if (lowerCaseEquipment === 'sled machine') return equipmentIconMap['sled machine'];
  if (lowerCaseEquipment === 'body weight') return equipmentIconMap['body weight'];
  if (lowerCaseEquipment === 'leverage machine' || lowerCaseEquipment === 'cable') {
    return equipmentIconMap['machine'];
  }
  return null;
};

// Muscle icon mapping (same as other components)
const muscleIconMap = {
  'quads': '/icons/Muscle-Quads.jpeg',
  'abductors': '/icons/Muscle-Abductors.jpeg',
  'abs': '/icons/Muscle-Abs.jpeg',
  'adductors': '/icons/Muscle-Adductors.jpeg',
  'biceps': '/icons/Muscle-Biceps.jpeg',
  'calves': '/icons/Muscle-Calves.jpeg',
  'delts': '/icons/Muscle-Deltoids.jpeg',
  'forearms': '/icons/Muscle-Forearms.jpeg',
  'hamstrings': '/icons/Muscle-Hamstrings.jpeg',
  'pectorals': '/icons/Muscle-Pectorals.jpeg',
  'serratus anterior': '/icons/Muscle-serratus anterior.jpeg',
  'traps': '/icons/Muscle-Traps.jpeg',
  'triceps': '/icons/Muscle-Triceps.jpeg',
  'glutes': '/icons/Muscle-glutes.jpeg',
};

const getMuscleIcon = (muscleName) => {
  if (!muscleName) return null;
  const lowerCaseMuscle = muscleName.toLowerCase();
  return muscleIconMap[lowerCaseMuscle] || null;
};

export default function ExerciseLibraryModal({ open, onOpenChange }) {
  const { toast } = useToast();
  const exerciseLibrary = useLibrary('exercise');
  const { userProfile, saveUserProfile } = useAuthStore();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    targetMuscle: 'all',
    secondaryMuscles: 'all',
    equipment: 'all',
    bodyPart: 'all',
    category: 'all'
  });
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingSvgMapping, setEditingSvgMapping] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get hidden exercises from admin profile
  const hiddenExercises = userProfile?.adminHiddenExercises || [];

  // Get filter options from exercise library
  const filterOptions = useMemo(() => {
    if (!exerciseLibrary.items) return {};
    
    const options = {
      targetMuscles: [],
      secondaryMuscles: [],
      equipments: [],
      bodyParts: [],
      categories: []
    };

    exerciseLibrary.items.forEach(exercise => {
      if (exercise.target) options.targetMuscles.push(exercise.target);
      if (exercise.secondaryMuscles) {
        const secondary = Array.isArray(exercise.secondaryMuscles) 
          ? exercise.secondaryMuscles 
          : [exercise.secondaryMuscles];
        secondary.forEach(muscle => {
          if (muscle) options.secondaryMuscles.push(muscle);
        });
      }
      if (exercise.equipment) options.equipments.push(exercise.equipment);
      if (exercise.bodyPart) options.bodyParts.push(exercise.bodyPart);
      if (exercise.category) options.categories.push(exercise.category);
    });

    // Remove duplicates and sort
    Object.keys(options).forEach(key => {
      options[key] = [...new Set(options[key])].sort();
    });

    return options;
  }, [exerciseLibrary.items]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    if (!exerciseLibrary.items) return [];
    
    let filtered = exerciseLibrary.items;

    // Filter out hidden exercises unless showHidden is true
    if (!showHidden) {
      filtered = filtered.filter(exercise => !hiddenExercises.includes(exercise.id));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.target?.toLowerCase().includes(query) ||
        exercise.bodyPart?.toLowerCase().includes(query) ||
        exercise.equipment?.toLowerCase().includes(query) ||
        exercise.category?.toLowerCase().includes(query)
      );
    }

    // Apply other filters
    if (filters.targetMuscle !== 'all') {
      filtered = filtered.filter(exercise => exercise.target === filters.targetMuscle);
    }
    if (filters.equipment !== 'all') {
      filtered = filtered.filter(exercise => exercise.equipment === filters.equipment);
    }
    if (filters.bodyPart !== 'all') {
      filtered = filtered.filter(exercise => exercise.bodyPart === filters.bodyPart);
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === filters.category);
    }
    if (filters.secondaryMuscles !== 'all') {
      filtered = filtered.filter(exercise => {
        if (!exercise.secondaryMuscles) return false;
        const secondary = Array.isArray(exercise.secondaryMuscles) 
          ? exercise.secondaryMuscles 
          : [exercise.secondaryMuscles];
        return secondary.includes(filters.secondaryMuscles);
      });
    }

    return filtered;
  }, [exerciseLibrary.items, searchQuery, filters, showHidden, hiddenExercises]);

  // Handle edit start
  const handleEditStart = (exercise) => {
    setEditingExercise(exercise);
    setEditingSvgMapping(exercise.svgMapping || []);
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingExercise(null);
    setEditingSvgMapping([]);
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingExercise) return;

    const validation = validateSvgMapping(editingSvgMapping);
    if (!validation.isValid) {
      toast({
        title: "Invalid SVG Mapping",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const exerciseRef = doc(db, 'exerciseLibrary', editingExercise.id);
      await updateDoc(exerciseRef, {
        svgMapping: editingSvgMapping.length > 0 ? editingSvgMapping : null
      });

      // Update local state
      const updatedExercise = { ...editingExercise, svgMapping: editingSvgMapping.length > 0 ? editingSvgMapping : null };
      exerciseLibrary.items = exerciseLibrary.items.map(ex => 
        ex.id === editingExercise.id ? updatedExercise : ex
      );

      toast({
        title: "SVG Mapping Updated",
        description: `Updated mapping for "${editingExercise.name}"`,
      });

      setEditingExercise(null);
      setEditingSvgMapping([]);
    } catch (error) {
      console.error('Error updating SVG mapping:', error);
      toast({
        title: "Error",
        description: "Failed to update SVG mapping",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle auto-assign
  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      const exercisesToUpdate = exerciseLibrary.items.filter(ex => 
        ex.svgMapping === null || ex.svgMapping === undefined
      );
      
      if (exercisesToUpdate.length === 0) {
        toast({
          title: "No Updates Needed",
          description: "All exercises already have SVG mappings assigned",
        });
        return;
      }

      const batch = writeBatch(db);
      const updatedExercises = autoAssignSvgMappings(exercisesToUpdate);
      
      updatedExercises.forEach(exercise => {
        if (exercise.svgMapping !== null) {
          const exerciseRef = doc(db, 'exerciseLibrary', exercise.id);
          batch.update(exerciseRef, { svgMapping: exercise.svgMapping });
        }
      });

      await batch.commit();

      // Update local state
      exerciseLibrary.items = exerciseLibrary.items.map(ex => {
        const updated = updatedExercises.find(u => u.id === ex.id);
        return updated || ex;
      });

      toast({
        title: "Auto-Assignment Complete",
        description: `Updated ${updatedExercises.filter(ex => ex.svgMapping !== null).length} exercises`,
      });
    } catch (error) {
      console.error('Error auto-assigning SVG mappings:', error);
      toast({
        title: "Error",
        description: "Failed to auto-assign SVG mappings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle hide/show exercise
  const handleToggleHidden = async (exerciseId) => {
    try {
      const newHiddenExercises = hiddenExercises.includes(exerciseId)
        ? hiddenExercises.filter(id => id !== exerciseId)
        : [...hiddenExercises, exerciseId];

      await saveUserProfile({
        ...userProfile,
        adminHiddenExercises: newHiddenExercises
      });

      toast({
        title: hiddenExercises.includes(exerciseId) ? "Exercise Shown" : "Exercise Hidden",
        description: `Exercise ${hiddenExercises.includes(exerciseId) ? 'shown' : 'hidden'} from admin view`,
      });
    } catch (error) {
      console.error('Error toggling exercise visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update exercise visibility",
        variant: "destructive"
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      targetMuscle: 'all',
      secondaryMuscles: 'all',
      equipment: 'all',
      bodyPart: 'all',
      category: 'all'
    });
    setSearchQuery('');
  };

  // Get SVG mapping display
  const getSvgMappingDisplay = (exercise) => {
    if (exercise.svgMapping && exercise.svgMapping.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {exercise.svgMapping.map(group => (
            <Badge key={group} variant="secondary" className="text-xs">
              {getSvgGroupDisplayName(group)}
            </Badge>
          ))}
        </div>
      );
    }
    
    const autoGroups = getAutoAssignedSvgGroups(exercise);
    if (autoGroups.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {autoGroups.map(group => (
            <Badge key={group} variant="outline" className="text-xs text-gray-500">
              {getSvgGroupDisplayName(group)} (auto)
            </Badge>
          ))}
        </div>
      );
    }
    
    return <span className="text-gray-400 text-xs">None</span>;
  };

  // Exercise tooltip content
  const ExerciseTooltip = ({ exercise }) => (
    <div className="space-y-2 max-w-xs">
      <div className="font-semibold">{exercise.name}</div>
      {exercise.description && (
        <div className="text-sm text-gray-600">{exercise.description}</div>
      )}
      <div className="text-xs space-y-1">
        <div><strong>Target:</strong> {exercise.target || 'None'}</div>
        {exercise.secondaryMuscles && (
          <div><strong>Secondary:</strong> {Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles.join(', ') : exercise.secondaryMuscles}</div>
        )}
        <div><strong>Equipment:</strong> {exercise.equipment || 'None'}</div>
        <div><strong>Body Part:</strong> {exercise.bodyPart || 'None'}</div>
        <div><strong>Category:</strong> {exercise.category || 'None'}</div>
      </div>
      {exercise.instructions && (
        <div className="text-xs">
          <strong>Instructions:</strong> {exercise.instructions.substring(0, 100)}...
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Exercise Library Management
          </DialogTitle>
          <DialogDescription>
            Manage SVG mappings and visibility for exercises. Hidden exercises are only hidden from this admin view.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {Object.values(filters).some(f => f !== 'all') && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.values(filters).filter(f => f !== 'all').length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHidden(!showHidden)}
                className={`flex items-center gap-2 ${showHidden ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                {showHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showHidden ? 'Show Hidden' : 'Hide Hidden'}
                {hiddenExercises.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {hiddenExercises.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleAutoAssign}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Auto-Assign
              </Button>
            </div>

            {showFilters && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Select value={filters.targetMuscle} onValueChange={(value) => setFilters(prev => ({ ...prev, targetMuscle: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Target Muscle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Target Muscles</SelectItem>
                        {filterOptions.targetMuscles?.map(muscle => (
                          <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filters.equipment} onValueChange={(value) => setFilters(prev => ({ ...prev, equipment: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Equipment</SelectItem>
                        {filterOptions.equipments?.map(equipment => (
                          <SelectItem key={equipment} value={equipment}>{equipment}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filters.bodyPart} onValueChange={(value) => setFilters(prev => ({ ...prev, bodyPart: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Body Part" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Body Parts</SelectItem>
                        {filterOptions.bodyParts?.map(part => (
                          <SelectItem key={part} value={part}>{part}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {filterOptions.categories?.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Showing {filteredExercises.length} of {exerciseLibrary.items?.length || 0} exercises</span>
            <div className="flex gap-4">
              <span>
                {exerciseLibrary.items?.filter(ex => ex.svgMapping !== null && ex.svgMapping !== undefined).length || 0} with manual mappings
              </span>
              <span>
                {hiddenExercises.length} hidden
              </span>
            </div>
          </div>

          {/* Exercise Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <div className="min-w-full">
              {/* Table Header */}
              <div className="bg-gray-50 border-b sticky top-0 z-10">
                <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-gray-700">
                  <div className="col-span-3">Exercise Name</div>
                  <div className="col-span-2">Target Muscle</div>
                  <div className="col-span-2">Equipment</div>
                  <div className="col-span-2">Body Part</div>
                  <div className="col-span-2">SVG Mapping</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y max-h-96 overflow-y-auto">
                {filteredExercises.map((exercise) => (
                  <div key={exercise.id} className="grid grid-cols-12 gap-4 p-3 text-sm hover:bg-gray-50">
                    {/* Exercise Name */}
                    <div className="col-span-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="font-medium cursor-help">
                              {exercise.name}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <ExerciseTooltip exercise={exercise} />
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Target Muscle */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        {getMuscleIcon(exercise.target) && (
                          <img 
                            src={getMuscleIcon(exercise.target)} 
                            alt={exercise.target}
                            className="w-4 h-4 rounded"
                          />
                        )}
                        <span className="capitalize">{exercise.target || 'None'}</span>
                      </div>
                    </div>

                    {/* Equipment */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        {getEquipmentIcon(exercise.equipment) && (
                          <img 
                            src={getEquipmentIcon(exercise.equipment)} 
                            alt={exercise.equipment}
                            className="w-4 h-4 rounded"
                          />
                        )}
                        <span className="capitalize">{exercise.equipment || 'None'}</span>
                      </div>
                    </div>

                    {/* Body Part */}
                    <div className="col-span-2">
                      <span className="capitalize">{exercise.bodyPart || 'None'}</span>
                    </div>

                    {/* SVG Mapping */}
                    <div className="col-span-2">
                      {editingExercise?.id === exercise.id ? (
                        <SvgMappingEditor
                          value={editingSvgMapping}
                          onChange={setEditingSvgMapping}
                        />
                      ) : (
                        getSvgMappingDisplay(exercise)
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      <div className="flex gap-1">
                        {editingExercise?.id === exercise.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleEditSave}
                              disabled={loading}
                              className="h-6 w-6 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleEditCancel}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStart(exercise)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleHidden(exercise.id)}
                              className={`h-6 w-6 p-0 ${hiddenExercises.includes(exercise.id) ? 'text-blue-600' : 'text-gray-600'}`}
                            >
                              {hiddenExercises.includes(exercise.id) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// SVG Mapping Editor Component
function SvgMappingEditor({ value, onChange }) {
  const availableGroups = getAvailableSvgGroups();

  const handleAddGroup = (group) => {
    if (!value.includes(group)) {
      onChange([...value, group]);
    }
  };

  const handleRemoveGroup = (group) => {
    onChange(value.filter(g => g !== group));
  };

  return (
    <div className="space-y-2">
      <Select onValueChange={handleAddGroup}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Add SVG group" />
        </SelectTrigger>
        <SelectContent>
          {availableGroups.map(group => (
            <SelectItem key={group} value={group}>
              {getSvgGroupDisplayName(group)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex flex-wrap gap-1">
        {value.map(group => (
          <Badge key={group} variant="secondary" className="text-xs">
            {getSvgGroupDisplayName(group)}
            <button
              onClick={() => handleRemoveGroup(group)}
              className="ml-1 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
} 