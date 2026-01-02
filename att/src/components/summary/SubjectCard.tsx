import React from 'react';
import { SubjectAttendance } from '@/types/attendance';
import { getPercentageColor, getPercentageBgColor } from '@/utils/statusUtils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SubjectCardProps {
  subject: SubjectAttendance;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const getTrendIcon = () => {
    if (subject.projectedPercentage > subject.currentPercentage) {
      return <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} />;
    } else if (subject.projectedPercentage < subject.currentPercentage) {
      return <TrendingDown className="text-rose-600 dark:text-rose-400" size={20} />;
    } else {
      return <Minus className="text-gray-600 dark:text-gray-400" size={20} />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getPercentageBgColor(subject.currentPercentage)}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{subject.subjectCode}</h3>
          <p className="text-sm text-gray-600">{subject.subjectName}</p>
        </div>
        {getTrendIcon()}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current Attendance:</span>
          <span className={`font-semibold ${getPercentageColor(subject.currentPercentage)}`}>
            {subject.currentPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Attended / Total:</span>
          <span className="font-medium">
            {subject.attendedClasses} / {subject.totalClasses}
          </span>
        </div>

        {(subject.plannedPresentClasses > 0 || subject.plannedAbsentClasses > 0) && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Planned Present:</span>
              <span className="font-medium text-sky-600 dark:text-sky-400">+{subject.plannedPresentClasses}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Planned Absent:</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">-{subject.plannedAbsentClasses}</span>
            </div>

            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-gray-600">Projected Attendance:</span>
              <span className={`font-semibold ${getPercentageColor(subject.projectedPercentage)}`}>
                {subject.projectedPercentage.toFixed(1)}%
              </span>
            </div>
          </>
        )}

        {subject.isBelowThreshold && (
          <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
            ⚠ Below 75% threshold
          </div>
        )}

        {subject.willBeBelowThreshold && !subject.isBelowThreshold && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            ⚠ Will fall below 75% with current plan
          </div>
        )}
      </div>
    </div>
  );
};
