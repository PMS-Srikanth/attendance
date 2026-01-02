import { apiClient } from './apiClient';
import { AttendanceRecord, AttendanceSummary, AttendanceWarning } from '@/types/attendance';
import { ApiResponse } from '@/types/api';
import { ParsedAttendanceRecord } from '@/utils/attendanceParser';

export const attendanceService = {
  // POST /attendance/generate - Generate class instances
  generateClasses: async (): Promise<ApiResponse<any>> => {
    return apiClient.post('/attendance/generate');
  },

  // GET /attendance/classes - Get all class instances
  getClasses: async (params?: {
    subject_code?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> => {
    return apiClient.get('/attendance/classes', params);
  },

  // GET /attendance/classes/{class_id} - Get a specific class instance
  getClassById: async (classId: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/attendance/classes/${classId}`);
  },

  // PATCH /attendance/classes/{class_id} - Update class instance status
  updateClassStatus: async (classId: string, status: string): Promise<ApiResponse<any>> => {
    return apiClient.patch(`/attendance/classes/${classId}`, { status });
  },

  // POST /attendance/classes/bulk-update - Bulk update class statuses
  bulkUpdateClasses: async (updates: Record<string, string>): Promise<ApiResponse<any>> => {
    return apiClient.post('/attendance/classes/bulk-update', updates);
  },

  // Upload attendance records from parsed file
  uploadAttendanceRecords: async (records: ParsedAttendanceRecord[]): Promise<ApiResponse<any>> => {
    try {
      // First, get all class instances
      const classesResponse = await attendanceService.getClasses();
      
      if (!classesResponse.success || !classesResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch class instances. Please generate classes first.',
        };
      }

      const classes = classesResponse.data;
      const updates: Record<string, string> = {};
      const notFound: string[] = [];

      // Match attendance records to class instances
      records.forEach(record => {
        // Find matching class by subject code and date
        const matchingClass = classes.find(
          (cls: any) => 
            cls.subject_code === record.subjectCode && 
            cls.date === record.date
        );

        if (matchingClass) {
          updates[matchingClass.id] = record.status;
        } else {
          notFound.push(`${record.subjectCode} on ${record.date}`);
        }
      });

      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          error: 'No matching classes found for the provided attendance records.',
          data: { notFound },
        };
      }

      // Bulk update the matched classes
      const updateResponse = await attendanceService.bulkUpdateClasses(updates);

      return {
        success: true,
        data: {
          updated: Object.keys(updates).length,
          total: records.length,
          notFound: notFound.length > 0 ? notFound : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload attendance records',
      };
    }
  },

  // GET /attendance/summary - Get attendance summary
  getAttendanceSummary: async (currentDate?: string): Promise<ApiResponse<any>> => {
    const params = currentDate ? { current_date: currentDate } : undefined;
    return apiClient.get('/attendance/summary', params);
  },

  // GET /attendance/warnings - Get attendance warnings
  getWarnings: async (currentDate?: string): Promise<ApiResponse<any>> => {
    const params = currentDate ? { current_date: currentDate } : undefined;
    return apiClient.get('/attendance/warnings', params);
  },

  // DELETE /attendance/classes - Clear all classes
  clearClasses: async (): Promise<ApiResponse<void>> => {
    return apiClient.delete('/attendance/classes');
  },
};
