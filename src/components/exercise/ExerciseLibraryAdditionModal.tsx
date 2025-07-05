import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lightbulb, Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import {
  generateExerciseSubmissionId,
  submitExerciseSubmission,
} from '../../services/exercise/exerciseSubmissionService';
import useAuthStore from '../../store/useAuthStore';

export default function ExerciseLibraryAdditionModal({
  open,
  onOpenChange,
  searchQuery = '',
}) {
  const { user, userProfile, addExerciseSubmission, canSubmitExercise } =
    useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: searchQuery,
    target: '',
    bodyPart: '',
    category: '',
    difficulty: '',
    equipment: '',
    secondaryMuscles: [],
    description: '',
    instructions: [],
    source: `user-${user?.uid || 'unknown'}`,
  });

  // Auto-generate ID on mount
  useEffect(() => {
    if (open && !formData.id) {
      generateExerciseSubmissionId().then((id) => {
        setFormData((prev) => ({ ...prev, id }));
      });
    }
  }, [open]);

  // Check user's submission limit
  const submittedCount =
    userProfile?.exerciseSubmissions?.submitted?.length || 0;
  const canSubmit = canSubmitExercise();

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({
        title: 'Submission Limit Reached',
        description: 'You can only submit 3 exercises to the library.',
        variant: 'destructive',
      });
      return;
    }

    // Basic validation
    if (
      !formData.name ||
      !formData.target ||
      !formData.bodyPart ||
      !formData.category ||
      !formData.difficulty ||
      !formData.equipment
    ) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields marked with *',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await submitExerciseSubmission(formData, user.uid);

      // Update user profile
      await addExerciseSubmission(formData.id);

      toast({
        title: 'Exercise Submitted!',
        description: 'Your exercise has been submitted for admin review.',
      });

      // Reset form
      setFormData({
        id: '',
        name: searchQuery,
        target: '',
        bodyPart: '',
        category: '',
        difficulty: '',
        equipment: '',
        secondaryMuscles: [],
        description: '',
        instructions: [],
        source: `user-${user?.uid || 'unknown'}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting exercise:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your exercise.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Add Exercise to Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ID Display */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              ID: {formData.id}
            </Badge>
            <span className="text-sm text-gray-500">
              {submittedCount}/3 submissions used
            </span>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Exercise Name *</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., dumbbell waiter biceps curl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Muscle *</label>
              <Select
                value={formData.target}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, target: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target muscle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="biceps">Biceps</SelectItem>
                  <SelectItem value="triceps">Triceps</SelectItem>
                  <SelectItem value="chest">Chest</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="shoulders">Shoulders</SelectItem>
                  <SelectItem value="abs">Abs</SelectItem>
                  <SelectItem value="quads">Quads</SelectItem>
                  <SelectItem value="hamstrings">Hamstrings</SelectItem>
                  <SelectItem value="calves">Calves</SelectItem>
                  <SelectItem value="glutes">Glutes</SelectItem>
                  <SelectItem value="cardiovascular system">
                    Cardiovascular System
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Body Part *</label>
              <Select
                value={formData.bodyPart}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bodyPart: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select body part" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upper arms">Upper Arms</SelectItem>
                  <SelectItem value="lower arms">Lower Arms</SelectItem>
                  <SelectItem value="chest">Chest</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="shoulders">Shoulders</SelectItem>
                  <SelectItem value="waist">Waist</SelectItem>
                  <SelectItem value="upper legs">Upper Legs</SelectItem>
                  <SelectItem value="lower legs">Lower Legs</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="stretching">Stretching</SelectItem>
                  <SelectItem value="olympic_weightlifting">
                    Olympic Weightlifting
                  </SelectItem>
                  <SelectItem value="strongman">Strongman</SelectItem>
                  <SelectItem value="powerlifting">Powerlifting</SelectItem>
                  <SelectItem value="plyometrics">Plyometrics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty *</label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Equipment *</label>
              <Select
                value={formData.equipment}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, equipment: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="body weight">Body Weight</SelectItem>
                  <SelectItem value="dumbbell">Dumbbell</SelectItem>
                  <SelectItem value="barbell">Barbell</SelectItem>
                  <SelectItem value="kettlebell">Kettlebell</SelectItem>
                  <SelectItem value="machine">Machine</SelectItem>
                  <SelectItem value="cable">Cable</SelectItem>
                  <SelectItem value="smith machine">Smith Machine</SelectItem>
                  <SelectItem value="sled machine">Sled Machine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Secondary Muscles */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Secondary Muscles</label>
            <div className="flex flex-wrap gap-2">
              {formData.secondaryMuscles.map((muscle, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {muscle}
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        secondaryMuscles: prev.secondaryMuscles.filter(
                          (_, i) => i !== index
                        ),
                      }))
                    }
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select
              onValueChange={(value) => {
                if (!formData.secondaryMuscles.includes(value)) {
                  setFormData((prev) => ({
                    ...prev,
                    secondaryMuscles: [...prev.secondaryMuscles, value],
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add secondary muscle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forearms">Forearms</SelectItem>
                <SelectItem value="shoulders">Shoulders</SelectItem>
                <SelectItem value="traps">Traps</SelectItem>
                <SelectItem value="serratus anterior">
                  Serratus Anterior
                </SelectItem>
                <SelectItem value="adductors">Adductors</SelectItem>
                <SelectItem value="abductors">Abductors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe the exercise, its benefits, and target muscles..."
              rows={3}
              className="w-full border rounded p-2 text-sm"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Instructions</label>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={instruction}
                    onChange={(e) => {
                      const newInstructions = [...formData.instructions];
                      newInstructions[index] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        instructions: newInstructions,
                      }));
                    }}
                    placeholder={`Step ${index + 1}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        instructions: prev.instructions.filter(
                          (_, i) => i !== index
                        ),
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    instructions: [...prev.instructions, ''],
                  }))
                }
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Instruction Step
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
              {loading ? 'Submitting...' : 'Submit Exercise'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
