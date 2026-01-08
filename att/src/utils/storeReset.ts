/**
 * Store reset utility
 * Forces all Zustand stores to rehydrate from localStorage
 */

import { useAttendanceStore } from '@/store/useAttendanceStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useTimetableStore } from '@/store/useTimetableStore';
import { usePlannerStore } from '@/store/usePlannerStore';

/**
 * Reset all stores to force rehydration
 * Call this when user changes to ensure fresh data is loaded
 */
export const resetAllStores = () => {
  // Get store instances
  const attendanceStore = useAttendanceStore.getState();
  const calendarStore = useCalendarStore.getState();
  const timetableStore = useTimetableStore.getState();
  const plannerStore = usePlannerStore.getState();
  
  // Clear all stores (they will rehydrate from localStorage automatically)
  attendanceStore.clearAttendance();
  calendarStore.clearCalendar();
  timetableStore.clearTimetable();
  plannerStore.clearPlannedRecords();
  plannerStore.clearWarnings();
};

/**
 * Hook to access store reset functionality
 */
export const useStoreReset = () => {
  return { resetAllStores };
};
