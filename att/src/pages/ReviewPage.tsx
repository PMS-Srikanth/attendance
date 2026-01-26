import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { ManualAttendanceForm } from '@/components/attendance/ManualAttendanceForm';
import { Modal } from '@/components/common/Modal';
import { useTimetableStore } from '@/store/useTimetableStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { Holiday, SaturdayOverride } from '@/types/calendar';
import { format } from 'date-fns';
import { attendanceService } from '@/services/attendanceService';
import { userLocalStorage } from '@/utils/userStorage';

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { timetable, moveEntry } = useTimetableStore();
  const { calendar } = useCalendarStore();
  const { records } = useAttendanceStore();
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  const [isTimetableEditMode, setIsTimetableEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: string; slotNumber: number } | null>(null);
  const [editHint, setEditHint] = useState<string | null>(null);
  
  // Load metadata from localStorage
  const [metadata, setMetadata] = useState<any>(null);
  
  useEffect(() => {
    const storedMetadata = userLocalStorage.getItem('timetableMetadata');
    if (storedMetadata) {
      try {
        setMetadata(JSON.parse(storedMetadata));
      } catch (error) {
        console.error('Failed to parse metadata:', error);
      }
    }
  }, []);

  if (!timetable || !calendar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No data found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Timetable: {timetable ? 'Found' : 'Missing'} | Calendar: {calendar ? 'Found' : 'Missing'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Please upload your files first or check console for errors
          </p>
          <Button onClick={() => navigate('/')}>Go to Upload</Button>
        </div>
      </div>
    );
  }

  const handleAttendanceSaved = () => {
    setIsAttendanceModalOpen(false);
  };

  const handleContinue = () => {
    navigate('/planner');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-blue-900/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="mb-8 animate-slide-down">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-2xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                Review Your Data
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 mt-1">
                Verify timetable, add holidays & enter attendance
              </p>
            </div>
          </div>
        </div>

        {/* Metadata Section - If available */}
        {metadata && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-slide-up">
            {/* Class Info */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">Class Information</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm opacity-90">Department: <strong>{metadata.department}</strong></p>
                <p className="text-sm opacity-90">Class: <strong>{metadata.class}</strong></p>
                <p className="text-sm opacity-90">Semester: <strong>{metadata.semester}</strong></p>
                <p className="text-sm opacity-90">Classroom: <strong>{metadata.classroom}</strong></p>
              </div>
            </div>

            {/* Credits Info */}
            {metadata.totalCredits && (
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Credits Overview</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm opacity-90">Lecture: <strong>{metadata.totalCredits.lecture}</strong></p>
                  <p className="text-sm opacity-90">Tutorial: <strong>{metadata.totalCredits.tutorial}</strong></p>
                  <p className="text-sm opacity-90">Practical: <strong>{metadata.totalCredits.practical}</strong></p>
                  <p className="text-lg font-bold mt-3">Total: {metadata.totalCredits.totalCredits} credits</p>
                </div>
              </div>
            )}

            {/* Class Advisors */}
            {metadata.classAdvisors && metadata.classAdvisors.length > 0 && (
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl shadow-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Class Advisors</h3>
                </div>
                <div className="space-y-3">
                  {metadata.classAdvisors.map((advisor: any, idx: number) => (
                    <div key={idx} className="text-sm opacity-90">
                      <p className="font-bold">{advisor.name}</p>
                      <p className="text-xs">📧 {advisor.email}</p>
                      <p className="text-xs">📱 {advisor.mobile}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Course Details Section - If available */}
        {metadata && metadata.courses && metadata.courses.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 mb-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metadata.courses.map((course: any, idx: number) => (
                <div key={idx} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{course.code}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{course.name}</p>
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg text-xs font-bold">
                      {course.credits} Credits
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Structure:</span> {course.structure}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Faculty:</span> {course.faculty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timetable Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 mb-6 animate-slide-up hover:shadow-3xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Timetable</h2>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg text-sm font-semibold">
              {timetable.subjects.length} subjects • {timetable.timeSlots.length} slots
            </div>
          </div>
          <TimetableGrid 
            entries={timetable.entries} 
            timeSlots={timetable.timeSlots}
            attendanceRecords={records}
            editMode={isTimetableEditMode}
            selectedCell={selectedCell}
            onCellClick={({ day, slotNumber, entry, rowSpan }) => {
              if (!isTimetableEditMode) return;

              if (entry?.isLab && rowSpan > 1) {
                setEditHint('Lab blocks can’t be moved yet. Please move single-period classes only.');
                setSelectedCell(null);
                return;
              }

              // First click: pick a class
              if (!selectedCell) {
                if (!entry) return;
                setSelectedCell({ day, slotNumber });
                setEditHint('Selected. Now click a destination slot to move (swaps if occupied).');
                return;
              }

              // Second click: drop to destination (or cancel)
              if (selectedCell.day === day && selectedCell.slotNumber === slotNumber) {
                setSelectedCell(null);
                setEditHint(null);
                return;
              }

              const res = moveEntry(
                { day: selectedCell.day as any, slotNumber: selectedCell.slotNumber },
                { day: day as any, slotNumber }
              );

              if (!res?.moved) {
                setEditHint('Nothing moved. Try selecting a class cell first.');
              } else {
                setEditHint(res.swapped ? 'Moved (swapped with existing class).' : 'Moved to empty slot.');
              }
              setSelectedCell(null);
            }}
          />

          {/* Manual rescheduling */}
          <div className="mt-6 p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Manual timetable rescheduling</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Turn on edit mode, click a class to select it, then click another slot to place it. If the destination already has a class, we swap.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {isTimetableEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCell(null);
                        setEditHint(null);
                      }}
                    >
                      Cancel selection
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setIsTimetableEditMode(false);
                        setSelectedCell(null);
                        setEditHint(null);
                      }}
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsTimetableEditMode(true);
                      setEditHint('Edit mode on. Click a class cell to select it.');
                    }}
                  >
                    Enable edit mode
                  </Button>
                )}
              </div>
            </div>

            {editHint && (
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">{editHint}</p>
            )}
          </div>
        </div>

        {/* Current Attendance Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 mb-6 animate-slide-up hover:shadow-3xl transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Current Attendance</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add your existing attendance records before planning future classes
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Optional:</strong> If you have past attendance records, add them here. 
                This helps calculate your current attendance percentage accurately.
              </p>
            </div>
          </div>

          <button 
            onClick={() => {
              setIsAttendanceModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Current Attendance
          </button>
        </div>
        
        {/* Actions */}
        <div className="flex gap-4 justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg border-2 border-gray-300 dark:border-gray-600 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Upload
          </button>
          <button 
            onClick={handleContinue}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-bold"
          >
            Continue to Planner
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Current Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Add Current Attendance"
      >
        <ManualAttendanceForm 
          subjects={timetable.subjects} 
          onSave={handleAttendanceSaved}
        />
      </Modal>
    </div>
  );
};
