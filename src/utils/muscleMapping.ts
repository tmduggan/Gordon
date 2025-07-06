export const muscleMapping: Record<string, string[]> = {
  // MAPPING STRUCTURE: {SVG_muscle_group}: [library_muscle_names]
  //
  // This maps SVG muscle groups (used in the visual chart) to exercise library muscle names.
  // When an exercise targets a library muscle name, it adds score to the corresponding SVG group.
  //
  // Example: Exercise with target="pectorals" will shade the "pectorals" SVG muscle group
  // Example: Exercise with target="shoulders" will shade the "deltoids" SVG muscle group

  // Core muscles
  abdominals: ['upper abs', 'abs', 'abdominal', 'abdominals', 'core'],
  obliques: ['obliques', 'oblique'],
  lower_abs: ['lower abs'],

  // Leg muscles
  quads: ['quads', 'quadriceps', 'quad', 'thighs', 'hip flexors'],
  hamstrings: ['hamstrings', 'hams', 'hamstring'],
  glutes: ['glutes', 'gluteus', 'butt', 'buttocks'],
  calves: ['calves', 'calf', 'gastrocnemius', 'soleus'],
  adductors: [
    'adductors',
    'adductor',
    'inner thighs',
    'groin',
    'hip adductor',
    'hip adductors',
  ],
  abductors: ['abductors', 'abductor', 'hip abductor', 'hip abductors'],

  // Upper body muscles
  pectorals: [
    'chest',
    'pectorals',
    'pecs',
    'upper pecs',
    'lower pecs',
    'middle pecs',
    'pectoralis major',
    'pectoralis minor',
  ],
  deltoids: [
    'side delts',
    'front delts',
    'shoulders',
    'deltoids',
    'delts',
    'lateral deltoids',
    'anterior deltoids',
    'medial deltoids',
  ],
  rear_delts: ['rear deltoids', 'rear delts', 'rotator cuff'],
  biceps: ['biceps', 'bicep', 'biceps brachii'],
  triceps: ['triceps', 'tricep', 'triceps brachii'],
  forearms: ['forearms', 'forearm', 'wrist flexors', 'wrist extensors'],

  // Back muscles
  lats: ['lats', 'latissimus dorsi', 'lat', 'back'],
  rhomboids: ['rhomboids', 'rhomboid'],
  upper_traps: ['upper traps', 'upper trapezius', 'traps'],
  lower_traps: ['lower traps', 'lower trapezius'],
  lower_back: ['lower back', 'erector spinae', 'spinal erectors'],

  // Other muscles
  neck: ['neck', 'cervical'],
  hands: ['hands', 'grip'],

  // Additional muscle groups that need SVG representation
  // These could be added to the SVG if needed, or mapped to existing groups

  // Ankle/foot muscles - could be added as new SVG groups
  ankles: ['ankles', 'ankle stabilizers', 'feet', 'shins'],
};

// Special muscle groups that don't map to SVG but need to be tracked
// These will be stored in the user profile but not visualized on the muscle chart
export const specialMuscleGroups: Record<string, string[]> = {
  cardiovascular: ['cardiovascular system'],
  spine: ['spine'],
  serratus_anterior: ['serratus anterior'],
};

export default muscleMapping;

// Example: Map muscle group names to display names
export const muscleGroupDisplayNames: Record<string, string> = {
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  glutes: 'Glutes',
  abs: 'Abdominals',
  lower_back: 'Lower Back',
  upper_back: 'Upper Back',
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
};

// Example: Get display name for a muscle group
export function getMuscleGroupDisplayName(muscle: string): string {
  return muscleGroupDisplayNames[muscle] || muscle;
} 