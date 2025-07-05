// Icon mappings for equipment types
export const equipmentIconMap: Record<string, string> = {
  'smith machine': '/icons/smith.png',
  dumbbell: '/icons/dumbbell.png',
  barbell: '/icons/barbell.png',
  kettlebell: '/icons/kettlebell.png',
  'sled machine': '/icons/sled machine.jpg',
  'body weight': '/icons/bodyweight.png',
  machine: '/icons/machine.png',
};

// Helper function to get equipment icon based on equipment name
export const getEquipmentIcon = (equipmentName: string | null | undefined): string | null => {
  if (!equipmentName) return null;
  const lowerCaseEquipment = equipmentName.toLowerCase();

  if (lowerCaseEquipment.includes('dumbbell'))
    return equipmentIconMap['dumbbell'];
  if (lowerCaseEquipment.includes('barbell'))
    return equipmentIconMap['barbell'];
  if (lowerCaseEquipment.includes('kettlebell'))
    return equipmentIconMap['kettlebell'];
  if (lowerCaseEquipment === 'smith machine')
    return equipmentIconMap['smith machine'];
  if (lowerCaseEquipment === 'sled machine')
    return equipmentIconMap['sled machine'];
  if (lowerCaseEquipment === 'body weight')
    return equipmentIconMap['body weight'];
  if (
    lowerCaseEquipment === 'leverage machine' ||
    lowerCaseEquipment === 'cable'
  ) {
    return equipmentIconMap['machine'];
  }

  return null;
};

// Icon mappings for muscle groups
export const muscleIconMap: Record<string, string> = {
  quads: '/icons/Muscle-Quads.jpeg',
  abductors: '/icons/Muscle-Abductors.jpeg',
  abs: '/icons/Muscle-Abs.jpeg',
  adductors: '/icons/Muscle-Adductors.jpeg',
  biceps: '/icons/Muscle-Biceps.jpeg',
  calves: '/icons/Muscle-Calves.jpeg',
  delts: '/icons/Muscle-Deltoids.jpeg',
  forearms: '/icons/Muscle-Forearms.jpeg',
  hamstrings: '/icons/Muscle-Hamstrings.jpeg',
  pectorals: '/icons/Muscle-Pectorals.jpeg',
  'serratus anterior': '/icons/Muscle-serratus anterior.jpeg',
  traps: '/icons/Muscle-Traps.jpeg',
  triceps: '/icons/Muscle-Triceps.jpeg',
  glutes: '/icons/Muscle-glutes.jpeg',
};

// Helper function to get muscle icon based on muscle name
export const getMuscleIcon = (muscleName: string | null | undefined): string | null => {
  if (!muscleName) return null;
  const lowerCaseMuscle = muscleName.toLowerCase();
  return muscleIconMap[lowerCaseMuscle] || null;
};

// Color mappings for difficulty levels
export const difficultyColorMap: Record<string, string> = {
  beginner: 'bg-sky-500',
  intermediate: 'bg-emerald-600',
  advanced: 'bg-orange-500',
}; 