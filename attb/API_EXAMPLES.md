# API Testing Examples

This document provides example API requests you can use to test the backend.

## Base URL
```
http://localhost:8000
```

## API Documentation
Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 1. Health Check

### GET /
```bash
curl http://localhost:8000/
```

Response:
```json
{
  "message": "Attendance Planner Backend API",
  "version": "1.0.0",
  "status": "operational",
  "docs": "/docs"
}
```

---

## 2. Upload Calendar

### POST /api/calendar/

```bash
curl -X POST http://localhost:8000/api/calendar/ \
  -H "Content-Type: application/json" \
  -d '{
    "semester_start": "2024-01-01",
    "semester_end": "2024-05-31",
    "holidays": [
      {
        "date": "2024-01-26",
        "name": "Republic Day"
      },
      {
        "date": "2024-03-25",
        "name": "Holi"
      },
      {
        "date": "2024-04-11",
        "name": "Eid"
      }
    ],
    "working_saturdays": [
      {
        "saturday_type": "1st",
        "date": "2024-01-06"
      },
      {
        "saturday_type": "3rd",
        "date": "2024-02-17"
      }
    ]
  }'
```

### GET /api/calendar/
Get the uploaded calendar.

### GET /api/calendar/summary
Get calendar statistics.

---

## 3. Upload Timetable

### POST /api/timetable/

```bash
curl -X POST http://localhost:8000/api/timetable/ \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": [
      {
        "day": "Monday",
        "classes": [
          {
            "subject_code": "CS101",
            "subject_name": "Data Structures",
            "time_slot": {
              "start_time": "09:00",
              "end_time": "10:00"
            },
            "room": "Room 301"
          },
          {
            "subject_code": "CS102",
            "subject_name": "Algorithms",
            "time_slot": {
              "start_time": "10:00",
              "end_time": "11:00"
            },
            "room": "Room 302"
          }
        ]
      },
      {
        "day": "Tuesday",
        "classes": [
          {
            "subject_code": "CS101",
            "subject_name": "Data Structures",
            "time_slot": {
              "start_time": "09:00",
              "end_time": "10:00"
            }
          },
          {
            "subject_code": "MATH201",
            "subject_name": "Discrete Mathematics",
            "time_slot": {
              "start_time": "11:00",
              "end_time": "12:00"
            }
          }
        ]
      },
      {
        "day": "Wednesday",
        "classes": [
          {
            "subject_code": "CS102",
            "subject_name": "Algorithms",
            "time_slot": {
              "start_time": "10:00",
              "end_time": "11:00"
            }
          }
        ]
      },
      {
        "day": "Thursday",
        "classes": [
          {
            "subject_code": "CS101",
            "subject_name": "Data Structures",
            "time_slot": {
              "start_time": "09:00",
              "end_time": "10:00"
            }
          },
          {
            "subject_code": "MATH201",
            "subject_name": "Discrete Mathematics",
            "time_slot": {
              "start_time": "11:00",
              "end_time": "12:00"
            }
          }
        ]
      },
      {
        "day": "Friday",
        "classes": [
          {
            "subject_code": "CS102",
            "subject_name": "Algorithms",
            "time_slot": {
              "start_time": "10:00",
              "end_time": "11:00"
            }
          },
          {
            "subject_code": "MATH201",
            "subject_name": "Discrete Mathematics",
            "time_slot": {
              "start_time": "14:00",
              "end_time": "15:00"
            }
          }
        ]
      }
    ]
  }'
```

### GET /api/timetable/
Get the uploaded timetable.

### GET /api/timetable/subjects
Get subject information.

---

## 4. Generate Classes

### POST /api/attendance/generate

```bash
curl -X POST http://localhost:8000/api/attendance/generate
```

This generates all class instances for the semester based on the calendar and timetable.

---

## 5. Get Classes

### GET /api/attendance/classes

Get all classes:
```bash
curl http://localhost:8000/api/attendance/classes
```

