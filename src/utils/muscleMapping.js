export const muscleMapping = {
  // MAPPING STRUCTURE: {SVG_muscle_group}: [library_muscle_names]
  // 
  // This maps SVG muscle groups (used in the visual chart) to exercise library muscle names.
  // When an exercise targets a library muscle name, it adds score to the corresponding SVG group.
  // 
  // Example: Exercise with target="pectorals" will shade the "pectorals" SVG muscle group
  // Example: Exercise with target="shoulders" will shade the "deltoids" SVG muscle group

  // Core muscles
  abs: ['abs', 'abdominals', 'abdominal', 'core'],
  obliques: ['obliques', 'oblique'],
  lower_abs: ['lower abs'],
  upper_abs: ['abs', 'abdominals'],
  
  // Leg muscles
  quads: ['quads', 'quadriceps', 'quad', 'thighs'],
  hamstrings: ['hamstrings', 'hams', 'hamstring'],
  glutes: ['glutes', 'gluteus', 'butt', 'buttocks'],
  calves: ['calves', 'calf', 'gastrocnemius'],
  adductors: ['adductors', 'adductor'],
  abductors: ['abductors', 'abductor'],
  hip_adductor: ['hip adductor', 'hip adductors', 'adductor'],
  hip_abductor: ['hip abductor', 'hip abductors'],
  
  // Arm muscles
  biceps: ['biceps', 'bicep'],
  triceps: ['triceps', 'tricep'],
  forearms: ['forearms', 'forearm'],
  hands: ['hands', 'hand'],
  
  // Shoulder muscles
  side_delts: ['shoulders', 'deltoids', 'deltoid', 'delt'],
  front_delts: ['shoulders', 'deltoids', 'deltoid', 'delt'],
  rear_delts: ['rear deltoids', 'rotator cuff'],
  
  // Chest muscles
  upper_pecs: ['chest', 'pecs', 'pectorals', 'pectoral'],
  lower_pecs: ['chest', 'pecs', 'pectorals', 'pectoral'],
  middle_pecs: ['chest', 'pecs', 'pectorals', 'pectoral'],
  pectorals: ['pectorals', 'chest', 'pecs', 'pectoral'],
  
  // Back muscles
  lats: ['lats', 'latissimus', 'latissimus dorsi'],
  rhomboids: ['rhomboids', 'rhomboid'],
  lower_back: ['lower back', 'lumbar', 'erector spinae'],
  upper_traps: ['upper traps', 'upper trapezius'],
  lower_traps: ['lower traps', 'lower trapezius'],
  
  // Neck
  neck: ['neck', 'cervical'],
};

export default muscleMapping; 