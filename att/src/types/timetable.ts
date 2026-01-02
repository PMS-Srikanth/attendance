// Timetable types
export interface TimeSlot {
  slotNumber: number;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  breakLabel?: string;
}

export interface TimetableEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  slotNumber: number;
  subjectCode: string;
  subjectName: string;
  facultyName?: string;
  roomNumber?: string;
  isLab?: boolean;
}

export interface Subject {
  subjectCode: string;
  subjectName: string;
  totalSlots?: number;
}

export interface TimetableData {
  subjects: Subject[];
  timeSlots: TimeSlot[];
  entries: TimetableEntry[];
}
