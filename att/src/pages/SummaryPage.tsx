import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { SubjectCard } from '@/components/summary/SubjectCard';
import { AttendanceChart } from '@/components/summary/AttendanceChart';
import { SummaryTable } from '@/components/summary/SummaryTable';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { usePlannerStore } from '@/store/usePlannerStore';
import { useTimetableStore } from '@/store/useTimetableStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { AttendanceSummary, SubjectAttendance } from '@/types/attendance';
import { calculatePercentage } from '@/utils/statusUtils';
import { addDays, format, startOfDay } from 'date-fns';
import { getDayOfWeek } from '@/utils/dateUtils';
import { openAttendanceReportInNewTab } from '@/utils/reportWindow';
import {
  adjustCurrentAttendanceWithBaseline,
  ensureCurrentAttendanceBaseline,
  getCurrentAttendance,
  getCurrentAttendanceBaseline,
  setCurrentAttendanceBaseline,
  sanitizeCurrentAttendance,
  sanitizeCurrentAttendanceBaseline,
} from '@/utils/currentAttendance';
import type { CalendarData } from '@/types/calendar';
import type { TimetableData } from '@/types/timetable';

type SubjectAttendanceWithPlan = SubjectAttendance & {
  relatedSubjectCodes: string[];
  upcomingClasses14: number;
  minAttendNext14ToReach75: number;
  maxMissNext14AndStay75: number;
  classesToAttendToReach75: number;
  classesCanMissBeforeBelow75: number;
};

const THRESHOLD_PERCENT = 75;
const THRESHOLD = THRESHOLD_PERCENT / 100;
const PLAN_DAYS = 14;

function ceilPositive(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.ceil(n));
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function classesToAttendToReachThreshold(attended: number, total: number, threshold: number): number {
  if (total <= 0) return attended > 0 ? 0 : 1;
  // (a + x) / (t + x) >= threshold
  // x >= (threshold*t - a) / (1 - threshold)
  const needed = (threshold * total - attended) / (1 - threshold);
  return ceilPositive(needed);
}

function classesCanMissBeforeBelowThreshold(attended: number, total: number, threshold: number): number {
  if (total <= 0) return 0;
  // attended / (total + x) >= threshold  => x <= attended/threshold - total
  const max = Math.floor(attended / threshold - total);
  return Math.max(0, max);
}

function resolveAcademicDay(dateIso: string, calendar: CalendarData): TimetableData['entries'][number]['day'] | null {
  const dow = getDayOfWeek(dateIso);
  if (dow === 'Sunday') return null;

  const isHoliday = calendar.holidays.some((h) => h.date === dateIso);
  if (isHoliday) return null;

  if (dow === 'Saturday') {
    const override = calendar.saturdayOverrides.find((o) => o.date === dateIso);
    return override ? (override.followsDay as any) : null;
  }

  return dow as any;
}

function isHoliday(dateIso: string, calendar: CalendarData): boolean {
  return calendar.holidays.some((h) => h.date === dateIso);
}

function countUpcomingClasses(
  timetable: TimetableData,
  calendar: CalendarData,
  subjectCodes: string[],
  days: number
): number {
  const today = startOfDay(new Date());
  const end = addDays(today, days - 1);

  let count = 0;
  for (let d = today; d <= end; d = addDays(d, 1)) {
    const dateIso = format(d, 'yyyy-MM-dd');
    const academicDay = resolveAcademicDay(dateIso, calendar);
    if (!academicDay) continue;

    count += timetable.entries.filter(
      (e) => e.day === academicDay && subjectCodes.includes(e.subjectCode)
    ).length;
  }

  return count;
}


