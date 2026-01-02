import React from 'react';
import { AttendanceStatus } from '@/types/attendance';
import { getStatusColor, getStatusLabel } from '@/utils/statusUtils';

interface StatusSelectProps {
  currentStatus?: AttendanceStatus;
  isPast: boolean;
  onChange: (status: 'planned-present' | 'planned-absent') => void;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  currentStatus,
  isPast,
  onChange,
}) => {
  if (isPast) {
    return (
      <div className={`px-2 py-1 rounded text-xs text-center border ${getStatusColor(currentStatus || 'absent')}`}>
        {getStatusLabel(currentStatus || 'absent')}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('planned-present')}
        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
          currentStatus === 'planned-present'
            ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
            : 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border-emerald-500 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
        }`}
      >
        ✓ Present
      </button>
      <button
        onClick={() => onChange('planned-absent')}
        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
          currentStatus === 'planned-absent'
            ? 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-lg shadow-rose-500/30'
            : 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 border-rose-500 dark:border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
        }`}
      >
        ✗ Absent
      </button>
    </div>
  );
};
