# Attendance Upload Template

This document explains how to format your current attendance data for upload.

## Supported Formats

### 1. CSV Format (Recommended)
- Simple and easy to create in Excel or Google Sheets
- Save as `.csv` file

**Template:**
```csv
SubjectCode,Date,Status
23CSE211,2025-01-06,Present
23CSE211,2025-01-07,Present
22MAT216,2025-01-06,Absent
23CSE213,2025-01-07,Present
23CSE214,2025-01-08,Present
```

### 2. JSON Format
- For programmatic generation
- Save as `.json` file

**Template:**
```json
[
  { "subjectCode": "23CSE211", "date": "2025-01-06", "status": "present" },
  { "subjectCode": "23CSE211", "date": "2025-01-07", "status": "present" },
  { "subjectCode": "22MAT216", "date": "2025-01-06", "status": "absent" },
  { "subjectCode": "23CSE213", "date": "2025-01-07", "status": "present" }
]
```

## Field Requirements

### SubjectCode
- Must match exactly with your timetable subject codes
- Example: `23CSE211`, `22MAT216`, `23LAE211`
- Case-sensitive

### Date
- Format: `YYYY-MM-DD` (ISO 8601)
- Example: `2025-01-15`, `2025-02-20`
- Must be a valid date within your semester

### Status
- **Present** or **Absent** (CSV - case insensitive)
- **present** or **absent** (JSON - lowercase)

## Creating Your File

### Using Excel/Google Sheets:

1. Create a new spreadsheet
2. Add headers in Row 1: `SubjectCode`, `Date`, `Status`
3. Fill in your attendance data:
   - One row per class
   - Use the exact subject codes from your timetable
   - Format dates as YYYY-MM-DD
   - Type "Present" or "Absent" for status
4. Save as CSV:
   - **Excel**: File → Save As → CSV (Comma delimited) (*.csv)
   - **Google Sheets**: File → Download → Comma Separated Values (.csv)

### Example Spreadsheet:

| SubjectCode | Date       | Status  |
|-------------|------------|---------|
| 23CSE211    | 2025-01-06 | Present |
| 23CSE211    | 2025-01-08 | Absent  |
| 22MAT216    | 2025-01-06 | Present |
| 23CSE213    | 2025-01-07 | Present |
| 23CSE214    | 2025-01-09 | Present |

## Tips

- **Only include past classes** - Future dates will be ignored
- **Match subject codes exactly** - Use the same codes as your timetable
- **One entry per class** - Each class session should have one row
- **No duplicate entries** - Don't list the same class on the same date twice
- **Skip header row** - The system will automatically detect and skip header rows

## Validation

The system will check:
- ✅ Valid date format (YYYY-MM-DD)
- ✅ Valid status (Present/Absent)
- ✅ Subject code exists in timetable
- ✅ Date matches an actual class date

Any errors will be shown during upload so you can fix them.

## What Happens After Upload

1. System matches your attendance records to generated class instances
2. Updates attendance status for matched classes
3. Shows summary:
   - Number of records uploaded
   - Any records that couldn't be matched
4. You can see current attendance % vs projected % in the Summary page
