import { muscleMapping } from '../utils/muscleMapping';

/**
 * Automatically assign SVG mappings to exercises based on their target and secondary muscles
 * @param {Array} exercises - Array of exercise objects
 * @returns {Array} Exercises with auto-assigned SVG mappings
 */
export function autoAssignSvgMappings(exercises) {
  return exercises.map((exercise) => {
    // Skip if exercise already has a manual SVG mapping
    if (exercise.svgMapping !== null && exercise.svgMapping !== undefined) {
      return exercise;
    }

    const svgGroups = new Set();

    // Check target muscle
    if (exercise.target) {
      const targetMuscle = exercise.target.toLowerCase().trim();
      Object.entries(muscleMapping).forEach(([svgGroup, libraryMuscles]) => {
        if (
          libraryMuscles.some((muscle) => muscle.toLowerCase() === targetMuscle)
        ) {
          svgGroups.add(svgGroup);
        }
      });
    }

    // Check secondary muscles
    if (exercise.secondaryMuscles) {
      const secondaryMuscles = Array.isArray(exercise.secondaryMuscles)
        ? exercise.secondaryMuscles
        : [exercise.secondaryMuscles];

      secondaryMuscles.forEach((muscle) => {
        if (muscle) {
          const muscleName = muscle.toLowerCase().trim();
          Object.entries(muscleMapping).forEach(
            ([svgGroup, libraryMuscles]) => {
              if (
                libraryMuscles.some(
                  (libMuscle) => libMuscle.toLowerCase() === muscleName
                )
              ) {
                svgGroups.add(svgGroup);
              }
            }
          );
        }
      });
    }

    return {
      ...exercise,
      svgMapping: svgGroups.size > 0 ? Array.from(svgGroups) : null,
    };
  });
}

/**
 * Get available SVG muscle groups for selection
 * @returns {Array} Array of SVG muscle group names
 */
export function getAvailableSvgGroups() {
  return Object.keys(muscleMapping).sort();
}

/**
 * Get SVG groups that would be auto-assigned for a given exercise
 * @param {Object} exercise - Exercise object
 * @returns {Array} Array of SVG group names that would be auto-assigned
 */
export function getAutoAssignedSvgGroups(exercise) {
  const svgGroups = new Set();

  // Check target muscle
  if (exercise.target) {
    const targetMuscle = exercise.target.toLowerCase().trim();
    Object.entries(muscleMapping).forEach(([svgGroup, libraryMuscles]) => {
      if (
        libraryMuscles.some((muscle) => muscle.toLowerCase() === targetMuscle)
      ) {
        svgGroups.add(svgGroup);
      }
    });
  }

  // Check secondary muscles
  if (exercise.secondaryMuscles) {
    const secondaryMuscles = Array.isArray(exercise.secondaryMuscles)
      ? exercise.secondaryMuscles
      : [exercise.secondaryMuscles];

    secondaryMuscles.forEach((muscle) => {
      if (muscle) {
        const muscleName = muscle.toLowerCase().trim();
        Object.entries(muscleMapping).forEach(([svgGroup, libraryMuscles]) => {
          if (
            libraryMuscles.some(
              (libMuscle) => libMuscle.toLowerCase() === muscleName
            )
          ) {
            svgGroups.add(svgGroup);
          }
        });
      }
    });
  }

  return Array.from(svgGroups).sort();
}

/**
 * Validate SVG mapping for an exercise
 * @param {Array} svgMapping - Array of SVG group names
 * @returns {Object} Validation result with isValid and message
 */
export function validateSvgMapping(svgMapping) {
  if (!svgMapping || svgMapping.length === 0) {
    return {
      isValid: true,
      message: 'No SVG mapping (will use auto-assignment)',
    };
  }

  const availableGroups = getAvailableSvgGroups();
  const invalidGroups = svgMapping.filter(
    (group) => !availableGroups.includes(group)
  );

  if (invalidGroups.length > 0) {
    return {
      isValid: false,
      message: `Invalid SVG groups: ${invalidGroups.join(', ')}`,
    };
  }

  return { isValid: true, message: 'Valid SVG mapping' };
}

/**
 * Get display name for SVG muscle group
 * @param {string} svgGroup - SVG group name
 * @returns {string} Human-readable display name
 */
export function getSvgGroupDisplayName(svgGroup) {
  const displayNames = {
    abs: 'Abs',
    obliques: 'Obliques',
    lower_abs: 'Lower Abs',
    upper_abs: 'Upper Abs',
    quads: 'Quadriceps',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    calves: 'Calves',
    adductors: 'Adductors',
    abductors: 'Abductors',
    hip_adductor: 'Hip Adductors',
    hip_abductor: 'Hip Abductors',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Forearms',
    hands: 'Hands',
    side_delts: 'Side Deltoids',
    front_delts: 'Front Deltoids',
    rear_delts: 'Rear Deltoids',
    upper_pecs: 'Upper Pectorals',
    lower_pecs: 'Lower Pectorals',
    middle_pecs: 'Middle Pectorals',
    pectorals: 'Pectorals',
    lats: 'Latissimus Dorsi',
    rhomboids: 'Rhomboids',
    lower_back: 'Lower Back',
    upper_traps: 'Upper Trapezius',
    lower_traps: 'Lower Trapezius',
    neck: 'Neck',
  };

  return (
    displayNames[svgGroup] ||
    svgGroup.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

/**
 * Get available SVG muscle groups for filtering
 * Returns the actual SVG muscle groups from the system
 * @returns {Array} Array of SVG muscle group names
 */
export function getMuscleGroupCategories() {
  // Return the actual SVG muscle groups from muscleMapping
  return Object.keys(muscleMapping).sort();
}

/**
 * Get all muscle group names for filtering
 * @returns {Array} Array of muscle group names
 */
export function getMuscleGroupCategoryNames() {
  return getMuscleGroupCategories();
}

/**
 * Check if an exercise targets a specific muscle group
 * @param {Object} exercise - Exercise object
 * @param {string} muscleGroup - Muscle group name (e.g., 'abs', 'quads', 'biceps')
 * @returns {boolean} True if exercise targets the muscle group
 */
export function exerciseTargetsMuscleCategory(exercise, muscleGroup) {
  // Check if the muscle group exists in our mapping
  const libraryMuscles = muscleMapping[muscleGroup];
  if (!libraryMuscles) return false;

  // Check target muscle
  if (exercise.target) {
    const targetMuscle = exercise.target.toLowerCase().trim();
    if (
      libraryMuscles.some((muscle) => muscle.toLowerCase() === targetMuscle)
    ) {
      return true;
    }
  }

  // Check secondary muscles
  if (exercise.secondaryMuscles) {
    const secondaryMuscles = Array.isArray(exercise.secondaryMuscles)
      ? exercise.secondaryMuscles
      : [exercise.secondaryMuscles];

    for (const muscle of secondaryMuscles) {
      if (muscle) {
        const muscleName = muscle.toLowerCase().trim();
        if (
          libraryMuscles.some(
            (libMuscle) => libMuscle.toLowerCase() === muscleName
          )
        ) {
          return true;
        }
      }
    }
  }

  return false;
}
