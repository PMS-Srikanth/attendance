import React from 'react';

interface DayHeaderProps {
  day: string;
}

export const DayHeader: React.FC<DayHeaderProps> = ({ day }) => {
  return (
    <th className="border border-gray-300 bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-900">
      {day}
    </th>
  );
};
