import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfileInfoForm({ userProfile, user, onSave, onCancel }) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      name: userProfile?.name || user?.displayName || '',
      timeZone: userProfile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
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
        <Input
          id="timeZone"
          {...register("timeZone")}
          placeholder="Your time zone"
        />
      </div>

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