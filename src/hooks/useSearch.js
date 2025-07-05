import useFoodSearch from './useFoodSearch';
import useExerciseSearch from './useExerciseSearch';

/**
 * @deprecated Use useFoodSearch or useExerciseSearch instead
 * This wrapper maintains backward compatibility but uses the new efficient hooks internally
 */
export default function useSearch(type, library, userProfile, options = {}) {
    if (type === 'food') {
        return useFoodSearch(library, userProfile, options);
    }
    
    if (type === 'exercise') {
        return useExerciseSearch(library, userProfile);
    }
    
    // Fallback for unknown types
    console.warn(`useSearch: Unknown type "${type}". Use useFoodSearch or useExerciseSearch instead.`);
    return useFoodSearch(library, userProfile, options);
} 