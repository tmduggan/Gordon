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
  abdominals: ['abs', 'abdominals', 'abdominal', 'core'],
  
  // Leg muscles
  quads: ['quads', 'quadriceps', 'quad', 'thighs', 'hip flexors'],
  hamstrings: ['hamstrings', 'hams', 'hamstring'],
  glutes: ['glutes', 'gluteus', 'butt', 'buttocks'],
  calves: ['calves', 'calf', 'gastrocnemius', 'soleus'],
  adductors: ['adductors', 'adductor', 'inner thighs', 'groin'],
  abductors: ['abductors', 'abductor'],
  hip_adductor: ['hip adductor', 'hip adductors', 'adductor'],
  hip_abductor: ['hip abductor', 'hip abductors'],
  
  // Arm muscles
  biceps: ['biceps', 'bicep', 'brachialis'],
  triceps: ['triceps', 'tricep'],
  forearms: ['forearms', 'forearm', 'wrist flexors', 'wrist extensors', 'wrists'],
  hands: ['hands', 'hand', 'grip muscles'],
  
  // Shoulder muscles
  side_delts: ['shoulders', 'deltoids', 'deltoid', 'delt', 'delts'],
  front_delts: ['shoulders', 'deltoids', 'deltoid', 'delt', 'delts'],
  rear_delts: ['rear deltoids', 'rotator cuff'],
  deltoids: ['deltoids', 'deltoid', 'delt', 'shoulders', 'delts'],
  
  // Chest muscles
  upper_pecs: ['chest', 'pecs', 'pectorals', 'pectoral', 'upper chest'],
  lower_pecs: ['chest', 'pecs', 'pectorals', 'pectoral'],
  middle_pecs: ['chest', 'pecs', 'pectorals', 'pectoral'],
  pectorals: ['pectorals', 'chest', 'pecs', 'pectoral', 'upper chest'],
  
  // Back muscles
  lats: ['lats', 'latissimus', 'latissimus dorsi'],
  rhomboids: ['rhomboids', 'rhomboid'],
  lower_back: ['lower back', 'lumbar', 'erector spinae', 'back'],
  upper_traps: ['upper traps', 'upper trapezius', 'upper back'],
  lower_traps: ['lower traps', 'lower trapezius', 'traps', 'trapezius'],
  trapezius: ['trapezius', 'traps', 'upper traps', 'middle traps', 'lower traps', 'upper trapezius', 'middle trapezius', 'lower trapezius'],
  
  // Neck
  neck: ['neck', 'cervical', 'sternocleidomastoid', 'levator scapulae'],
  
  // Additional muscle groups that need SVG representation
  // These could be added to the SVG if needed, or mapped to existing groups
  
  // Ankle/foot muscles - could be added as new SVG groups
  ankles: ['ankles', 'ankle stabilizers', 'feet', 'shins'],
};

// Special muscle groups that don't map to SVG but need to be tracked
// These will be stored in the user profile but not visualized on the muscle chart
export const specialMuscleGroups = {
  cardiovascular: ['cardiovascular system'],
  spine: ['spine'],
  serratus_anterior: ['serratus anterior'],
};

export default muscleMapping; 