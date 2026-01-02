import { useEffect, useState } from 'react';
import { AttendanceWarning } from '@/types/attendance';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { usePlannerStore } from '@/store/usePlannerStore';
import { calculatePercentage } from '@/utils/statusUtils';

export const usePlannerWarnings = () => {
  const { records, summary } = useAttendanceStore();
  const { plannedRecords, setWarnings } = usePlannerStore();
  const [warnings, setLocalWarnings] = useState<AttendanceWarning[]>([]);

  useEffect(() => {
    if (!summary) return;

    const newWarnings: AttendanceWarning[] = [];
    const THRESHOLD = 75;

    summary.subjects.forEach((subject) => {
      // Calculate with planned records
      const subjectPlanned = plannedRecords.filter(
        (r) => r.subjectCode === subject.subjectCode
      );
      
      const plannedPresent = subjectPlanned.filter(
        (r) => r.status === 'planned-present'
      ).length;
      
      const plannedAbsent = subjectPlanned.filter(
        (r) => r.status === 'planned-absent'
      ).length;

      const projectedAttended = subject.attendedClasses + plannedPresent;
      const projectedTotal = subject.totalClasses + plannedPresent + plannedAbsent;
      const projectedPercentage = calculatePercentage(projectedAttended, projectedTotal);

      // Check if projected percentage falls below threshold
      if (projectedPercentage < THRESHOLD) {
        const severity: 'critical' | 'warning' | 'info' =
          projectedPercentage < THRESHOLD - 10
            ? 'critical'
            : projectedPercentage < THRESHOLD - 5
            ? 'warning'
            : 'info';

        newWarnings.push({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          currentPercentage: subject.currentPercentage,
          projectedPercentage,
          message: `Projected attendance (${projectedPercentage.toFixed(1)}%) will fall below ${THRESHOLD}%`,
          severity,
        });
      } else if (
        subject.currentPercentage >= THRESHOLD &&
        projectedPercentage < THRESHOLD + 5
      ) {
        // Warning if getting close to threshold
        newWarnings.push({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          currentPercentage: subject.currentPercentage,
          projectedPercentage,
          message: `Projected attendance (${projectedPercentage.toFixed(1)}%) is close to ${THRESHOLD}% threshold`,
          severity: 'info',
        });
      }
    });

    setLocalWarnings(newWarnings);
    setWarnings(newWarnings);
  }, [records, plannedRecords, summary, setWarnings]);

  return warnings;
};