// Report export opens a new tab (no file download)

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { records } = useAttendanceStore();
  const { plannedRecords } = usePlannerStore();
  const { timetable } = useTimetableStore();
  const { calendar } = useCalendarStore();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [attendanceBump, setAttendanceBump] = useState(0);
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, { attended: number; total: number }>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Refresh immediately when current attendance is saved/changed elsewhere (e.g. Review page modal)
  useEffect(() => {
    const onChanged = () => {
      setPendingAdjustments({});
      // Preserve the transient "saved" toast when we change attendance in this tab.
      setSaveStatus((prev) => (prev === 'saved' ? 'saved' : 'idle'));
      setAttendanceBump((x) => x + 1);
    };

    window.addEventListener('currentAttendance:changed', onChanged as EventListener);
    return () => window.removeEventListener('currentAttendance:changed', onChanged as EventListener);
  }, []);

  const hasPending = useMemo(() => {
    return Object.values(pendingAdjustments).some((x) => (x.attended ?? 0) !== 0 || (x.total ?? 0) !== 0);
  }, [pendingAdjustments]);

  const getPendingForCode = (subjectCode: string): { attended: number; total: number } => {
    return pendingAdjustments[subjectCode] ?? { attended: 0, total: 0 };
  };

  const sumPendingForCodes = (codes: string[]) => {
    return codes.reduce(
      (acc, code) => {
        const p = getPendingForCode(code);
        return {
          attended: acc.attended + (p.attended ?? 0),
          total: acc.total + (p.total ?? 0),
        };
      },
      { attended: 0, total: 0 }
    );
  };

  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const t = window.setTimeout(() => setSaveStatus('idle'), 1500);
    return () => window.clearTimeout(t);
  }, [saveStatus]);

  const baselineMap = useMemo(() => {
    const map = new Map<string, { attended: number; total: number }>();
    getCurrentAttendanceBaseline().forEach((x) => {
      map.set(x.subjectCode, { attended: x.attended ?? 0, total: x.total ?? 0 });
    });
    return map;
  }, [attendanceBump]);

  const currentMap = useMemo(() => {
    const map = new Map<string, { attended: number; total: number }>();
    getCurrentAttendance().forEach((x) => {
      map.set(x.subjectCode, { attended: x.attended ?? 0, total: x.total ?? 0 });
    });
    return map;
  }, [attendanceBump]);

  useEffect(() => {
    if (!timetable) return;

    // Fix any previously-stored invalid values (e.g. attended > total) so % never exceeds 100.
    sanitizeCurrentAttendance();
    sanitizeCurrentAttendanceBaseline();

    // Load saved attendance (manual/current attendance) from storage
    const savedAttendance = getCurrentAttendance();
    const attendanceMap = new Map<string, { attended: number; total: number }>();
    savedAttendance.forEach((item) => {
      attendanceMap.set(item.subjectCode, { attended: item.attended, total: item.total });
    });

    // Calculate summary
    const subjectSummaries: SubjectAttendanceWithPlan[] = timetable.subjects
      .filter(subject => {
        const codeLower = subject.subjectCode.toLowerCase();
        const nameLower = subject.subjectName.toLowerCase();
        // Only exclude Library + Class Advisor. Keep Free Elective and everything else.
        return !codeLower.includes('library') &&
               !codeLower.includes('advisor') &&
               codeLower !== 'ca' &&
               !nameLower.includes('library') &&
               !nameLower.includes('class advisor');
      })
      .reduce((acc, subject) => {
        const subjectRecords = records.filter((r) => r.subjectCode === subject.subjectCode);
        const subjectPlanned = plannedRecords.filter((r) => r.subjectCode === subject.subjectCode);

        // Use saved attendance data if available, otherwise use records
        const savedData = attendanceMap.get(subject.subjectCode);
        
        let totalClasses = savedData ? savedData.total : subjectRecords.length;
        let attendedClasses = savedData ? savedData.attended : subjectRecords.filter(
          (r) => r.status === 'present' || r.status === 'planned-present'
        ).length;

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

        const displayName = subject.subjectName;

        const relatedSubjectCodes = [subject.subjectCode];

        const upcomingClasses14 = timetable && calendar
          ? countUpcomingClasses(timetable, calendar, relatedSubjectCodes, PLAN_DAYS)
          : 0;

        const classesToAttendToReach75 = classesToAttendToReachThreshold(attendedClasses, totalClasses, THRESHOLD);
        const classesCanMissBeforeBelow75 = classesCanMissBeforeBelowThreshold(attendedClasses, totalClasses, THRESHOLD);

        // In the next N classes (within next 14 days), how many must be attended to reach 75% by end of window
        const minAttendNext14ToReach75 = clampInt(
          Math.ceil(THRESHOLD * (totalClasses + upcomingClasses14) - attendedClasses),
          0,
          upcomingClasses14
        );

        // In the next N classes, how many can be missed (while attending the rest) and still stay >= 75%
        const maxMissNext14AndStay75 = clampInt(
          Math.floor(attendedClasses + upcomingClasses14 - THRESHOLD * (totalClasses + upcomingClasses14)),
          0,
          upcomingClasses14
        );

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
          relatedSubjectCodes,
          upcomingClasses14,
          minAttendNext14ToReach75,
          maxMissNext14AndStay75,
          classesToAttendToReach75,
          classesCanMissBeforeBelow75,
        });
        
        return acc;
      }, [] as SubjectAttendanceWithPlan[]);

    const totalClasses = subjectSummaries.reduce((sum, s) => sum + s.totalClasses, 0);
    const totalAttended = subjectSummaries.reduce((sum, s) => sum + s.attendedClasses, 0);
    const overallPercentage = calculatePercentage(totalAttended, totalClasses);

    setSummary({
      subjects: subjectSummaries,
      overallPercentage,
      totalClasses,
      totalAttended,
    });
  }, [records, plannedRecords, timetable, calendar, attendanceBump]);

  const reportSubjects = useMemo(() => {
    if (!summary) return [] as SubjectAttendanceWithPlan[];
    return summary.subjects as SubjectAttendanceWithPlan[];
  }, [summary]);

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
    if (!summary || !timetable) return;

    const generatedAt = new Date().toISOString();
    openAttendanceReportInNewTab({
      generatedAtIso: generatedAt,
      thresholdPercent: THRESHOLD_PERCENT,
      planDays: PLAN_DAYS,
      overallPercent: summary.overallPercentage,
      overallAttended: summary.totalAttended,
      overallTotal: summary.totalClasses,
      rows: reportSubjects.map((s) => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        attended: s.attendedClasses,
        total: s.totalClasses,
        currentPercent: s.currentPercentage,
        upcomingClasses: s.upcomingClasses14,
        minAttendNextDaysToReachThreshold: s.minAttendNext14ToReach75,
        maxMissNextDaysAndStayThreshold: s.maxMissNext14AndStay75,
        classesToAttendToReachThresholdOverall: s.classesToAttendToReach75,
        classesCanMissBeforeBelowThresholdOverall: s.classesCanMissBeforeBelow75,
      })),
    });
  };

  const handleQuickBump = (subjectCode: string, deltaAttended: number, deltaTotal: number) => {
    setPendingAdjustments((prev) => {
      const cur = prev[subjectCode] ?? { attended: 0, total: 0 };
      let attended = Math.trunc((cur.attended ?? 0) + deltaAttended);
      let total = Math.trunc((cur.total ?? 0) + deltaTotal);
      attended = Math.max(0, attended);
      total = Math.max(0, total);
      if (total < attended) total = attended;

      return { ...prev, [subjectCode]: { attended, total } };
    });
  };

  const handleQuickAdjustDown = (subjectCode: string, deltaAttended: number, deltaTotal: number) => {
    setPendingAdjustments((prev) => {
      const cur = prev[subjectCode] ?? { attended: 0, total: 0 };
      let attended = Math.trunc((cur.attended ?? 0) + deltaAttended);
      let total = Math.trunc((cur.total ?? 0) + deltaTotal);
      attended = Math.max(0, attended);
      total = Math.max(0, total);
      if (total < attended) total = attended;

      return { ...prev, [subjectCode]: { attended, total } };
    });
  };

  const handleSavePending = () => {
    if (!hasPending) return;

    ensureCurrentAttendanceBaseline();

    Object.entries(pendingAdjustments).forEach(([code, delta]) => {
      const deltaAttended = Math.trunc(delta.attended ?? 0);
      const deltaTotal = Math.trunc(delta.total ?? 0);
      if (deltaAttended === 0 && deltaTotal === 0) return;

      // Baseline-safe apply (also enforces total >= attended)
      adjustCurrentAttendanceWithBaseline(code, { attended: deltaAttended, total: deltaTotal });
    });

    // Lock in the saved values as the new baseline so "-1" cannot be used immediately after saving.
    setCurrentAttendanceBaseline(getCurrentAttendance());

    setPendingAdjustments({});
    setAttendanceBump((x) => x + 1);
    setSaveStatus('saved');
  };

  const handleClearPending = () => {
    setPendingAdjustments({});
  };

  const QuickBumpButton = (
    props: {
      subjectCodes: string[];
      deltaAttended: number;
      deltaTotal: number;
      className: string;
      label: string;
    }
  ) => {
    if (props.subjectCodes.length <= 1) {
      const code = props.subjectCodes[0];
      return (
        <button
          onClick={() => handleQuickBump(code, props.deltaAttended, props.deltaTotal)}
          className={props.className}
        >
          {props.label}
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-2 items-center">
        {props.subjectCodes.map((code) => (
          <button
            key={code}
            onClick={() => handleQuickBump(code, props.deltaAttended, props.deltaTotal)}
            className={props.className}
            title={code}
          >
            {code} {props.label}
          </button>
        ))}
      </div>
    );
  };

  const QuickDownButton = (
    props: {
      subjectCodes: string[];
      deltaAttended: number;
      deltaTotal: number;
      className: string;
      label: string;
      disabledFor: (subjectCode: string) => boolean;
    }
  ) => {
    if (props.subjectCodes.length <= 1) {
      const code = props.subjectCodes[0];
      const disabled = props.disabledFor(code);
      return (
        <button
          onClick={() => handleQuickAdjustDown(code, props.deltaAttended, props.deltaTotal)}
          disabled={disabled}
          className={`${props.className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {props.label}
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-2 items-center">
        {props.subjectCodes.map((code) => {
          const disabled = props.disabledFor(code);
          return (
            <button
              key={code}
              onClick={() => handleQuickAdjustDown(code, props.deltaAttended, props.deltaTotal)}
              disabled={disabled}
              className={`${props.className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={code}
            >
              {code} {props.label}
            </button>
          );
        })}
      </div>
    );
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
              View Report
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white animate-scale-in transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
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
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
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
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
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

        {/* Quick Daily Update */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Daily Update</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tap buttons to queue changes, then save once (reduces repeated localStorage writes).
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {hasPending ? (
                <span>
                  Pending changes: <span className="font-semibold">{Object.values(pendingAdjustments).filter((x) => (x.attended ?? 0) !== 0 || (x.total ?? 0) !== 0).length}</span>
                </span>
              ) : (
                <span>No pending changes</span>
              )}
              {saveStatus === 'saved' ? (
                <span className="ml-3 text-emerald-700 dark:text-emerald-300 font-semibold">Saved</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearPending}
                disabled={!hasPending}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                  hasPending
                    ? 'border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Clear
              </button>
              <button
                onClick={handleSavePending}
                disabled={!hasPending}
                className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition shadow ${
                  hasPending
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Save
              </button>
            </div>
          </div>

          {!calendar ? (
            <div className="mt-4 p-4 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700">
              Calendar not loaded — quick update still works, but the 14‑day plan metrics in the export may be incomplete.
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Now</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">- Present</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">+ Present</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">- Absent</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">+ Absent</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Next 14d</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800/20 divide-y divide-gray-200 dark:divide-gray-700">
                {reportSubjects.map((s) => (
                  <tr key={s.subjectCode}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.subjectCode}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{s.subjectName}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">
                      {(() => {
                        const pending = sumPendingForCodes(s.relatedSubjectCodes);
                        let nextAtt = (s.attendedClasses ?? 0) + pending.attended;
                        let nextTot = (s.totalClasses ?? 0) + pending.total;
                        if (nextTot < nextAtt) nextTot = nextAtt;
                        const pct = nextTot > 0 ? (nextAtt / nextTot) * 100 : 0;
                        return (
                          <>
                            {nextAtt}/{nextTot} ({pct.toFixed(1)}%)
                            {pending.attended !== 0 || pending.total !== 0 ? (
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                                pending {pending.attended >= 0 ? '+' : ''}{pending.attended}/{pending.total >= 0 ? '+' : ''}{pending.total}
                              </div>
                            ) : null}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <QuickDownButton
                        subjectCodes={s.relatedSubjectCodes}
                        deltaAttended={-1}
                        deltaTotal={-1}
                        label="-1"
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition"
                        disabledFor={(code) => {
                          const p = getPendingForCode(code);
                          // Only allow undo if a +Present was previously added for this subject.
                          return (p.attended ?? 0) <= 0;
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <QuickBumpButton
                        subjectCodes={s.relatedSubjectCodes}
                        deltaAttended={1}
                        deltaTotal={1}
                        label="+1"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <QuickDownButton
                        subjectCodes={s.relatedSubjectCodes}
                        deltaAttended={0}
                        deltaTotal={-1}
                        label="-1"
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition"
                        disabledFor={(code) => {
                          const p = getPendingForCode(code);
                          // Only allow undo if a +Absent was previously added for this subject.
                          // (+Absent adds total without attended, so pending.total > pending.attended)
                          return (p.total ?? 0) <= (p.attended ?? 0);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <QuickBumpButton
                        subjectCodes={s.relatedSubjectCodes}
                        deltaAttended={0}
                        deltaTotal={1}
                        label="+1"
                        className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                      {s.upcomingClasses14 === 0 ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">No classes detected</span>
                      ) : s.currentPercentage < THRESHOLD_PERCENT ? (
                        <span>
                          Attend <span className="font-bold">{s.minAttendNext14ToReach75}</span> / {s.upcomingClasses14} to reach {THRESHOLD_PERCENT}%
                        </span>
                      ) : (
                        <span>
                          Can miss <span className="font-bold">{s.maxMissNext14AndStay75}</span> / {s.upcomingClasses14} and stay ≥ {THRESHOLD_PERCENT}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
