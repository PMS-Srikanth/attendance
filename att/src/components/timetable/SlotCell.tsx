import React from 'react';
import { TimetableEntry } from '@/types/timetable';
import { AttendanceRecord } from '@/types/attendance';
import { format, startOfWeek, endOfWeek, parseISO, isBefore, isAfter, isSameDay } from 'date-fns';

interface SlotCellProps {
  entry?: TimetableEntry;
  day: string;
  slotNumber: number;
  labSlotRange?: string | null;
  rowSpan?: number;
  attendanceRecords?: AttendanceRecord[];
}

const getDayMapping = (day: string): number => {
  const mapping: Record<string, number> = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 0
  };
  return mapping[day] || 0;
};

export const SlotCell: React.FC<SlotCellProps> = ({ entry, day, slotNumber, labSlotRange, rowSpan = 1, attendanceRecords = [] }) => {
  // Log when we receive an entry to ensure data is flowing
  if (entry && slotNumber === 1 && day === 'Monday') {
    console.log('SlotCell received entry for Monday Slot 1:', entry);
  }
  
  if (!entry) {
    return (
      <td className="border border-gray-300 dark:border-gray-700 px-2 py-3 text-center bg-gray-50 dark:bg-gray-900">
        <span className="text-xs text-gray-400 dark:text-gray-600">—</span>
      </td>
    );
  }

  // Check if this class has occurred in current week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  // Find the date of this day in current week
  const dayIndex = getDayMapping(day);
  const classDate = new Date(weekStart);
  classDate.setDate(weekStart.getDate() + (dayIndex - 1));
  
  // Check if this class has already happened (before current time)
  const hasOccurred = isBefore(classDate, now) || isSameDay(classDate, now);
  
  // Find attendance record for this specific class
  const attendanceRecord = attendanceRecords.find(record => {
    const recordDate = parseISO(record.date);
    return record.subjectCode === entry.subjectCode && 
           record.slotNumber === slotNumber &&
           isSameDay(recordDate, classDate);
  });
  
  // Determine background color based on attendance
  let bgColor = entry.isLab ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800';
  let statusBadge: JSX.Element | null = null;
  
  if (hasOccurred && attendanceRecord) {
    if (attendanceRecord.status === 'present') {
      bgColor = 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500';
      statusBadge = (
        <div className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 mt-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Present
        </div>
      );
    } else if (attendanceRecord.status === 'absent') {
      bgColor = 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500';
      statusBadge = (
        <div className="flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 mt-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Absent
        </div>
      );
    }
  }

  return (
    <td 
      className={`border border-gray-300 dark:border-gray-700 px-2 py-3 ${bgColor} transition-colors`}
      rowSpan={rowSpan}
    >
      <div className="text-sm">
        <div className="font-semibold text-gray-900 dark:text-white">{entry.subjectCode}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{entry.subjectName}</div>
        {entry.facultyName && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{entry.facultyName}</div>
        )}
        {entry.roomNumber && (
          <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">Room: {entry.roomNumber}</div>
        )}
        {labSlotRange && (
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{labSlotRange}</div>
        )}
        {statusBadge}
      </div>
    </td>
  );
};
