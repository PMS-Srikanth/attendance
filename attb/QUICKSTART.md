# Quick Start Guide

## Installation

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

### Windows (PowerShell):
```powershell
.\run.ps1
```

### Linux/Mac:
```bash
chmod +x run.sh
./run.sh
```

### Manual:
```bash
python -m uvicorn app.main:app --reload
```

## API Endpoints

Once running, visit http://localhost:8000/docs for interactive API documentation.

### Workflow Example:

1. **Upload Calendar** - POST `/api/calendar/`
```json
{
  "semester_start": "2024-01-01",
  "semester_end": "2024-05-31",
  "holidays": [
    {"date": "2024-01-26", "name": "Republic Day"}
  ],
  "working_saturdays": [
    {"saturday_type": "1st", "date": "2024-01-06"}
  ]
}
```

2. **Upload Timetable** - POST `/api/timetable/`
```json
{
  "schedule": [
    {
      "day": "Monday",
      "classes": [
        {
          "subject_code": "CS101",
          "subject_name": "Data Structures",
          "time_slot": {"start_time": "09:00", "end_time": "10:00"}
        }
      ]
    }
  ]
}
```

3. **Generate Classes** - POST `/api/attendance/generate`

4. **Mark Attendance** - PATCH `/api/attendance/classes/{class_id}`
```json
{
  "status": "present"
}
```

5. **Get Summary** - GET `/api/attendance/summary`

6. **What-If Simulation** - POST `/api/planner/what-if`
```json
{
  "subject_code": "CS101",
  "classes_to_attend": 5,
  "classes_to_skip": 0
}
```

## Testing

Run tests with pytest:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app
```

## Project Structure

- `app/main.py` - FastAPI application entry point
- `app/core/` - Configuration, constants, logging
- `app/models/` - Pydantic data models
- `app/services/` - Business logic layer
- `app/api/` - API endpoints
- `app/utils/` - Helper functions
- `app/tests/` - Unit tests

## Environment Variables

Edit `.env` file to configure:
- `DEBUG` - Enable debug mode
- `ALLOWED_ORIGINS` - CORS allowed origins
- `MINIMUM_ATTENDANCE_THRESHOLD` - Attendance percentage threshold (default 75%)