Filter by subject:
```bash
curl "http://localhost:8000/api/attendance/classes?subject_code=CS101"
```

Filter by date range:
```bash
curl "http://localhost:8000/api/attendance/classes?start_date=2024-01-01&end_date=2024-01-31"
```

---

## 6. Mark Attendance

### PATCH /api/attendance/classes/{class_id}

Mark as present:
```bash
curl -X PATCH http://localhost:8000/api/attendance/classes/{CLASS_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "present"}'
```

Mark as absent:
```bash
curl -X PATCH http://localhost:8000/api/attendance/classes/{CLASS_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "absent"}'
```

Mark as cancelled:
```bash
curl -X PATCH http://localhost:8000/api/attendance/classes/{CLASS_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

### Bulk Update

```bash
curl -X POST http://localhost:8000/api/attendance/classes/bulk-update \
  -H "Content-Type: application/json" \
  -d '{
    "class_id_1": "present",
    "class_id_2": "absent",
    "class_id_3": "present"
  }'
```

---

## 7. Get Attendance Summary

### GET /api/attendance/summary

```bash
curl http://localhost:8000/api/attendance/summary
```

With specific date:
```bash
curl "http://localhost:8000/api/attendance/summary?current_date=2024-03-15"
```

---

## 8. Get Warnings

### GET /api/attendance/warnings

```bash
curl http://localhost:8000/api/attendance/warnings
```

---

## 9. What-If Simulation

### POST /api/planner/what-if

Simulate attending 10 classes of CS101:
```bash
curl -X POST http://localhost:8000/api/planner/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "subject_code": "CS101",
    "classes_to_attend": 10,
    "classes_to_skip": 0
  }'
```

Simulate skipping 3 classes across all subjects:
```bash
curl -X POST http://localhost:8000/api/planner/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "classes_to_attend": 0,
    "classes_to_skip": 3
  }'
```

---

## 10. Skip Recommendations

### GET /api/planner/skip-recommendations

```bash
curl http://localhost:8000/api/planner/skip-recommendations
```

---

## 11. Planner Summary

### GET /api/planner/summary

```bash
curl http://localhost:8000/api/planner/summary
```

---

## 12. Optimization Suggestions

### GET /api/planner/suggestions

```bash
curl http://localhost:8000/api/planner/suggestions
```

---

## Complete Workflow Example

```bash
# 1. Upload calendar
curl -X POST http://localhost:8000/api/calendar/ \
  -H "Content-Type: application/json" \
  -d @calendar.json

# 2. Upload timetable
curl -X POST http://localhost:8000/api/timetable/ \
  -H "Content-Type: application/json" \
  -d @timetable.json

# 3. Generate classes
curl -X POST http://localhost:8000/api/attendance/generate

# 4. Get first few classes
curl "http://localhost:8000/api/attendance/classes?start_date=2024-01-01&end_date=2024-01-07"

# 5. Mark some attendance (replace CLASS_ID with actual IDs from step 4)
curl -X PATCH http://localhost:8000/api/attendance/classes/CS101_20240101_0900_abc123 \
  -H "Content-Type: application/json" \
  -d '{"status": "present"}'

# 6. Get attendance summary
curl http://localhost:8000/api/attendance/summary

# 7. Get recommendations
curl http://localhost:8000/api/planner/suggestions
```

---

## Testing with Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Upload calendar
calendar_data = {
    "semester_start": "2024-01-01",
    "semester_end": "2024-05-31",
    "holidays": [{"date": "2024-01-26", "name": "Republic Day"}],
    "working_saturdays": []
}
response = requests.post(f"{BASE_URL}/api/calendar/", json=calendar_data)
print(response.json())

# Upload timetable
timetable_data = {
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
response = requests.post(f"{BASE_URL}/api/timetable/", json=timetable_data)
print(response.json())

# Generate classes
response = requests.post(f"{BASE_URL}/api/attendance/generate")
print(response.json())
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (delete operations)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error
