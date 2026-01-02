# API Integration Summary

## Overview
Successfully connected **19 backend endpoints** from the FastAPI backend to the React frontend.

## Endpoints Connected

### Calendar Endpoints (4)
| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| POST | `/calendar/` | `uploadCalendar()` | Upload and process academic calendar |
| GET | `/calendar/` | `getCalendar()` | Get current calendar |
| GET | `/calendar/summary` | `getCalendarSummary()` | Get calendar summary statistics |
| DELETE | `/calendar/` | `deleteCalendar()` | Clear calendar |

**Service File:** [src/services/calendarService.ts](src/services/calendarService.ts)

---

### Timetable Endpoints (4)
| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| POST | `/timetable/` | `uploadTimetable()` | Upload and validate timetable |
| GET | `/timetable/` | `getTimetable()` | Get current timetable |
| GET | `/timetable/subjects` | `getSubjects()` | Get subject information |
| DELETE | `/timetable/` | `deleteTimetable()` | Clear timetable |

**Service File:** [src/services/timetableService.ts](src/services/timetableService.ts)

---

### Attendance Endpoints (8)
| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| POST | `/attendance/generate` | `generateClasses()` | Generate class instances |
| GET | `/attendance/classes` | `getClasses()` | Get all class instances |
| GET | `/attendance/classes/{class_id}` | `getClassById()` | Get specific class instance |
| PATCH | `/attendance/classes/{class_id}` | `updateClassStatus()` | Update class instance status |
| POST | `/attendance/classes/bulk-update` | `bulkUpdateClasses()` | Bulk update class statuses |
| GET | `/attendance/summary` | `getAttendanceSummary()` | Get attendance summary |
| GET | `/attendance/warnings` | `getWarnings()` | Get attendance warnings |
| DELETE | `/attendance/classes` | `clearClasses()` | Clear all classes |

**Service File:** [src/services/attendanceService.ts](src/services/attendanceService.ts)

---

### Planner Endpoints (4) - NEW
| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| POST | `/planner/what-if` | `simulateWhatIf()` | Simulate what-if scenario |
| GET | `/planner/skip-recommendations` | `getSkipRecommendations()` | Get skip recommendations |
| GET | `/planner/summary` | `getPlannerSummary()` | Get planner summary |
| GET | `/planner/suggestions` | `getOptimizationSuggestions()` | Get optimization suggestions |

**Service File:** [src/services/plannerService.ts](src/services/plannerService.ts) ✨ **NEW FILE**

---

## Changes Made

### 1. Updated `apiClient.ts`
- Modified all HTTP methods (GET, POST, PUT, PATCH, DELETE) to properly wrap FastAPI responses
- Added `patch()` method for partial updates
- Changed response handling to wrap data in `{ success: true, data: response.data }`
- FastAPI returns data directly, not wrapped in a structure

### 2. Updated `calendarService.ts`
- Connected 4 calendar endpoints
- Updated method signatures to match backend API
- Changed from file upload to JSON-based calendar data

### 3. Updated `timetableService.ts`
- Connected 4 timetable endpoints
- Updated method signatures to match backend API
- Changed from file upload to JSON-based timetable data

### 4. Updated `attendanceService.ts`
- Connected 8 attendance endpoints
- Renamed methods to match backend functionality
- Added class generation and bulk update capabilities

### 5. Created `plannerService.ts` ✨
- New service file for planner functionality
- Connected 4 planner endpoints
- Supports what-if scenarios, skip recommendations, summary, and optimization suggestions

### 6. Created `.env.example`
- Added environment variable template
- Default API base URL: `http://localhost:8000/api`

---

## Environment Setup

Create a `.env` file in the `att` folder:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

For production, change to your production API URL.

---

## Usage Examples

### Calendar
```typescript
import { calendarService } from '@/services/calendarService';

// Upload calendar
const response = await calendarService.uploadCalendar({
  semester_start: '2024-01-01',
  semester_end: '2024-05-31',
  holidays: [{ date: '2024-03-01', name: 'Holiday' }],
  saturday_overrides: [{ date: '2024-02-10', override_type: 'WORKING' }]
});

// Get calendar
const calendar = await calendarService.getCalendar();
```

### Timetable
```typescript
import { timetableService } from '@/services/timetableService';

// Upload timetable
const response = await timetableService.uploadTimetable({
  days: {
    'Monday': [
      {
        time_slot: '09:00-10:00',
        subject_code: 'CS101',
        subject_name: 'Computer Science',
        room: 'A101',
        instructor: 'Dr. Smith'
      }
    ]
  }
});
```

### Attendance
```typescript
import { attendanceService } from '@/services/attendanceService';

// Generate classes
await attendanceService.generateClasses();

// Get all classes
const classes = await attendanceService.getClasses({
  subject_code: 'CS101',
  start_date: '2024-01-01'
});

// Update class status
await attendanceService.updateClassStatus('class-id', 'PRESENT');

// Get summary
const summary = await attendanceService.getAttendanceSummary();
```

### Planner (NEW)
```typescript
import { plannerService } from '@/services/plannerService';

// Simulate what-if
const whatIf = await plannerService.simulateWhatIf({
  classes_to_attend: 5,
  subject_code: 'CS101'
});

// Get skip recommendations
const recommendations = await plannerService.getSkipRecommendations();

// Get planner summary
const summary = await plannerService.getPlannerSummary();

// Get optimization suggestions
const suggestions = await plannerService.getOptimizationSuggestions();
```

---

## API Base Configuration

All services use the centralized API client with base URL configuration:
- **Default:** `http://localhost:8000/api`
- **Configurable via:** `VITE_API_BASE_URL` environment variable

---

## Response Format

All API calls return a consistent response structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

**Success:**
```typescript
{
  success: true,
  data: { /* actual data from backend */ }
}
```

**Error:**
```typescript
{
  success: false,
  error: "Error message"
}
```

---

## Total Endpoints: 19 + 1 (20)

- Calendar: 4 endpoints ✅
- Timetable: 4 endpoints ✅
- Attendance: 8 endpoints ✅
- Planner: 4 endpoints ✅ (NEW)

All endpoints are now connected and ready to use! 🎉
