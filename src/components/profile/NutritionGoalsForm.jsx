import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React from 'react';
import { useForm } from 'react-hook-form';

const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 60,
  fiber: 25,
};

export default function NutritionGoalsForm({ userProfile, onSave, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: userProfile?.goals || DEFAULT_GOALS,
  });

  const onSubmit = (data) => {
    onSave({ ...userProfile, goals: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="calories" className="text-sm font-medium">
            Calories
          </label>
          <Input
            id="calories"
            type="number"
            {...register('calories', {
              required: 'Calories are required',
              min: { value: 1000, message: 'Minimum 1000 calories' },
              max: { value: 10000, message: 'Maximum 10000 calories' },
            })}
          />
          {errors.calories && (
            <p className="text-sm text-red-600">{errors.calories.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="protein" className="text-sm font-medium">
            Protein (g)
          </label>
          <Input
            id="protein"
            type="number"
            {...register('protein', {
              required: 'Protein is required',
              min: { value: 0, message: 'Protein cannot be negative' },
            })}
          />
          {errors.protein && (
            <p className="text-sm text-red-600">{errors.protein.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="carbs" className="text-sm font-medium">
            Carbs (g)
          </label>
          <Input
            id="carbs"
            type="number"
            {...register('carbs', {
              required: 'Carbs are required',
              min: { value: 0, message: 'Carbs cannot be negative' },
            })}
          />
          {errors.carbs && (
            <p className="text-sm text-red-600">{errors.carbs.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="fat" className="text-sm font-medium">
            Fat (g)
          </label>
          <Input
            id="fat"
            type="number"
            {...register('fat', {
              required: 'Fat is required',
              min: { value: 0, message: 'Fat cannot be negative' },
            })}
          />
          {errors.fat && (
            <p className="text-sm text-red-600">{errors.fat.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isDirty}>
          Save Goals
        </Button>
      </div>
    </form>
  );
}
