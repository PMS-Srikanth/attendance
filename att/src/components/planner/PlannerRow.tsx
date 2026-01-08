import React from 'react';
import { format, parseISO } from 'date-fns';
import { AttendanceRecord } from '@/types/attendance';
import { TimetableEntry } from '@/types/timetable';
import { StatusSelect } from './StatusSelect';
import { getDayOfWeek, isDateInPast } from '@/utils/dateUtils';
import { useCalendarStore } from '@/store/useCalendarStore';

interface PlannerRowProps {
  date: string;
  entries: TimetableEntry[];
  records: AttendanceRecord[];
  plannedRecords: AttendanceRecord[];
  onStatusChange: (date: string, subjectCode: string, slotNumber: number, status?: 'planned-present' | 'planned-absent') => void;
}

export const PlannerRow: React.FC<PlannerRowProps> = ({
  date,
  entries,
  records,
  plannedRecords,
  onStatusChange,
}) => {
  const { calendar } = useCalendarStore();
  const dayOfWeek = getDayOfWeek(date) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  const isPast = isDateInPast(date);
  
  // Check if this date is a holiday
  const holiday = calendar?.holidays.find((h) => h.date === date);
  
  // Check if this is a Saturday override
  const saturdayOverride = calendar?.saturdayOverrides.find((s) => s.date === date);
  
  // Determine which day's timetable to use
  const effectiveDay = saturdayOverride ? saturdayOverride.followsDay : dayOfWeek;
  
  // If it's a holiday, display holiday card
  if (holiday) {
    return (
      <div className="border-2 border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {format(parseISO(date), 'EEE, MMM dd, yyyy')}
          </h3>
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            HOLIDAY
          </span>
        </div>
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{holiday.name}</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 capitalize">
          {holiday.type} Holiday
        </p>
      </div>
    );
  }
  
  const dayEntries = entries.filter((e) => e.day === effectiveDay);

  if (dayEntries.length === 0) {
    return null;
  }

  const getRecordStatus = (subjectCode: string, slotNumber: number) => {
    const record = records.find(
      (r) => r.date === date && r.subjectCode === subjectCode && r.slotNumber === slotNumber
    );
    if (record) return record.status;

    const planned = plannedRecords.find(
      (r) => r.date === date && r.subjectCode === subjectCode && r.slotNumber === slotNumber
    );
    return planned?.status;
  };

  return (
    <div className={`border rounded-lg p-4 ${isPast ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'} ${saturdayOverride ? 'border-2 border-green-400 dark:border-green-600' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {format(parseISO(date), 'EEE, MMM dd, yyyy')}
          </h3>
          {saturdayOverride && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Follows {saturdayOverride.followsDay} Timetable
            </span>
          )}
        </div>
        {isPast && <span className="text-xs text-gray-500">Past</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {dayEntries.map((entry) => {
          const status = getRecordStatus(entry.subjectCode, entry.slotNumber);
          return (
            <div key={`${date}-${entry.slotNumber}`} className="border border-gray-200 dark:border-gray-600 rounded p-3 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.subjectCode}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">{entry.subjectName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Slot {entry.slotNumber}</div>
              <div className="mt-2">
                <StatusSelect
                  currentStatus={status}
                  isPast={isPast}
                  onChange={(newStatus) =>
                    onStatusChange(date, entry.subjectCode, entry.slotNumber, newStatus)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
