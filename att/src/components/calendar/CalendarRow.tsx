import React from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface CalendarRowProps {
  date: string;
  label: string;
  type: string;
  onRemove?: (date: string) => void;
}

export const CalendarRow: React.FC<CalendarRowProps> = ({ date, label, type, onRemove }) => {
  const typeColors: Record<string, string> = {
    national: 'bg-red-100 text-red-800',
    college: 'bg-blue-100 text-blue-800',
    exam: 'bg-orange-100 text-orange-800',
    override: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">
            {format(new Date(date), 'MMM dd, yyyy (EEEE)')}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${typeColors[type] || typeColors.other}`}>
            {type}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{label}</p>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(date)}
          className="ml-3 text-red-600 hover:text-red-800 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
};
