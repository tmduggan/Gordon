import { DEFAULT_EQUIPMENT, ensureAvailableEquipment } from '../dataUtils';

describe('ensureAvailableEquipment', () => {
  it('returns defaults if input is undefined', () => {
    expect(ensureAvailableEquipment(undefined)).toEqual(DEFAULT_EQUIPMENT);
  });

  it('returns defaults if input is empty object', () => {
    expect(ensureAvailableEquipment({})).toEqual(DEFAULT_EQUIPMENT);
  });

  it('fills missing categories with defaults', () => {
    expect(ensureAvailableEquipment({ gym: ['barbell'] })).toEqual({
      gym: ['barbell'],
      bodyweight: DEFAULT_EQUIPMENT.bodyweight,
      cardio: DEFAULT_EQUIPMENT.cardio,
    });
  });

  it('fills empty arrays with defaults', () => {
    expect(
      ensureAvailableEquipment({ gym: [], bodyweight: [], cardio: [] })
    ).toEqual(DEFAULT_EQUIPMENT);
  });

  it('preserves non-empty arrays', () => {
    const input = {
      gym: ['barbell', 'dumbbell'],
      bodyweight: ['body weight', 'band'],
      cardio: ['treadmill'],
    };
    expect(ensureAvailableEquipment(input)).toEqual(input);
  });
});
