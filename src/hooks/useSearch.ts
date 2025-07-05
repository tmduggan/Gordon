import useExerciseSearch from './useExerciseSearch';
import useFoodSearch from './useFoodSearch';
import type { Food, Exercise, UserProfile } from '../types';

export type SearchType = 'food' | 'exercise';

interface SearchOptions {
  [key: string]: any;
}

/**
 * @deprecated Use useFoodSearch or useExerciseSearch instead
 * This wrapper maintains backward compatibility but uses the new efficient hooks internally
 */
export default function useSearch(
  type: SearchType,
  library: Food[] | Exercise[],
  userProfile: UserProfile | null,
  options: SearchOptions = {}
) {
  if (type === 'food') {
    return useFoodSearch(library as Food[], userProfile, options);
  }

  if (type === 'exercise') {
    return useExerciseSearch(library as Exercise[], userProfile);
  }

  // Fallback for unknown types
  console.warn(
    `useSearch: Unknown type "${type}". Use useFoodSearch or useExerciseSearch instead.`
  );
  return useFoodSearch(library as Food[], userProfile, options);
} 