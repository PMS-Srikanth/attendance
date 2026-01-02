export const validateTimetableData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.subjects || !Array.isArray(data.subjects)) {
    errors.push('Subjects array is required');
  }

  if (!data.timeSlots || !Array.isArray(data.timeSlots)) {
    errors.push('Time slots array is required');
  }

  if (!data.entries || !Array.isArray(data.entries)) {
    errors.push('Timetable entries array is required');
  }

  // Validate subjects
  if (data.subjects) {
    data.subjects.forEach((subject: any, index: number) => {
      if (!subject.subjectCode) {
        errors.push(`Subject at index ${index} missing subjectCode`);
      }
      if (!subject.subjectName) {
        errors.push(`Subject at index ${index} missing subjectName`);
      }
    });
  }

  // Validate time slots
  if (data.timeSlots) {
    data.timeSlots.forEach((slot: any, index: number) => {
      if (typeof slot.slotNumber !== 'number') {
        errors.push(`Time slot at index ${index} missing slotNumber`);
      }
      if (!slot.startTime) {
        errors.push(`Time slot at index ${index} missing startTime`);
      }
      if (!slot.endTime) {
        errors.push(`Time slot at index ${index} missing endTime`);
      }
    });
  }

  // Validate entries
  if (data.entries) {
    data.entries.forEach((entry: any, index: number) => {
      if (!entry.day) {
        errors.push(`Entry at index ${index} missing day`);
      }
      if (typeof entry.slotNumber !== 'number') {
        errors.push(`Entry at index ${index} missing slotNumber`);
      }
      if (!entry.subjectCode) {
        errors.push(`Entry at index ${index} missing subjectCode`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateCalendarData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.semesterStartDate) {
    errors.push('Semester start date is required');
  }

  if (!data.semesterEndDate) {
    errors.push('Semester end date is required');
  }

  if (!data.holidays || !Array.isArray(data.holidays)) {
    errors.push('Holidays array is required');
  }

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (data.semesterStartDate && !dateRegex.test(data.semesterStartDate)) {
    errors.push('Invalid semester start date format (use YYYY-MM-DD)');
  }

  if (data.semesterEndDate && !dateRegex.test(data.semesterEndDate)) {
    errors.push('Invalid semester end date format (use YYYY-MM-DD)');
  }

  // Validate holidays
  if (data.holidays) {
    data.holidays.forEach((holiday: any, index: number) => {
      if (!holiday.date) {
        errors.push(`Holiday at index ${index} missing date`);
      } else if (!dateRegex.test(holiday.date)) {
        errors.push(`Holiday at index ${index} has invalid date format`);
      }
      if (!holiday.name) {
        errors.push(`Holiday at index ${index} missing name`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateAttendanceRecord = (record: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!record.date) {
    errors.push('Date is required');
  }

  if (!record.subjectCode) {
    errors.push('Subject code is required');
  }

  if (typeof record.slotNumber !== 'number') {
    errors.push('Slot number is required');
  }

  if (!record.status) {
    errors.push('Status is required');
  } else if (!['present', 'absent', 'planned-present', 'planned-absent'].includes(record.status)) {
    errors.push('Invalid status value');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
