import React, { useState } from 'react';
import { Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendarStore } from '@/store/useCalendarStore';
import { Holiday, SaturdayOverride } from '@/types/calendar';

export const CalendarManagement: React.FC = () => {
  const { calendar, addHoliday, removeHoliday, addSaturdayOverride, removeSaturdayOverride } = useCalendarStore();
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [showSaturdayForm, setShowSaturdayForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'other' as const });
  const [newSaturday, setNewSaturday] = useState({ date: '', followsDay: 'Monday' as const });

  if (!calendar) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-yellow-800 dark:text-yellow-200 font-medium">
            Calendar data not found. Please go to Upload page and upload your timetable and calendar files first.
          </p>
        </div>
      </div>
    );
  }

  // Filter out past dates (keep today and future dates)
  // Get today's date in YYYY-MM-DD format for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // Calculate max date (5 years from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  
  const upcomingHolidays = calendar.holidays.filter((h) => h.date >= todayStr);
  const upcomingSaturdays = calendar.saturdayOverrides.filter((s) => s.date >= todayStr);

  const handleAddHoliday = () => {
    if (newHoliday.date && newHoliday.name) {
      addHoliday(newHoliday);
      setNewHoliday({ date: '', name: '', type: 'other' });
      setShowHolidayForm(false);
    }
  };

  const handleAddSaturday = () => {
    if (newSaturday.date) {
      addSaturdayOverride(newSaturday);
      setNewSaturday({ date: '', followsDay: 'Monday' });
      setShowSaturdayForm(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      {/* Holidays Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
              <CalendarIcon size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Holidays</h3>
          </div>
          <button
            onClick={() => setShowHolidayForm(!showHolidayForm)}
            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {showHolidayForm && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              min={todayStr}
              max={maxDateStr}
            />
            <input
              type="text"
              placeholder="Holiday name"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <select
              value={newHoliday.type}
              onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="national">National Holiday</option>
              <option value="college">College Holiday</option>
              <option value="exam">Exam Day</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddHoliday}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Add Holiday
              </button>
              <button
                onClick={() => setShowHolidayForm(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {upcomingHolidays.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No upcoming holidays</p>
          ) : (
            upcomingHolidays.map((holiday) => (
              <div
                key={holiday.date}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{holiday.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(holiday.date).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => removeHoliday(holiday.date)}
                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Saturday Overrides Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <CalendarIcon size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Saturday Working Days</h3>
          </div>
          <button
            onClick={() => setShowSaturdayForm(!showSaturdayForm)}
            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {showSaturdayForm && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <input
              type="date"
              value={newSaturday.date}
              onChange={(e) => setNewSaturday({ ...newSaturday, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              min={todayStr}
              max={maxDateStr}
            />
            <select
              value={newSaturday.followsDay}
              onChange={(e) => setNewSaturday({ ...newSaturday, followsDay: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="Monday">Follows Monday</option>
              <option value="Tuesday">Follows Tuesday</option>
              <option value="Wednesday">Follows Wednesday</option>
              <option value="Thursday">Follows Thursday</option>
              <option value="Friday">Follows Friday</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddSaturday}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Add Saturday
              </button>
              <button
                onClick={() => setShowSaturdayForm(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {upcomingSaturdays.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No upcoming Saturday working days</p>
          ) : (
            upcomingSaturdays.map((override) => (
              <div
                key={override.date}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Follows {override.followsDay} Timetable
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(override.date).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => removeSaturdayOverride(override.date)}
                  className="p-1 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
