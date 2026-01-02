// Attendance types
export type AttendanceStatus = 'present' | 'absent' | 'planned-present' | 'planned-absent';

export interface AttendanceRecord {
  id?: string;
  date: string; // ISO date format
  subjectCode: string;
  slotNumber: number;
  status: AttendanceStatus;
  isPast: boolean; // Whether the date is in the past
}

export interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  plannedPresentClasses: number;
  plannedAbsentClasses: number;
  currentPercentage: number;
  projectedPercentage: number;
  isBelowThreshold: boolean;
  willBeBelowThreshold: boolean;
}

export interface AttendanceSummary {
  subjects: SubjectAttendance[];
  overallPercentage: number;
  totalClasses: number;
  totalAttended: number;
}

export interface AttendanceWarning {
  subjectCode: string;
  subjectName: string;
  currentPercentage: number;
  projectedPercentage: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}
