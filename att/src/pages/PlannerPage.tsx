import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { PlannerGrid } from '@/components/planner/PlannerGrid';
import { WarningBanner } from '@/components/planner/WarningBanner';
import { CalendarManagement } from '@/components/planner/CalendarManagement';
import { useTimetableStore } from '@/store/useTimetableStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { usePlannerStore } from '@/store/usePlannerStore';
import { usePlannerWarnings } from '@/hooks/usePlannerWarnings';
import { generateDateRange, getDayOfWeek } from '@/utils/dateUtils';
import { addDays, startOfDay } from 'date-fns';

export const PlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { timetable } = useTimetableStore();
  const { calendar } = useCalendarStore();
  const { records } = useAttendanceStore();
  const { plannedRecords, updatePlannedRecord } = usePlannerStore();
  const warnings = usePlannerWarnings();
  
  const [dateRange, setDateRange] = useState<string[]>([]);
  const [daysToShow, setDaysToShow] = useState(14); // Show next 2 weeks by default

  useEffect(() => {
    if (calendar) {
      const today = startOfDay(new Date());
      const endDate = addDays(today, daysToShow);
      const dates = generateDateRange(
        today.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Filter out holidays and Sundays, but include Saturday overrides
      const workingDates = dates.filter((date) => {
        const dayOfWeek = getDayOfWeek(date);
        
        // Check if this is a Saturday override (working Saturday)
        const isSaturdayOverride = calendar.saturdayOverrides.some((o) => o.date === date);
        
        // Sundays are always off (unless it's a Saturday override, but that doesn't make sense)
        if (dayOfWeek === 'Sunday') return false;
        
        // Check if it's a holiday
        const isHoliday = calendar.holidays.some((h) => h.date === date);
        if (isHoliday) return false;

        // Saturdays are off by default unless overridden
        if (dayOfWeek === 'Saturday' && !isSaturdayOverride) return false;

        return true;
      });

      setDateRange(workingDates);
    }
  }, [calendar, daysToShow]);

  if (!timetable || !calendar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No data found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please upload and review your data first</p>
          <Button onClick={() => navigate('/')}>Go to Upload</Button>
        </div>
      </div>
    );
  }

  const handleStatusChange = (
    date: string,
    subjectCode: string,
    slotNumber: number,
    status: 'planned-present' | 'planned-absent'
  ) => {
    updatePlannedRecord(date, subjectCode, slotNumber, status);
  };

  const handleLoadMore = () => {
    setDaysToShow(daysToShow + 7);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="mb-8 animate-slide-down text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl shadow-xl mb-4 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Plan Your Attendance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Mark your planned attendance for upcoming classes
          </p>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && <WarningBanner warnings={warnings} />}

        {/* Calendar Management */}
        <CalendarManagement />

        {/* Planner Grid */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-8 mb-6 border border-gray-200 dark:border-gray-700 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Classes</h2>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Next {daysToShow} days</span>
            </div>
          </div>

          <PlannerGrid
            dates={dateRange}
            entries={timetable.entries.filter(entry => {
              const codeLower = entry.subjectCode.toLowerCase();
              const nameLower = entry.subjectName.toLowerCase();
              return !codeLower.includes('library') &&
                     !codeLower.includes('advisor') &&
                     !codeLower.includes('sports') &&
                     codeLower !== 'ca' &&
                     !nameLower.includes('library') &&
                     !nameLower.includes('class advisor') &&
                     !nameLower.includes('sports');
            })}
            records={records}
            plannedRecords={plannedRecords}
            onStatusChange={handleStatusChange}
          />

          <div className="mt-6 text-center">
            <button 
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-7-7m7 7l7-7" />
              </svg>
              Load More Days
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-between">
          <button 
            onClick={() => navigate('/review')}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg border-2 border-gray-300 dark:border-gray-600 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Review
          </button>
          <button 
            onClick={() => navigate('/summary')}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-bold"
          >
            View Summary
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
