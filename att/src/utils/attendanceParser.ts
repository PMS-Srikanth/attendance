// Attendance file parser - supports CSV and JSON formats
// Expected format: Subject Code, Date (YYYY-MM-DD), Status (Present/Absent)

export interface ParsedAttendanceRecord {
  subjectCode: string;
  date: string; // ISO format YYYY-MM-DD
  status: 'present' | 'absent';
}

export interface ParseResult {
  success: boolean;
  data: ParsedAttendanceRecord[];
  errors: string[];
}

/**
 * Parse CSV content to attendance records
 * Expected format: SubjectCode,Date,Status
 * Example: 23CSE211,2025-01-15,Present
 */
export function parseCSV(csvContent: string): ParseResult {
  const errors: string[] = [];
  const data: ParsedAttendanceRecord[] = [];
  
  const lines = csvContent.trim().split('\n');
  
  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes('subject') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',').map(p => p.trim());
    
    if (parts.length < 3) {
      errors.push(`Line ${i + 1}: Invalid format - expected 3 columns (SubjectCode,Date,Status)`);
      continue;
    }
    
    const [subjectCode, dateStr, statusStr] = parts;
    
    // Validate subject code
    if (!subjectCode) {
      errors.push(`Line ${i + 1}: Missing subject code`);
      continue;
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      errors.push(`Line ${i + 1}: Invalid date format for ${dateStr} - use YYYY-MM-DD`);
      continue;
    }
    
    // Validate status
    const status = statusStr.toLowerCase();
    if (status !== 'present' && status !== 'absent') {
      errors.push(`Line ${i + 1}: Invalid status "${statusStr}" - use Present or Absent`);
      continue;
    }
    
    data.push({
      subjectCode,
      date: dateStr,
      status: status as 'present' | 'absent',
    });
  }
  
  return {
    success: errors.length === 0,
    data,
    errors,
  };
}

/**
 * Parse JSON content to attendance records
 * Expected format: [{"subjectCode": "CS101", "date": "2025-01-15", "status": "present"}]
 */
export function parseJSON(jsonContent: string): ParseResult {
  const errors: string[] = [];
  const data: ParsedAttendanceRecord[] = [];
  
  try {
    const parsed = JSON.parse(jsonContent);
    
    if (!Array.isArray(parsed)) {
      return {
        success: false,
        data: [],
        errors: ['JSON must be an array of attendance records'],
      };
    }
    
    parsed.forEach((record, index) => {
      // Validate required fields
      if (!record.subjectCode && !record.subject_code) {
        errors.push(`Record ${index + 1}: Missing subjectCode field`);
        return;
      }
      
      if (!record.date) {
        errors.push(`Record ${index + 1}: Missing date field`);
        return;
      }
      
      if (!record.status) {
        errors.push(`Record ${index + 1}: Missing status field`);
        return;
      }
      
      const subjectCode = record.subjectCode || record.subject_code;
      const status = record.status.toLowerCase();
      
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(record.date)) {
        errors.push(`Record ${index + 1}: Invalid date format - use YYYY-MM-DD`);
        return;
      }
      
      // Validate status
      if (status !== 'present' && status !== 'absent') {
        errors.push(`Record ${index + 1}: Invalid status - use "present" or "absent"`);
        return;
      }
      
      data.push({
        subjectCode,
        date: record.date,
        status: status as 'present' | 'absent',
      });
    });
    
    return {
      success: errors.length === 0,
      data,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Parse attendance file based on file extension
 */
export async function parseAttendanceFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  try {
    const content = await file.text();
    
    switch (extension) {
      case 'csv':
        return parseCSV(content);
      
      case 'json':
        return parseJSON(content);
      
      case 'xlsx':
      case 'xls':
        return {
          success: false,
          data: [],
          errors: ['Excel files not yet supported. Please convert to CSV or JSON format.'],
        };
      
      default:
        return {
          success: false,
          data: [],
          errors: [`Unsupported file format: ${extension}. Use CSV or JSON.`],
        };
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
  return `SubjectCode,Date,Status
23CSE211,2025-01-06,Present
23CSE211,2025-01-07,Present
22MAT216,2025-01-06,Absent
23CSE213,2025-01-07,Present`;
}

/**
 * Generate sample JSON template
 */
export function generateJSONTemplate(): string {
  return JSON.stringify([
    { subjectCode: '23CSE211', date: '2025-01-06', status: 'present' },
    { subjectCode: '23CSE211', date: '2025-01-07', status: 'present' },
    { subjectCode: '22MAT216', date: '2025-01-06', status: 'absent' },
    { subjectCode: '23CSE213', date: '2025-01-07', status: 'present' },
  ], null, 2);
}
