import React, { useState } from 'react';
import { SaturdayOverride } from '@/types/calendar';
import { Button } from '../common/Button';
import { Select } from '../common/Select';

interface SaturdayOverrideFormProps {
  onAdd: (override: SaturdayOverride) => void;
}

const DAY_OPTIONS = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
];

export const SaturdayOverrideForm: React.FC<SaturdayOverrideFormProps> = ({ onAdd }) => {
  const [date, setDate] = useState('');
  const [followsDay, setFollowsDay] = useState<string>('Monday');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date) {
      onAdd({
        date,
        followsDay: followsDay as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday',
      });
      setDate('');
      setFollowsDay('Monday');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-200 dark:text-gray-200 mb-1">
          Saturday Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
          required
        />
      </div>
      <Select
        label="Follows Day"
        options={DAY_OPTIONS}
        value={followsDay}
        onChange={(e) => setFollowsDay(e.target.value)}
      />
      <Button type="submit" variant="primary" className="w-full">
        Add Saturday Override
      </Button>
    </form>
  );
};
