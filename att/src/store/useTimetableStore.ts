import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimetableData, Subject, TimeSlot, TimetableEntry } from '@/types/timetable';
import { createUserStorage } from '@/utils/userStorage';

interface TimetableStore {
  timetable: TimetableData | null;
  isLoading: boolean;
  error: string | null;
  
  setTimetable: (timetable: TimetableData) => void;
  updateSubjects: (subjects: Subject[]) => void;
  updateTimeSlots: (timeSlots: TimeSlot[]) => void;
  updateEntries: (entries: TimetableEntry[]) => void;
  addEntry: (entry: TimetableEntry) => void;
  removeEntry: (day: string, slotNumber: number) => void;
  clearTimetable: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTimetableStore = create<TimetableStore>()(
  persist(
    (set) => ({
      timetable: null,
      isLoading: false,
      error: null,

      setTimetable: (timetable) => set({ timetable, error: null }),

      updateSubjects: (subjects) =>
        set((state) => ({
          timetable: state.timetable ? { ...state.timetable, subjects } : null,
        })),

      updateTimeSlots: (timeSlots) =>
        set((state) => ({
          timetable: state.timetable ? { ...state.timetable, timeSlots } : null,
        })),

      updateEntries: (entries) =>
        set((state) => ({
          timetable: state.timetable ? { ...state.timetable, entries } : null,
        })),

      addEntry: (entry) =>
        set((state) => {
          if (!state.timetable) return state;
          const entries = [...state.timetable.entries, entry];
          return { timetable: { ...state.timetable, entries } };
        }),

      removeEntry: (day, slotNumber) =>
        set((state) => {
          if (!state.timetable) return state;
          const entries = state.timetable.entries.filter(
            (e) => !(e.day === day && e.slotNumber === slotNumber)
          );
          return { timetable: { ...state.timetable, entries } };
        }),

      clearTimetable: () => set({ timetable: null, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'timetable-storage',
      storage: createUserStorage('timetable-storage'),
      partialize: (state) => ({
        timetable: state.timetable,
      }),
    }
  )
);
