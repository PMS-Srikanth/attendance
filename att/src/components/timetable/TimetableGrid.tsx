import React from 'react';
import { TimetableEntry, TimeSlot } from '@/types/timetable';
import { AttendanceRecord } from '@/types/attendance';
import { SlotCell } from './SlotCell';
import { DayHeader } from './DayHeader';

interface TimetableGridProps {
  entries: TimetableEntry[];
  timeSlots: TimeSlot[];
  attendanceRecords?: AttendanceRecord[];
}

// Saturday is excluded as it's handled via academic calendar and Saturday override feature
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TimetableGrid: React.FC<TimetableGridProps> = ({ entries, timeSlots, attendanceRecords = [] }) => {
  // Debug logging
  console.log('TimetableGrid - Entries:', entries);
  console.log('TimetableGrid - TimeSlots:', timeSlots);
  console.log('TimetableGrid - Days to display:', DAYS);
  
  // Log sample entries to see structure
  if (entries.length > 0) {
    console.log('Sample entry:', entries[0]);
  }
  
  const getEntryForSlot = (day: string, slotNumber: number): TimetableEntry | undefined => {
    const entry = entries.find((entry) => entry.day === day && entry.slotNumber === slotNumber);
    if (!entry && slotNumber === 1) {
      console.log(`No entry found for ${day} slot ${slotNumber}. Available entries for ${day}:`, 
        entries.filter(e => e.day === day).map(e => ({ slot: e.slotNumber, subject: e.subjectCode }))
      );
    }
    return entry;
  };

  // Group consecutive lab slots
  const getLabSlotRange = (day: string, slotNumber: number, entry: TimetableEntry): string | null => {
    if (!entry.isLab) return null;
    
    // Check if this is the first slot of a multi-slot lab
    const nextSlot = slotNumber + 1;
    const nextEntry = getEntryForSlot(day, nextSlot);
    
    if (nextEntry && nextEntry.subjectCode === entry.subjectCode && nextEntry.isLab) {
      // Find how many consecutive slots
      let endSlot = slotNumber;
      for (let i = slotNumber + 1; i <= timeSlots.length; i++) {
        const checkEntry = getEntryForSlot(day, i);
        if (checkEntry && checkEntry.subjectCode === entry.subjectCode && checkEntry.isLab) {
          endSlot = i;
        } else {
          break;
        }
      }
      return `Slots ${slotNumber} & ${endSlot}`;
    }
    
    return null;
  };

  // Check if this slot should be hidden (part of a merged lab)
  const shouldHideSlot = (day: string, slotNumber: number): boolean => {
    const entry = getEntryForSlot(day, slotNumber);
    if (!entry || !entry.isLab) return false;
    
    // Check if previous slot has the same lab subject
    const prevSlot = slotNumber - 1;
    const prevEntry = getEntryForSlot(day, prevSlot);
    
    return prevEntry !== undefined && prevEntry.subjectCode === entry.subjectCode && prevEntry.isLab === true;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
        <thead>
          <tr>
            <th className="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold dark:text-white">
              Time
            </th>
            {DAYS.map((day) => (
              <DayHeader key={day} day={day} />
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot) => {
            // Check if this is a break slot
            if (slot.isBreak) {
              const isLunchBreak = slot.breakLabel?.toLowerCase().includes('lunch');
              const breakIcon = isLunchBreak ? '🍽️' : '⏳';
              
              return (
                <tr key={slot.slotNumber} className="bg-orange-100 dark:bg-orange-900/30">
                  <td className="border border-gray-300 dark:border-gray-700 bg-orange-200 dark:bg-orange-800 px-4 py-3 text-sm text-center font-medium dark:text-white">
                    <div className="font-bold text-orange-900 dark:text-orange-100">{slot.breakLabel}</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </td>
                  <td 
                    colSpan={DAYS.length} 
                    className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center bg-orange-50 dark:bg-orange-900/20"
                  >
                    <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                      {breakIcon} {slot.breakLabel}
                    </span>
                  </td>
                </tr>
              );
            }
            
            // Regular class slot
            return (
            <tr key={slot.slotNumber}>
              <td className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-center font-medium dark:text-white">
                <div>{`Slot ${slot.slotNumber}`}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {slot.startTime} - {slot.endTime}
                </div>
              </td>
              {DAYS.map((day) => {
                const entry = getEntryForSlot(day, slot.slotNumber);
                const hide = shouldHideSlot(day, slot.slotNumber);
                const labRange = entry ? getLabSlotRange(day, slot.slotNumber, entry) : null;
                
                if (hide) {
                  return null; // Don't render this cell
                }
                
                return (
                  <SlotCell
                    key={`${day}-${slot.slotNumber}`}
                    entry={entry}
                    day={day}
                    slotNumber={slot.slotNumber}
                    labSlotRange={labRange}
                    rowSpan={labRange ? (parseInt(labRange.split('& ')[1]) - slot.slotNumber + 1) : 1}
                    attendanceRecords={attendanceRecords}
                  />
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
