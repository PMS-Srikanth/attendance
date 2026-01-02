import React from 'react';
import { CalendarRow } from './CalendarRow';
import { Holiday, SaturdayOverride } from '@/types/calendar';

interface CalendarListProps {
  holidays: Holiday[];
  saturdayOverrides: SaturdayOverride[];
  onRemoveHoliday?: (date: string) => void;
  onRemoveOverride?: (date: string) => void;
}

export const CalendarList: React.FC<CalendarListProps> = ({
  holidays,
  saturdayOverrides,
  onRemoveHoliday,
  onRemoveOverride,
}) => {
  return (
    <div className="space-y-6">
      {/* Holidays Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Holidays</h3>
        {holidays.length === 0 ? (
          <p className="text-gray-500 text-sm">No holidays added yet.</p>
        ) : (
          <div className="space-y-2">
            {holidays.map((holiday) => (
              <CalendarRow
                key={holiday.date}
                date={holiday.date}
                label={holiday.name}
                type={holiday.type}
                onRemove={onRemoveHoliday}
              />
            ))}
          </div>
        )}
      </div>

      {/* Saturday Overrides Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Saturday Working Days</h3>
        {saturdayOverrides.length === 0 ? (
          <p className="text-gray-500 text-sm">No Saturday overrides added yet.</p>
        ) : (
          <div className="space-y-2">
            {saturdayOverrides.map((override) => (
              <CalendarRow
                key={override.date}
                date={override.date}
                label={`Follows ${override.followsDay} timetable`}
                type="override"
                onRemove={onRemoveOverride}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
