import { TeacherRecord } from '../types';

export const INITIAL_TIMESTAMP = '--/--/----';

// All schools, components, and teachers are derived strictly from the spreadsheet.
// No hardcoded or synthetic data exists.
export const URE_SUL_3_SCHOOLS: string[] = [];

export const ALL_COMPONENTS: string[] = [];

/**
 * Returns empty array. All teacher data comes strictly from the user's spreadsheet.
 */
export function generateInitialTeachers(): TeacherRecord[] {
  return [];
}
