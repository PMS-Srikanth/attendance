import { AttendanceStatus } from '@/types/attendance';

export const getStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case 'present':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
    case 'absent':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800';
    case 'planned-present':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800';
    case 'planned-absent':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const getStatusLabel = (status: AttendanceStatus): string => {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'planned-present':
      return 'Plan: Present';
    case 'planned-absent':
      return 'Plan: Absent';
    default:
      return 'Unknown';
  }
};

export const getStatusIcon = (status: AttendanceStatus): string => {
  switch (status) {
    case 'present':
      return '✓';
    case 'absent':
      return '✗';
    case 'planned-present':
      return '◐';
    case 'planned-absent':
      return '◯';
    default:
      return '?';
  }
};

export const calculatePercentage = (attended: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100 * 100) / 100; // Round to 2 decimal places
};

export const isAboveThreshold = (percentage: number, threshold: number = 75): boolean => {
  return percentage >= threshold;
};

export const getPercentageColor = (percentage: number, threshold: number = 75): string => {
  if (percentage >= threshold + 10) {
    return 'text-emerald-600 dark:text-emerald-400';
  } else if (percentage >= threshold) {
    return 'text-amber-600 dark:text-amber-400';
  } else if (percentage >= threshold - 5) {
    return 'text-orange-600 dark:text-orange-400';
  } else {
    return 'text-rose-600 dark:text-rose-400';
  }
};

export const getPercentageBgColor = (percentage: number, threshold: number = 75): string => {
  if (percentage >= threshold + 10) {
    return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800';
  } else if (percentage >= threshold) {
    return 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800';
  } else if (percentage >= threshold - 5) {
    return 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800';
  } else {
    return 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800';
  }
};

export const calculateRequiredAttendance = (
  currentAttended: number,
  currentTotal: number,
  threshold: number = 75
): number => {
  // Calculate how many consecutive classes need to be attended to reach threshold
  let attended = currentAttended;
  let total = currentTotal;
  let required = 0;

  while (calculatePercentage(attended, total) < threshold) {
    attended++;
    total++;
    required++;
  }

  return required;
};

export const calculateMaxAbsences = (
  currentAttended: number,
  currentTotal: number,
  futureClasses: number,
  threshold: number = 75
): number => {
  // Calculate maximum absences possible while maintaining threshold
  let absences = 0;
  const totalClasses = currentTotal + futureClasses;

  for (let i = 0; i <= futureClasses; i++) {
    const percentage = calculatePercentage(currentAttended, totalClasses - i);
    if (percentage >= threshold) {
      absences = i;
    } else {
      break;
    }
  }

  return absences;
};
