import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AttendanceRecord, AttendanceSummary } from '@/types/attendance';

interface AttendanceStore {
  records: AttendanceRecord[];
  summary: AttendanceSummary | null;
  isLoading: boolean;
  error: string | null;
  
  setRecords: (records: AttendanceRecord[]) => void;
  addRecord: (record: AttendanceRecord) => void;
  updateRecord: (id: string, record: Partial<AttendanceRecord>) => void;
  removeRecord: (id: string) => void;
  setSummary: (summary: AttendanceSummary) => void;
  clearAttendance: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Helper methods
  getRecordsBySubject: (subjectCode: string) => AttendanceRecord[];
  getRecordsByDate: (date: string) => AttendanceRecord[];
  getRecordsByDateRange: (startDate: string, endDate: string) => AttendanceRecord[];
}

export const useAttendanceStore = create<AttendanceStore>()(
  persist(
    (set, get) => ({
      records: [],
      summary: null,
      isLoading: false,
      error: null,

      setRecords: (records) => set({ records, error: null }),

      addRecord: (record) =>
        set((state) => ({
          records: [...state.records, record],
        })),

      updateRecord: (id, updatedRecord) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id ? { ...record, ...updatedRecord } : record
          ),
        })),

      removeRecord: (id) =>
        set((state) => ({
          records: state.records.filter((record) => record.id !== id),
        })),

      setSummary: (summary) => set({ summary }),

      clearAttendance: () => set({ records: [], summary: null, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      getRecordsBySubject: (subjectCode) => {
        return get().records.filter((record) => record.subjectCode === subjectCode);
      },

      getRecordsByDate: (date) => {
        return get().records.filter((record) => record.date === date);
      },

      getRecordsByDateRange: (startDate, endDate) => {
        return get().records.filter(
          (record) => record.date >= startDate && record.date <= endDate
        );
      },
    }),
    {
      name: 'attendance-storage',
    }
  )
);
