import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
import { AttendanceRecord, AttendanceWarning } from '@/types/attendance';
import { createUserStorage } from '@/utils/userStorage';

interface PlannerStore {
  plannedRecords: AttendanceRecord[];
  warnings: AttendanceWarning[];
  selectedDate: string | null;
  selectedSubject: string | null;
  
  setPlannedRecords: (records: AttendanceRecord[]) => void;
  addPlannedRecord: (record: AttendanceRecord) => void;
  updatePlannedRecord: (date: string, subjectCode: string, slotNumber: number, status?: 'planned-present' | 'planned-absent') => void;
  bulkUpdatePlannedRecords: (
    updates: Array<{
      date: string;
      subjectCode: string;
      slotNumber: number;
      status?: 'planned-present' | 'planned-absent';
    }>
  ) => void;
  removePlannedRecord: (date: string, subjectCode: string, slotNumber: number) => void;
  clearPlannedRecords: () => void;
  
  setWarnings: (warnings: AttendanceWarning[]) => void;
  clearWarnings: () => void;
  
  setSelectedDate: (date: string | null) => void;
  setSelectedSubject: (subject: string | null) => void;
  
  // Helper methods
  getPlannedRecordForSlot: (date: string, subjectCode: string, slotNumber: number) => AttendanceRecord | undefined;
  hasWarningForSubject: (subjectCode: string) => boolean;
}

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
  plannedRecords: [],
  warnings: [],
  selectedDate: null,
  selectedSubject: null,

  setPlannedRecords: (plannedRecords) => set({ plannedRecords }),

  addPlannedRecord: (record) =>
    set((state) => ({
      plannedRecords: [...state.plannedRecords, record],
    })),

  updatePlannedRecord: (date, subjectCode, slotNumber, status) =>
    set((state) => {
      const existingIndex = state.plannedRecords.findIndex(
        (r) => r.date === date && r.subjectCode === subjectCode && r.slotNumber === slotNumber
      );

      if (!status) {
        // Clear selection
        if (existingIndex >= 0) {
          const updatedRecords = [...state.plannedRecords];
          updatedRecords.splice(existingIndex, 1);
          return { plannedRecords: updatedRecords };
        }
        return state;
      }

      if (existingIndex >= 0) {
        const updatedRecords = [...state.plannedRecords];
        updatedRecords[existingIndex] = {
          ...updatedRecords[existingIndex],
          status,
        };
        return { plannedRecords: updatedRecords };
      } else {
        return {
          plannedRecords: [
            ...state.plannedRecords,
            {
              date,
              subjectCode,
              slotNumber,
              status,
              isPast: false,
            },
          ],
        };
      }
    }),

  bulkUpdatePlannedRecords: (updates) =>
    set((state) => {
      if (!updates.length) return state;

      const keyOf = (u: { date: string; subjectCode: string; slotNumber: number }) =>
        `${u.date}__${u.subjectCode}__${u.slotNumber}`;

      const next = [...state.plannedRecords];
      const indexByKey = new Map<string, number>();
      for (let i = 0; i < next.length; i++) {
        indexByKey.set(keyOf(next[i]), i);
      }

      for (const update of updates) {
        const key = keyOf(update);
        const existingIndex = indexByKey.get(key);

        if (!update.status) {
          if (existingIndex !== undefined) {
            next.splice(existingIndex, 1);
            indexByKey.clear();
            for (let i = 0; i < next.length; i++) {
              indexByKey.set(keyOf(next[i]), i);
            }
          }
          continue;
        }

        if (existingIndex !== undefined) {
          next[existingIndex] = { ...next[existingIndex], status: update.status };
        } else {
          next.push({
            date: update.date,
            subjectCode: update.subjectCode,
            slotNumber: update.slotNumber,
            status: update.status,
            isPast: false,
          });
          indexByKey.set(key, next.length - 1);
        }
      }

      return { plannedRecords: next };
    }),

  removePlannedRecord: (date, subjectCode, slotNumber) =>
    set((state) => ({
      plannedRecords: state.plannedRecords.filter(
        (r) => !(r.date === date && r.subjectCode === subjectCode && r.slotNumber === slotNumber)
      ),
    })),

  clearPlannedRecords: () => set({ plannedRecords: [] }),

  setWarnings: (warnings) => set({ warnings }),

  clearWarnings: () => set({ warnings: [] }),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  setSelectedSubject: (selectedSubject) => set({ selectedSubject }),

  getPlannedRecordForSlot: (date, subjectCode, slotNumber) => {
    return get().plannedRecords.find(
      (r) => r.date === date && r.subjectCode === subjectCode && r.slotNumber === slotNumber
    );
  },

  hasWarningForSubject: (subjectCode) => {
    return get().warnings.some((w) => w.subjectCode === subjectCode);
  },
    }),
    {
      name: 'planner-storage',
      storage: createJSONStorage(() => createUserStorage('planner-storage')),
      partialize: (state) => ({
        plannedRecords: state.plannedRecords,
        warnings: state.warnings,
      }),
    } satisfies PersistOptions<PlannerStore, Pick<PlannerStore, 'plannedRecords' | 'warnings'>>
  )
);
