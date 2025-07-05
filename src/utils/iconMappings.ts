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
export function getEquipmentIcon(equipment: string | null | undefined): string | undefined {
  if (!equipment) return undefined;
  return equipmentIconMap[equipment.toLowerCase()] || undefined;
}

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