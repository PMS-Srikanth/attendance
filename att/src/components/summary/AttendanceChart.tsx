import React from 'react';
import { SubjectAttendance } from '@/types/attendance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface AttendanceChartProps {
  subjects: SubjectAttendance[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ subjects }) => {
  const data = subjects.map((subject) => ({
    name: subject.subjectCode,
    current: subject.currentPercentage,
    projected: subject.projectedPercentage,
  }));

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Legend />
          <ReferenceLine y={75} stroke="red" strokeDasharray="3 3" label="75% Threshold" />
          <Bar dataKey="current" fill="#0ea5e9" name="Current" />
          <Bar dataKey="projected" fill="#8b5cf6" name="Projected" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
