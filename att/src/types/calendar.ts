// Calendar types
export interface Holiday {
  date: string; // ISO date format
  name: string;
  type: 'national' | 'college' | 'exam' | 'other';
}

export interface WorkingDay {
  date: string; // ISO date format
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  isWorking: boolean;
}

export interface SaturdayOverride {
  date: string; // ISO date format
  followsDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
}

export interface CalendarData {
  semesterStartDate: string;
  semesterEndDate: string;
  holidays: Holiday[];
  saturdayOverrides: SaturdayOverride[];
  workingDays?: WorkingDay[];
}
