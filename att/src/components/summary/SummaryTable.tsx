import React from 'react';
import { SubjectAttendance } from '@/types/attendance';
import { getPercentageColor } from '@/utils/statusUtils';

interface SummaryTableProps {
  subjects: SubjectAttendance[];
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ subjects }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attended
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current %
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Planned +/-
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Projected %
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {subjects.map((subject) => (
            <tr key={subject.subjectCode}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{subject.subjectCode}</div>
                <div className="text-xs text-gray-500">{subject.subjectName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                {subject.attendedClasses}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                {subject.totalClasses}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`text-sm font-semibold ${getPercentageColor(subject.currentPercentage)}`}>
                  {subject.currentPercentage.toFixed(1)}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                {subject.plannedPresentClasses > 0 && (
                  <span className="text-blue-600">+{subject.plannedPresentClasses}</span>
                )}
                {subject.plannedPresentClasses > 0 && subject.plannedAbsentClasses > 0 && ' / '}
                {subject.plannedAbsentClasses > 0 && (
                  <span className="text-orange-600">-{subject.plannedAbsentClasses}</span>
                )}
                {subject.plannedPresentClasses === 0 && subject.plannedAbsentClasses === 0 && '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`text-sm font-semibold ${getPercentageColor(subject.projectedPercentage)}`}>
                  {subject.projectedPercentage.toFixed(1)}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {subject.willBeBelowThreshold ? (
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                    At Risk
                  </span>
                ) : subject.isBelowThreshold ? (
                  <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                    Below
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Good
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
