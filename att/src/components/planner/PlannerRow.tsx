import React from 'react';
import { format, parseISO } from 'date-fns';
import { AttendanceRecord } from '@/types/attendance';
import { TimetableEntry } from '@/types/timetable';
import { StatusSelect } from './StatusSelect';
import { getDayOfWeek, isDateInPast } from '@/utils/dateUtils';

interface PlannerRowProps {
  date: string;
  entries: TimetableEntry[];
  records: AttendanceRecord[];
  plannedRecords: AttendanceRecord[];
  onStatusChange: (date: string, subjectCode: string, slotNumber: number, status: 'planned-present' | 'planned-absent') => void;
}

export const PlannerRow: React.FC<PlannerRowProps> = ({
  date,
  entries,
  records,
  plannedRecords,
  onStatusChange,
}) => {
  const dayOfWeek = getDayOfWeek(date) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  const isPast = isDateInPast(date);
  const dayEntries = entries.filter((e) => e.day === dayOfWeek);

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
    <div className={`border rounded-lg p-4 ${isPast ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          {format(parseISO(date), 'EEE, MMM dd, yyyy')}
        </h3>
        {isPast && <span className="text-xs text-gray-500">Past</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {dayEntries.map((entry) => {
          const status = getRecordStatus(entry.subjectCode, entry.slotNumber);
          return (
            <div key={`${date}-${entry.slotNumber}`} className="border rounded p-3">
              <div className="text-sm font-medium text-gray-900">{entry.subjectCode}</div>
              <div className="text-xs text-gray-600">{entry.subjectName}</div>
              <div className="text-xs text-gray-500 mt-1">Slot {entry.slotNumber}</div>
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
