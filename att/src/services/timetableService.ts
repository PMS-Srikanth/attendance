import { apiClient } from './apiClient';
import { TimetableData } from '@/types/timetable';
import { ApiResponse } from '@/types/api';

export const timetableService = {
  // POST /timetable/ - Upload and validate timetable
  uploadTimetable: async (data: {
    days: Record<string, Array<{
      time_slot: string;
      subject_code: string;
      subject_name: string;
      room?: string;
      instructor?: string;
    }>>;
  }): Promise<ApiResponse<any>> => {
    // Transform to backend expected format
    const schedule = Object.entries(data.days)
      .filter(([_, classes]) => classes.length > 0) // Skip empty days
      .map(([day, classes]) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(), // Capitalize: monday -> Monday
        classes: classes
          .filter(c => c.subject_code && c.subject_name && c.time_slot)
          .map((c) => {
            // Parse time from "HH:MM AM/PM - HH:MM AM/PM" to "HH:MM" format
            const parseTime = (timeStr: string): { start_time: string; end_time: string } => {
              try {
                const parts = timeStr.split(' - ');
                if (parts.length !== 2) {
                  throw new Error(`Invalid time format: ${timeStr}`);
                }
                
                const convertTo24Hour = (time12h: string): string => {
                  const trimmed = time12h.trim();
                  const parts = trimmed.split(' ');
                  if (parts.length !== 2) {
                    throw new Error(`Invalid time part: ${time12h}`);
                  }
                  
                  const [time, period] = parts;
                  const [hoursStr, minutesStr] = time.split(':');
                  let hours = parseInt(hoursStr, 10);
                  const minutes = parseInt(minutesStr, 10);
                  
                  if (isNaN(hours) || isNaN(minutes)) {
                    throw new Error(`Invalid time numbers: ${time12h}`);
                  }
                  
                  if (period.toUpperCase() === 'PM' && hours !== 12) {
                    hours += 12;
                  } else if (period.toUpperCase() === 'AM' && hours === 12) {
                    hours = 0;
                  }
                  
                  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                };
                
                return {
                  start_time: convertTo24Hour(parts[0]),
                  end_time: convertTo24Hour(parts[1])
                };
              } catch (err) {
                console.error('Time parsing error:', err, 'for:', timeStr);
                throw err;
              }
            };
            
            const timeSlot = parseTime(c.time_slot);
            
            return {
              subject_code: c.subject_code,
              subject_name: c.subject_name,
              time_slot: timeSlot,
              room: c.room || null,
              instructor: c.instructor || null
            };
          })
      }));
    
    if (import.meta.env.DEV) {
      console.log('Sending to backend:', JSON.stringify({ schedule }, null, 2));
    }
    return apiClient.post('/timetable/', { schedule });
  },

  // GET /timetable/ - Get current timetable
  getTimetable: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/timetable/');
  },

  // GET /timetable/subjects - Get subject information
  getSubjects: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/timetable/subjects');
  },

  // DELETE /timetable/ - Clear timetable
  deleteTimetable: async (): Promise<ApiResponse<void>> => {
    return apiClient.delete('/timetable/');
  },
};
