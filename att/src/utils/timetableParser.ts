/**
 * Parse timetable from JSON file
 */
export interface ParsedTimetableClass {
  subject_code: string;
  subject_name: string;
  time_slot: {
    start_time: string;
    end_time: string;
  };
  room?: string;
  instructor?: string;
}

export interface ParsedTimetableDay {
  day: string;
  classes: ParsedTimetableClass[];
}

export interface ParsedTimetable {
  schedule: ParsedTimetableDay[];
}

export const parseTimetableFile = async (file: File): Promise<{
  success: boolean;
  data?: ParsedTimetable;
  error?: string;
}> => {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'json') {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      // Validate structure
      if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
        return {
          success: false,
          error: 'Invalid JSON format: missing "schedule" array'
        };
      }

      return {
        success: true,
        data: parsed
      };
    } else {
      return {
        success: false,
        error: 'Only JSON format is supported. Please upload a JSON file.'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse timetable file'
    };
  }
};

/**
 * Create a sample timetable template
 */
export const getSampleTimetable = (): ParsedTimetable => {
  return {
    schedule: [
      {
        day: 'Monday',
        classes: [
          {
            subject_code: 'CSE101',
            subject_name: 'Data Structures',
            time_slot: { start_time: '09:00', end_time: '10:00' },
            room: 'A101',
            instructor: 'Dr. Smith'
          },
          {
            subject_code: 'CSE102',
            subject_name: 'Algorithms',
            time_slot: { start_time: '10:00', end_time: '11:00' },
            room: 'A102',
            instructor: 'Dr. Johnson'
          }
        ]
      },
      {
        day: 'Tuesday',
        classes: [
          {
            subject_code: 'CSE103',
            subject_name: 'Database Systems',
            time_slot: { start_time: '09:00', end_time: '10:00' },
            room: 'A103',
            instructor: 'Dr. Brown'
          }
        ]
      }
    ]
  };
};
