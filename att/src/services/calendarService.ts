import { apiClient } from './apiClient';
import { CalendarData, Holiday, SaturdayOverride } from '@/types/calendar';
import { ApiResponse } from '@/types/api';

export const calendarService = {
  // POST /calendar/ - Upload and process academic calendar
  uploadCalendar: async (data: {
    semester_start: string;
    semester_end: string;
    holidays: Array<{ date: string; name: string }>;
    saturday_overrides: Array<{ date: string; override_type: string }>;
  }): Promise<ApiResponse<any>> => {
    return apiClient.post('/calendar/', data);
  },

  // GET /calendar/ - Get current calendar
  getCalendar: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/calendar/');
  },

  // GET /calendar/summary - Get calendar summary statistics
  getCalendarSummary: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/calendar/summary');
  },

  // DELETE /calendar/ - Clear calendar
  deleteCalendar: async (): Promise<ApiResponse<void>> => {
    return apiClient.delete('/calendar/');
  },
};
