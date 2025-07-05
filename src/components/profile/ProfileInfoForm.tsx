import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/useAuthStore';
import timeZones, { getCurrentTimeInZone } from '../../utils/timeZones';
import type { UserProfile } from '../../types';

interface ActivityLevel {
  value: string;
  label: string;
}

interface BodyStats {
  heightCm: number;
  heightFt: number;
  heightIn: number;
  weightKg: number;
  weightLbs: number;
  dob: string;
  gender: string;
  bodyFat: string;
  timeZone?: string;
  activityLevel?: string;
}

interface FormData {
  timeZone: string;
  activityLevel: string;
}

interface ProfileInfoFormProps {
  userProfile?: UserProfile;
  user: any; // Firebase user type
  onSave: (profile: Partial<UserProfile>) => void;
  onCancel: () => void;
  showActivityLevel?: boolean;
}

const activityLevels: ActivityLevel[] = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Lightly Active (light exercise 1-3 days/week)' },
  {
    value: 'moderate',
    label: 'Moderately Active (moderate exercise 3-5 days/week)',
  },
  { value: 'very', label: 'Very Active (hard exercise 6-7 days/week)' },
  { value: 'athlete', label: 'Athlete (very hard exercise, physical job)' },
];

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  userProfile,
  user,
  onSave,
  onCancel,
  showActivityLevel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      timeZone:
        userProfile?.timeZone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        '',
      activityLevel: userProfile?.activityLevel || 'moderate',
    },
  });

  const { saveUserProfile } = useAuthStore();

  // Body Update modal state
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const defaultBody: BodyStats = {
    heightCm: 178,
    heightFt: 5,
    heightIn: 10,
    weightKg: 68,
    weightLbs: 150,
    dob: '',
    gender: 'male',
    bodyFat: '',
  };
  const [bodyStats, setBodyStats] = useState<BodyStats>({
    heightCm: userProfile?.heightCm || defaultBody.heightCm,
    heightFt: userProfile?.heightFt || defaultBody.heightFt,
    heightIn: userProfile?.heightIn || defaultBody.heightIn,
    weightKg: userProfile?.weightKg || defaultBody.weightKg,
    weightLbs: userProfile?.weightLbs || defaultBody.weightLbs,
    dob: userProfile?.dob || defaultBody.dob,
    gender: userProfile?.gender || defaultBody.gender,
    bodyFat: userProfile?.bodyFat || defaultBody.bodyFat,
  });

  // Conversion helpers
  const toMetric = (ft: number, inch: number, lbs: number) => ({
    heightCm: Math.round((parseInt(ft.toString()) * 12 + parseInt(inch.toString())) * 2.54),
    weightKg: Math.round(parseFloat(lbs.toString()) * 0.453592),
  });
  
  const toImperial = (cm: number, kg: number) => {
    const totalInches = Math.round(parseFloat(cm.toString()) / 2.54);
    return {
      heightFt: Math.floor(totalInches / 12),
      heightIn: totalInches % 12,
      weightLbs: Math.round(parseFloat(kg.toString()) / 0.453592),
    };
  };

  const handleUnitToggle = (unit: 'imperial' | 'metric') => {
    if (unit === unitSystem) return;
    if (unit === 'metric') {
      // Convert imperial to metric
      const { heightCm, weightKg } = toMetric(
        bodyStats.heightFt,
        bodyStats.heightIn,
        bodyStats.weightLbs
      );
      setBodyStats({
        ...bodyStats,
        heightCm,
        weightKg,
      });
    } else {
      // Convert metric to imperial
      const { heightFt, heightIn, weightLbs } = toImperial(
        bodyStats.heightCm,
        bodyStats.weightKg
      );
      setBodyStats({
        ...bodyStats,
        heightFt,
        heightIn,
        weightLbs,
      });
    }
    setUnitSystem(unit);
  };

  const handleBodySave = () => {
    let heightCm = bodyStats.heightCm;
    let weightKg = bodyStats.weightKg;
    if (unitSystem === 'imperial') {
      const metric = toMetric(
        bodyStats.heightFt,
        bodyStats.heightIn,
        bodyStats.weightLbs
      );
      heightCm = metric.heightCm;
      weightKg = metric.weightKg;
    }
    const updatedProfile = {
      ...userProfile,
      heightCm,
      weightKg,
      dob: bodyStats.dob,
      gender: bodyStats.gender,
      bodyFat: bodyStats.bodyFat,
      timeZone: bodyStats.timeZone,
      activityLevel: bodyStats.activityLevel,
    };
    saveUserProfile(updatedProfile);
    onSave(updatedProfile);
    setShowBodyModal(false);
  };

  const onSubmit = (data: FormData) => {
    onSave({ ...userProfile, ...data });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="timeZone" className="text-sm font-medium">
            Time Zone
          </label>
          <select
            id="timeZone"
            {...register('timeZone', { required: 'Time zone is required' })}
            className="border rounded px-2 py-1 w-full"
          >
            {timeZones.map((tz) => (
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
            <label htmlFor="activityLevel" className="text-sm font-medium">
              Activity Level
            </label>
            <select
              id="activityLevel"
              {...register('activityLevel', {
                required: 'Activity level is required',
              })}
              className="border rounded px-2 py-1 w-full"
            >
              {activityLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.activityLevel && (
              <p className="text-sm text-red-600">
                {errors.activityLevel.message}
              </p>
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
      <div className="flex justify-center mt-6">
        <Button onClick={() => setShowBodyModal(true)} variant="secondary">
          ⚙️ Profile
        </Button>
      </div>
      {showBodyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-center">⚙️</h2>
            {/* Unit toggle */}
            <div className="flex gap-2 mb-4 justify-center">
              <Button
                variant={unitSystem === 'imperial' ? 'default' : 'outline'}
                onClick={() => handleUnitToggle('imperial')}
              >
                Imperial
              </Button>
              <Button
                variant={unitSystem === 'metric' ? 'default' : 'outline'}
                onClick={() => handleUnitToggle('metric')}
              >
                Metric
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {unitSystem === 'metric' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={bodyStats.heightCm}
                      onChange={(e) =>
                        setBodyStats({ ...bodyStats, heightCm: Number(e.target.value) })
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={bodyStats.weightKg}
                      onChange={(e) =>
                        setBodyStats({ ...bodyStats, weightKg: Number(e.target.value) })
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium">
                      Height (ft/in)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="ft"
                        value={bodyStats.heightFt}
                        onChange={(e) =>
                          setBodyStats({
                            ...bodyStats,
                            heightFt: Number(e.target.value),
                          })
                        }
                        className="border rounded px-2 py-1 w-16"
                      />
                      <input
                        type="number"
                        placeholder="in"
                        value={bodyStats.heightIn}
                        onChange={(e) =>
                          setBodyStats({
                            ...bodyStats,
                            heightIn: Number(e.target.value),
                          })
                        }
                        className="border rounded px-2 py-1 w-16"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      value={bodyStats.weightLbs}
                      onChange={(e) =>
                        setBodyStats({
                          ...bodyStats,
                          weightLbs: Number(e.target.value),
                        })
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={bodyStats.dob}
                  onChange={(e) =>
                    setBodyStats({ ...bodyStats, dob: e.target.value })
                  }
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Gender</label>
                <select
                  value={bodyStats.gender}
                  onChange={(e) =>
                    setBodyStats({ ...bodyStats, gender: e.target.value })
                  }
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Body Fat (%)
                </label>
                <input
                  type="number"
                  value={bodyStats.bodyFat}
                  onChange={(e) =>
                    setBodyStats({ ...bodyStats, bodyFat: e.target.value })
                  }
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              {/* Move Time Zone and Activity Level here */}
              <div className="col-span-2">
                <label htmlFor="timeZone" className="text-sm font-medium">
                  Time Zone
                </label>
                <select
                  id="timeZone"
                  value={
                    bodyStats.timeZone ||
                    userProfile?.timeZone ||
                    Intl.DateTimeFormat().resolvedOptions().timeZone ||
                    ''
                  }
                  onChange={(e) =>
                    setBodyStats({ ...bodyStats, timeZone: e.target.value })
                  }
                  className="border rounded px-2 py-1 w-full"
                >
                  {timeZones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} {tz.flag} (GMT{tz.gmtOffset})
                      {`  ${getCurrentTimeInZone(tz.value)}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label htmlFor="activityLevel" className="text-sm font-medium">
                  Activity Level
                </label>
                <select
                  id="activityLevel"
                  value={
                    bodyStats.activityLevel ||
                    userProfile?.activityLevel ||
                    'moderate'
                  }
                  onChange={(e) =>
                    setBodyStats({
                      ...bodyStats,
                      activityLevel: e.target.value,
                    })
                  }
                  className="border rounded px-2 py-1 w-full"
                >
                  {activityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="outline" onClick={() => setShowBodyModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleBodySave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileInfoForm; 