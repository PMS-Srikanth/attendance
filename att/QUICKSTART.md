# Quick Start Guide - Attendance Planner

## Installation & Setup

### 1. Install Dependencies
```powershell
cd "c:\Users\srika\OneDrive\Desktop\att"
npm install
```

### 2. Configure Environment
The `.env` file is already configured with default settings:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

Update this if your backend API runs on a different URL.

### 3. Start Development Server
```powershell
npm run dev
```

The application will be available at: http://localhost:3000

## Project Overview

### Application Flow

1. **Upload Page** (`/`)
   - Upload timetable CSV/Excel file
   - Upload academic calendar CSV/Excel file
   - Files are sent to backend API for processing

2. **Review Page** (`/review`)
   - View parsed timetable in grid format
   - Review holidays and working days
   - Add/remove holidays
   - Add Saturday working day overrides
   - Edit calendar information

3. **Planner Page** (`/planner`)
   - View upcoming classes (next 14 days by default)
   - Mark each class as "Planned Present" or "Planned Absent"
   - See real-time warnings if attendance falls below 75%
   - Load more days as needed

4. **Summary Page** (`/summary`)
   - View overall attendance statistics
   - See subject-wise breakdown with cards
   - Interactive charts showing current vs projected attendance
   - Detailed table with all metrics
   - Export functionality

### Key Features

#### 75% Threshold Enforcement
- Current attendance is calculated from past records
- Projected attendance includes planned future attendance
- Warnings appear when:
  - Current attendance < 75% (Critical)
  - Projected attendance < 75% (Warning)
  - Close to threshold (Info)

#### Smart Calendar Integration
- Respects holidays (no classes shown)
- Handles Saturday working days
- Can override Saturday to follow any weekday timetable
- Filters out Sundays automatically

#### State Management
All data is persisted in browser localStorage using Zustand:
- `timetable-storage`: Timetable data
- `calendar-storage`: Calendar data
- `attendance-storage`: Attendance records

### File Structure Explained

```
src/
├── components/
│   ├── common/              # Reusable UI components (Button, Select, Modal, Loader)
│   ├── timetable/           # Timetable display components
│   ├── calendar/            # Calendar management components
│   ├── planner/             # Attendance planning components
│   └── summary/             # Summary and analytics components
│
├── pages/                   # Main route pages
│   ├── UploadPage.tsx       # File upload interface
│   ├── ReviewPage.tsx       # Data review and editing
│   ├── PlannerPage.tsx      # Attendance planning
│   └── SummaryPage.tsx      # Analytics and summary
│
├── services/                # API integration
│   ├── apiClient.ts         # Axios HTTP client
│   ├── timetableService.ts  # Timetable API calls
│   ├── calendarService.ts   # Calendar API calls
│   └── attendanceService.ts # Attendance API calls
│
├── store/                   # Zustand state management
│   ├── useTimetableStore.ts # Timetable state
│   ├── useCalendarStore.ts  # Calendar state
│   ├── useAttendanceStore.ts# Attendance records state
│   └── usePlannerStore.ts   # Planner state
│
├── types/                   # TypeScript definitions
│   ├── timetable.ts         # Timetable types
│   ├── calendar.ts          # Calendar types
│   ├── attendance.ts        # Attendance types
│   └── api.ts               # API response types
│
├── utils/                   # Helper functions
│   ├── dateUtils.ts         # Date manipulation
│   ├── statusUtils.ts       # Status calculations
│   └── validation.ts        # Data validation
│
└── hooks/                   # Custom React hooks
    ├── usePlannerWarnings.ts# Warning calculation hook
    └── useLocalStorage.ts   # localStorage hook
```

## Development Commands

```powershell
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Backend API Requirements

The frontend expects these API endpoints to be available:

### Timetable Endpoints
- `POST /api/timetable/upload` - Upload timetable file (multipart/form-data)
- `GET /api/timetable` - Get timetable data
- `POST /api/timetable` - Save timetable data
- `PUT /api/timetable` - Update timetable data

### Calendar Endpoints
- `POST /api/calendar/upload` - Upload calendar file (multipart/form-data)
- `GET /api/calendar` - Get calendar data
- `POST /api/calendar` - Save calendar data
- `POST /api/calendar/holidays` - Add holiday
- `DELETE /api/calendar/holidays/{date}` - Remove holiday
- `POST /api/calendar/saturday-overrides` - Add Saturday override
- `DELETE /api/calendar/saturday-overrides/{date}` - Remove Saturday override

### Attendance Endpoints
- `GET /api/attendance/records` - Get all attendance records
- `POST /api/attendance/records` - Save attendance record
- `PUT /api/attendance/records/{id}` - Update attendance record
- `POST /api/attendance/records/bulk` - Bulk update records
- `GET /api/attendance/summary` - Get attendance summary
- `GET /api/attendance/warnings` - Get attendance warnings

## Common Issues & Solutions

### Issue: API calls failing
**Solution**: Ensure backend API is running and VITE_API_BASE_URL is correct in .env

### Issue: Data not persisting
**Solution**: Check browser localStorage. Clear it if corrupted:
```javascript
localStorage.clear()
```

### Issue: Build fails
**Solution**: Delete node_modules and reinstall:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: Port 3000 already in use
**Solution**: Vite will automatically use next available port (3001, 3002, etc.)

## Customization

### Change API URL
Edit `.env`:
```
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Change Theme Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Change these color values
        500: '#your-color',
        600: '#your-color',
        // ...
      },
    },
  },
}
```

### Modify Attendance Threshold
Edit `src/utils/statusUtils.ts` and `src/hooks/usePlannerWarnings.ts`:
```typescript
const THRESHOLD = 75; // Change to your requirement
```

## Next Steps

1. **Install dependencies**: `npm install`
2. **Start the dev server**: `npm run dev`
3. **Set up backend API** (if not already running)
4. **Test the application** with sample data
5. **Customize** as needed for your institution

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review component source code for implementation details
- Ensure backend API is properly configured

---

Happy coding! 🎓📊
