import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
import { CalendarData, Holiday, SaturdayOverride, WorkingDay } from '@/types/calendar';
import { createUserStorage } from '@/utils/userStorage';

interface CalendarStore {
  calendar: CalendarData | null;
  isLoading: boolean;
  error: string | null;
  
  setCalendar: (calendar: CalendarData) => void;
  updateDates: (startDate: string, endDate: string) => void;
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (date: string) => void;
  addSaturdayOverride: (override: SaturdayOverride) => void;
  removeSaturdayOverride: (date: string) => void;
  setWorkingDays: (workingDays: WorkingDay[]) => void;
  clearCalendar: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      calendar: null,
      isLoading: false,
      error: null,

      setCalendar: (calendar) => set({ calendar, error: null }),

      updateDates: (semesterStartDate, semesterEndDate) =>
        set((state) => ({
          calendar: state.calendar
            ? { ...state.calendar, semesterStartDate, semesterEndDate }
            : null,
        })),

      addHoliday: (holiday) =>
        set((state) => {
          if (!state.calendar) return state;
          const holidays = [...state.calendar.holidays, holiday];
          return { calendar: { ...state.calendar, holidays } };
        }),

      removeHoliday: (date) =>
        set((state) => {
          if (!state.calendar) return state;
          const holidays = state.calendar.holidays.filter((h) => h.date !== date);
          return { calendar: { ...state.calendar, holidays } };
        }),

      addSaturdayOverride: (override) =>
        set((state) => {
          if (!state.calendar) return state;
          const saturdayOverrides = [...state.calendar.saturdayOverrides, override];
          return { calendar: { ...state.calendar, saturdayOverrides } };
        }),

      removeSaturdayOverride: (date) =>
        set((state) => {
          if (!state.calendar) return state;
          const saturdayOverrides = state.calendar.saturdayOverrides.filter(
            (o) => o.date !== date
          );
          return { calendar: { ...state.calendar, saturdayOverrides } };
        }),

      setWorkingDays: (workingDays) =>
        set((state) => ({
          calendar: state.calendar ? { ...state.calendar, workingDays } : null,
        })),

      clearCalendar: () => set({ calendar: null, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'calendar-storage',
      storage: createJSONStorage(() => createUserStorage('calendar-storage')),
      partialize: (state) => ({
        calendar: state.calendar,
      }),
    } satisfies PersistOptions<CalendarStore, Pick<CalendarStore, 'calendar'>>
  )
);
