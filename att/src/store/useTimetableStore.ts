import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
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
  moveEntry: (
    from: Pick<TimetableEntry, 'day' | 'slotNumber'>,
    to: Pick<TimetableEntry, 'day' | 'slotNumber'>
  ) => { moved: boolean; swapped: boolean } | null;
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

      moveEntry: (from, to) => {
        if (from.day === to.day && from.slotNumber === to.slotNumber) {
          return { moved: false, swapped: false };
        }

        let result: { moved: boolean; swapped: boolean } | null = null;

        set((state) => {
          const timetable = state.timetable;
          if (!timetable) {
            result = null;
            return state;
          }

          const fromEntry = timetable.entries.find(
            (e) => e.day === from.day && e.slotNumber === from.slotNumber
          );
          if (!fromEntry) {
            result = { moved: false, swapped: false };
            return state;
          }

          const toEntry = timetable.entries.find(
            (e) => e.day === to.day && e.slotNumber === to.slotNumber
          );

          const kept = timetable.entries.filter((e) => {
            const isFrom = e.day === from.day && e.slotNumber === from.slotNumber;
            const isTo = e.day === to.day && e.slotNumber === to.slotNumber;
            return !(isFrom || isTo);
          });

          const next: TimetableEntry[] = [
            ...kept,
            { ...fromEntry, day: to.day, slotNumber: to.slotNumber },
          ];

          if (toEntry) {
            next.push({ ...toEntry, day: from.day, slotNumber: from.slotNumber });
          }

          result = { moved: true, swapped: Boolean(toEntry) };
          return {
            timetable: {
              ...timetable,
              entries: next,
            },
          };
        });

        return result;
      },

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
      storage: createJSONStorage(() => createUserStorage('timetable-storage')),
      partialize: (state) => ({
        timetable: state.timetable,
      }),
    } satisfies PersistOptions<TimetableStore, Pick<TimetableStore, 'timetable'>>
  )
);
