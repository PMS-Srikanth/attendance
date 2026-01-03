import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { SubjectCard } from '@/components/summary/SubjectCard';
import { AttendanceChart } from '@/components/summary/AttendanceChart';
import { SummaryTable } from '@/components/summary/SummaryTable';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { usePlannerStore } from '@/store/usePlannerStore';
import { useTimetableStore } from '@/store/useTimetableStore';
import { AttendanceSummary, SubjectAttendance } from '@/types/attendance';
import { calculatePercentage } from '@/utils/statusUtils';
import { userLocalStorage } from '@/utils/userStorage';

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { records } = useAttendanceStore();
  const { plannedRecords } = usePlannerStore();
  const { timetable } = useTimetableStore();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);

  useEffect(() => {
    if (!timetable) return;

    // Load saved attendance from localStorage
    const savedAttendance = userLocalStorage.getItem('currentAttendance');
    const attendanceMap = new Map<string, { attended: number; total: number }>();
    
    if (savedAttendance) {
      try {
        const parsed = JSON.parse(savedAttendance);
        parsed.forEach((item: any) => {
          attendanceMap.set(item.subjectCode, {
            attended: item.attended,
            total: item.total
          });
        });
      } catch (error) {
        console.error('Failed to parse saved attendance:', error);
      }
    }

    // Calculate summary
    const subjectSummaries: SubjectAttendance[] = timetable.subjects
      .filter(subject => {
        const codeLower = subject.subjectCode.toLowerCase();
        const nameLower = subject.subjectName.toLowerCase();
        return !codeLower.includes('library') && 
               !codeLower.includes('advisor') &&
               !codeLower.includes('sports') &&
               codeLower !== 'ca' &&
               !nameLower.includes('library') &&
               !nameLower.includes('class advisor') &&
               !nameLower.includes('sports');
      })
      .reduce((acc, subject) => {
        // Skip lab subjects - they will be merged with their theory counterparts
        if (subject.subjectName.toLowerCase().includes('lab') || /\(lab\s*\d*\)/i.test(subject.subjectName)) {
          // Check if there's a theory subject for this lab in the original list
          const theoryName = subject.subjectName.replace(/\s*\(lab\s*\d*\)/gi, '').replace(/\s*lab\s*/gi, '').trim().toLowerCase();
          const hasTheory = timetable.subjects.some(s => {
            const sCodeLower = s.subjectCode.toLowerCase();
            const sNameLower = s.subjectName.toLowerCase();
            return !sCodeLower.includes('library') &&
                   !sCodeLower.includes('advisor') &&
                   !sCodeLower.includes('sports') &&
                   sCodeLower !== 'ca' &&
                   !sNameLower.includes('library') &&
                   !sNameLower.includes('class advisor') &&
                   !sNameLower.includes('sports') &&
                   !sNameLower.includes('lab') &&
                   sNameLower.includes(theoryName);
          });
          if (hasTheory) return acc; // Skip this lab, it will be merged with theory
        }

        const subjectRecords = records.filter((r) => r.subjectCode === subject.subjectCode);
        const subjectPlanned = plannedRecords.filter((r) => r.subjectCode === subject.subjectCode);

        // Use saved attendance data if available, otherwise use records
        const savedData = attendanceMap.get(subject.subjectCode);
        
        // If this is a theory subject with a lab, combine the attendance
        let totalClasses = savedData ? savedData.total : subjectRecords.length;
        let attendedClasses = savedData ? savedData.attended : subjectRecords.filter(
          (r) => r.status === 'present' || r.status === 'planned-present'
        ).length;
        
        // Check for corresponding lab subject
        const labSubject = timetable.subjects.find(s => {
          const baseName = s.subjectName.replace(/\s*\(lab\s*\d*\)/gi, '').replace(/\s*lab\s*/gi, '').trim().toLowerCase();
          const thisBaseName = subject.subjectName.toLowerCase();
          return (s.subjectName.toLowerCase().includes('lab') || /\(lab\s*\d*\)/i.test(s.subjectName)) &&
                 thisBaseName.includes(baseName) &&
                 s.subjectCode !== subject.subjectCode;
        });
        
        if (labSubject) {
          // Add lab attendance to theory
          const labSavedData = attendanceMap.get(labSubject.subjectCode);
          if (labSavedData) {
            totalClasses += labSavedData.total;
            attendedClasses += labSavedData.attended;
          }
        }

        const plannedPresentClasses = subjectPlanned.filter(
          (r) => r.status === 'planned-present'
        ).length;
        const plannedAbsentClasses = subjectPlanned.filter(
          (r) => r.status === 'planned-absent'
        ).length;

        const currentPercentage = calculatePercentage(attendedClasses, totalClasses);
        const projectedAttended = attendedClasses + plannedPresentClasses;
        const projectedTotal = totalClasses + plannedPresentClasses + plannedAbsentClasses;
        const projectedPercentage = calculatePercentage(projectedAttended, projectedTotal);

        // Display with "(includes Lab)" if it has a lab component
        const displayName = labSubject ? `${subject.subjectName} (includes Lab)` : subject.subjectName;

        acc.push({
          subjectCode: subject.subjectCode,
          subjectName: displayName,
          totalClasses,
          attendedClasses,
          plannedPresentClasses,
          plannedAbsentClasses,
          currentPercentage,
          projectedPercentage,
          isBelowThreshold: currentPercentage < 75,
          willBeBelowThreshold: projectedPercentage < 75,
        });
        
        return acc;
      }, [] as SubjectAttendance[]);

    const totalClasses = subjectSummaries.reduce((sum, s) => sum + s.totalClasses, 0);
    const totalAttended = subjectSummaries.reduce((sum, s) => sum + s.attendedClasses, 0);
    const overallPercentage = calculatePercentage(totalAttended, totalClasses);

    setSummary({
      subjects: subjectSummaries,
      overallPercentage,
      totalClasses,
      totalAttended,
    });
  }, [records, plannedRecords, timetable]);

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No data found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please complete the planner first</p>
          <Button onClick={() => navigate('/')}>Go to Upload</Button>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    // Export functionality would call the API here
    alert('Export functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="mb-8 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl shadow-xl mb-4 animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Attendance Summary
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Overview of your current and projected attendance
              </p>
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Download size={20} />
              Export Report
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white animate-scale-in transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Overall Attendance</h3>
            </div>
            <p className="text-5xl font-bold mb-2">
              {summary.overallPercentage.toFixed(1)}%
            </p>
            <p className="text-indigo-100">
              {summary.totalAttended} / {summary.totalClasses} classes attended
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white animate-scale-in transform hover:scale-105 transition-transform" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Subjects Above 75%</h3>
            </div>
            <p className="text-5xl font-bold mb-2">
              {summary.subjects.filter((s) => !s.isBelowThreshold).length}
            </p>
            <p className="text-emerald-100">
              out of {summary.subjects.length} subjects
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl shadow-2xl p-8 text-white animate-scale-in transform hover:scale-105 transition-transform" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">At Risk</h3>
            </div>
            <p className="text-5xl font-bold mb-2">
              {summary.subjects.filter((s) => s.willBeBelowThreshold).length}
            </p>
            <p className="text-red-100">subjects need attention</p>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-8">
          <AttendanceChart subjects={summary.subjects} />
        </div>

        {/* Subject Cards */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subject-wise Breakdown</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summary.subjects.map((subject) => (
              <SubjectCard key={subject.subjectCode} subject={subject} />
            ))}
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detailed Summary</h2>
          </div>
          <SummaryTable subjects={summary.subjects} />
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-between">
          <button 
            onClick={() => navigate('/planner')}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg border-2 border-gray-300 dark:border-gray-600 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Planner
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white rounded-xl hover:from-teal-700 hover:via-cyan-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-bold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
};
