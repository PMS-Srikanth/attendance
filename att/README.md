# Attendance Planner Frontend

A React-based frontend web application that allows students to track, simulate, and plan attendance per subject, following the college's real academic calendar and timetable rules, and enforcing a minimum 75% attendance requirement.

## Features

- **Upload & Import**: Upload your timetable and academic calendar files (CSV/Excel)
- **Review & Edit**: Review imported data and make adjustments (add holidays, Saturday overrides)
- **Plan Attendance**: Plan future attendance with visual status selection
- **Real-time Warnings**: Get warnings when attendance falls below 75% threshold
- **Predictive Analysis**: See projected attendance based on planned absences/presences
- **Summary Dashboard**: Comprehensive overview with charts and detailed breakdowns
- **Export Reports**: Export attendance reports in various formats

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Zustand** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API calls
- **date-fns** for date manipulation
- **Lucide React** for icons

## Project Structure

```
attendance-planner-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── timetable/       # Timetable-related components
│   │   ├── calendar/        # Calendar-related components
│   │   ├── planner/         # Planner-related components
│   │   └── summary/         # Summary-related components
│   ├── pages/               # Route-level pages
│   ├── services/            # API services
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── styles/              # Global styles
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend API running (default: http://localhost:8000)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# .env file
VITE_API_BASE_URL=http://localhost:8000/api
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Upload Files**: Start by uploading your timetable and academic calendar files
2. **Review Data**: Review the imported data and make any necessary adjustments
3. **Plan Attendance**: Navigate through upcoming dates and mark your planned attendance
4. **View Warnings**: Check real-time warnings if your attendance falls below 75%
5. **View Summary**: See comprehensive attendance summary with charts and projections

## Key Features Explained

### 75% Threshold Enforcement
- Real-time calculation of attendance percentage
- Visual warnings when below threshold
- Predictive warnings based on planned attendance

### Academic Calendar Integration
- Supports holidays and non-working days
- Saturday working day overrides
- Follows semester start and end dates

### Future Planning
- Mark future classes as planned-present or planned-absent
- See projected attendance impact
- Adjust plans based on warnings

### Summary & Analytics
- Subject-wise attendance breakdown
- Visual charts and graphs
- Detailed tabular view
- Export functionality

## API Integration

The frontend expects the backend API to provide the following endpoints:

- `POST /api/timetable/upload` - Upload timetable file
- `GET /api/timetable` - Get timetable data
- `POST /api/calendar/upload` - Upload calendar file
- `GET /api/calendar` - Get calendar data
- `GET /api/attendance/records` - Get attendance records
- `POST /api/attendance/records` - Save attendance record
- `GET /api/attendance/summary` - Get attendance summary

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
