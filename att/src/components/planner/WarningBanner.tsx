import React from 'react';
import { AttendanceWarning } from '@/types/attendance';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface WarningBannerProps {
  warnings: AttendanceWarning[];
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: AttendanceWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="text-rose-600 dark:text-rose-400" size={20} />;
      case 'warning':
        return <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />;
      case 'info':
        return <Info className="text-sky-600 dark:text-sky-400" size={20} />;
    }
  };

  const getSeverityColor = (severity: AttendanceWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800';
      case 'info':
        return 'bg-sky-50 border-sky-200 dark:bg-sky-900/10 dark:border-sky-800';
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-4 border rounded-lg ${getSeverityColor(warning.severity)}`}
        >
          {getSeverityIcon(warning.severity)}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{warning.subjectName}</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{warning.message}</p>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Current: {warning.currentPercentage.toFixed(1)}% → Projected:{' '}
              {warning.projectedPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
