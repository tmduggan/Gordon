import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import timeZones, { getCurrentTimeInZone } from '../../utils/timeZones';

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
      timeZone: userProfile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      activityLevel: userProfile?.activityLevel || 'moderate',
    }
  });

  // Body Update modal state
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [bodyStats, setBodyStats] = useState({
    heightCm: userProfile?.heightCm || '',
    heightFt: userProfile?.heightFt || '',
    heightIn: userProfile?.heightIn || '',
    weightKg: userProfile?.weightKg || '',
    weightLbs: userProfile?.weightLbs || '',
    age: userProfile?.age || '',
    gender: userProfile?.gender || 'male',
    bodyFat: userProfile?.bodyFat || '',
  });

  const handleBodySave = () => {
    // Convert to metric for storage
    let heightCm = bodyStats.heightCm;
    if (!heightCm && bodyStats.heightFt && bodyStats.heightIn) {
      heightCm = Math.round((parseInt(bodyStats.heightFt) * 12 + parseInt(bodyStats.heightIn)) * 2.54);
    }
    let weightKg = bodyStats.weightKg;
    if (!weightKg && bodyStats.weightLbs) {
      weightKg = Math.round(parseFloat(bodyStats.weightLbs) * 0.453592);
    }
    onSave({
      ...userProfile,
      heightCm,
      weightKg,
      age: bodyStats.age,
      gender: bodyStats.gender,
      bodyFat: bodyStats.bodyFat,
    });
    setShowBodyModal(false);
  };

  const onSubmit = (data) => {
    onSave({ ...userProfile, ...data });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="timeZone" className="text-sm font-medium">Time Zone</label>
          <select
            id="timeZone"
            {...register("timeZone", { required: "Time zone is required" })}
            className="border rounded px-2 py-1 w-full"
          >
            {timeZones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label} {tz.flag} (GMT{tz.gmtOffset})
                {`  ${getCurrentTimeInZone(tz.value)}`}
              </option>
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

      {/* Body Update Button and Modal */}
      <div className="mt-6">
        <Button onClick={() => setShowBodyModal(true)} variant="secondary">
          Body Update
        </Button>
      </div>
      {showBodyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Update Body Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Height (cm)</label>
                <input type="number" value={bodyStats.heightCm} onChange={e => setBodyStats({ ...bodyStats, heightCm: e.target.value })} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium">Height (ft/in)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="ft" value={bodyStats.heightFt} onChange={e => setBodyStats({ ...bodyStats, heightFt: e.target.value })} className="border rounded px-2 py-1 w-16" />
                  <input type="number" placeholder="in" value={bodyStats.heightIn} onChange={e => setBodyStats({ ...bodyStats, heightIn: e.target.value })} className="border rounded px-2 py-1 w-16" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Weight (kg)</label>
                <input type="number" value={bodyStats.weightKg} onChange={e => setBodyStats({ ...bodyStats, weightKg: e.target.value })} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium">Weight (lbs)</label>
                <input type="number" value={bodyStats.weightLbs} onChange={e => setBodyStats({ ...bodyStats, weightLbs: e.target.value })} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium">Age</label>
                <input type="number" value={bodyStats.age} onChange={e => setBodyStats({ ...bodyStats, age: e.target.value })} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium">Gender</label>
                <select value={bodyStats.gender} onChange={e => setBodyStats({ ...bodyStats, gender: e.target.value })} className="border rounded px-2 py-1 w-full">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Body Fat (%)</label>
                <input type="number" value={bodyStats.bodyFat} onChange={e => setBodyStats({ ...bodyStats, bodyFat: e.target.value })} className="border rounded px-2 py-1 w-full" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowBodyModal(false)}>Cancel</Button>
              <Button onClick={handleBodySave}>Save Body Stats</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 