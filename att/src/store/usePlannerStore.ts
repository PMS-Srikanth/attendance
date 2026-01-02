import { create } from 'zustand';
import { AttendanceRecord, AttendanceWarning } from '@/types/attendance';

interface PlannerStore {
  plannedRecords: AttendanceRecord[];
  warnings: AttendanceWarning[];
  selectedDate: string | null;
  selectedSubject: string | null;
  
  setPlannedRecords: (records: AttendanceRecord[]) => void;
  addPlannedRecord: (record: AttendanceRecord) => void;
  updatePlannedRecord: (date: string, subjectCode: string, slotNumber: number, status: 'planned-present' | 'planned-absent') => void;
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

export const usePlannerStore = create<PlannerStore>((set, get) => ({
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
}));
