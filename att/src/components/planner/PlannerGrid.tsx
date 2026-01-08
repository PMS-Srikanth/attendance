import React from 'react';
import { PlannerRow } from './PlannerRow';
import { AttendanceRecord } from '@/types/attendance';
import { TimetableEntry } from '@/types/timetable';

interface PlannerGridProps {
  dates: string[];
  entries: TimetableEntry[];
  records: AttendanceRecord[];
  plannedRecords: AttendanceRecord[];
  onStatusChange: (date: string, subjectCode: string, slotNumber: number, status?: 'planned-present' | 'planned-absent') => void;
}

export const PlannerGrid: React.FC<PlannerGridProps> = ({
  dates,
  entries,
  records,
  plannedRecords,
  onStatusChange,
}) => {
  return (
    <div className="overflow-x-auto">
      <div className="space-y-1">
        {dates.map((date) => (
          <PlannerRow
            key={date}
            date={date}
            entries={entries}
            records={records}
            plannedRecords={plannedRecords}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
};
