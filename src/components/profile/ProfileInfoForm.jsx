import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import timeZones from '../../utils/timeZones'; // Assume you have a list of time zones

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Lightly Active (light exercise 1-3 days/week)' },
  { value: 'moderate', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
  { value: 'very', label: 'Very Active (hard exercise 6-7 days/week)' },
  { value: 'athlete', label: 'Athlete (very hard exercise, physical job)' },
];

export default function ProfileInfoForm({ userProfile, user, onSave, onCancel, showActivityLevel }) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      name: userProfile?.name || user?.displayName || '',
      timeZone: userProfile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      activityLevel: userProfile?.activityLevel || 'moderate',
    }
  });

  const onSubmit = (data) => {
    onSave({ ...userProfile, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <Input
          id="name"
          {...register("name", { 
            required: "Name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" }
          })}
          placeholder="Enter your name"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="timeZone" className="text-sm font-medium">Time Zone</label>
        <select
          id="timeZone"
          {...register("timeZone", { required: "Time zone is required" })}
          className="border rounded px-2 py-1 w-full"
        >
          {timeZones.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        {errors.timeZone && (
          <p className="text-sm text-red-600">{errors.timeZone.message}</p>
        )}
      </div>

      {showActivityLevel && (
        <div className="space-y-2">
          <label htmlFor="activityLevel" className="text-sm font-medium">Activity Level</label>
          <select
            id="activityLevel"
            {...register("activityLevel", { required: "Activity level is required" })}
            className="border rounded px-2 py-1 w-full"
          >
            {activityLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
          {errors.activityLevel && (
            <p className="text-sm text-red-600">{errors.activityLevel.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isDirty}>
          Save Changes
        </Button>
      </div>
    </form>
  );
} 