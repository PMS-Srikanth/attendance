# 🎓 Attendance Planner Backend - Visual Guide

## 📊 System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│              (React/Next.js/Vue - Pure UI)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST API Calls
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                               │
│                 (Single Source of Truth)                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API LAYER                             │  │
│  │  /api/calendar/     /api/timetable/                      │  │
│  │  /api/attendance/   /api/planner/                        │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │               PYDANTIC MODELS                            │  │
│  │  Validation │ Type Safety │ Auto Docs │ Serialization   │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │              SERVICE LAYER (Business Logic)              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Calendar   │  │  Timetable   │  │    Class     │  │  │
│  │  │   Service    │  │   Service    │  │  Generator   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐                    │  │
│  │  │ Attendance   │  │   Planner    │                    │  │
│  │  │   Service    │  │   Service    │                    │  │
│  │  └──────────────┘  └──────────────┘                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │           UTILITIES (Pure Functions)                     │  │
│  │  date_utils  │  calculations  │  validators             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           STORAGE (V1: In-Memory)                        │  │
│  │  _calendar_storage  │  _timetable_storage               │  │
│  │  _classes_storage                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow: Complete Workflow

```
1. UPLOAD CALENDAR
   ┌──────────────┐
   │ User uploads │
   │   calendar   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐       ┌──────────────┐
   │  Calendar    │──────>│   Calendar   │
   │   Input      │       │   Service    │
   └──────────────┘       └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │  Working     │
                          │  Days List   │
                          └──────────────┘

2. UPLOAD TIMETABLE
   ┌──────────────┐
   │ User uploads │
   │  timetable   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐       ┌──────────────┐
   │ Timetable    │──────>│  Timetable   │
   │   Input      │       │   Service    │
   └──────────────┘       └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │  Normalized  │
                          │  Schedule    │
                          └──────────────┘

3. GENERATE CLASSES
   ┌──────────────┐       ┌──────────────┐
   │   Working    │       │  Normalized  │
   │   Days       │       │  Schedule    │
   └──────┬───────┘       └──────┬───────┘
          │                      │
          └──────────┬───────────┘
                     ▼
              ┌──────────────┐
              │    Class     │
              │  Generator   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  Individual  │
              │    Class     │
              │  Instances   │
              └──────────────┘

4. MARK ATTENDANCE
   ┌──────────────┐
   │ User marks   │
   │  present/    │
   │   absent     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Update class │
   │   status     │
   └──────────────┘

5. GET SUMMARY
   ┌──────────────┐       ┌──────────────┐
   │    Class     │──────>│ Attendance   │
   │  Instances   │       │   Service    │
   └──────────────┘       └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Calculate:   │
                          │ • Percentage │
                          │ • Status     │
                          │ • Warnings   │
                          └──────────────┘

6. WHAT-IF PLANNING
   ┌──────────────┐
   │ User creates │
   │  scenario    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐       ┌──────────────┐
   │  What-If     │──────>│   Planner    │
   │  Scenario    │       │   Service    │
   └──────────────┘       └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │  Projected   │
                          │ Attendance   │
                          └──────────────┘
```

## 📈 Attendance Status Levels

```
┌─────────────────────────────────────────────────────────────┐
│                    ATTENDANCE STATUS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ SAFE (≥ 80%)                                           │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Attendance is healthy                           │    │
│  │ • Can miss several classes safely                 │    │
│  │ • No immediate action needed                      │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  ⚠️  WARNING (75% - 80%)                                   │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Above threshold but close                       │    │
│  │ • Limited buffer remaining                        │    │
│  │ • Should attend more classes                      │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  🟡 AT RISK (70% - 75%)                                    │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Just above or at threshold                      │    │
│  │ • Cannot miss any more classes                    │    │
│  │ • Must attend consistently                        │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  🔴 CRITICAL (< 70%)                                       │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Below 75% threshold - URGENT                    │    │
│  │ • Need to attend X consecutive classes            │    │
│  │ • Risk of detention/not allowed in exams          │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Calculations

### 1. Attendance Percentage
```
         Classes Attended
Percentage = ─────────────────────────────── × 100
         Attended + Absent

Note: Cancelled and scheduled (future) classes are excluded
```

### 2. Classes Needed to Reach 75%
```
         (75 × Current Total) - (100 × Current Attended)
Classes = ─────────────────────────────────────────────────
                           25

Example:
Current: 60/100 (60%)
Classes = (75 × 100 - 100 × 60) / 25
Classes = 60 more classes needed
```

### 3. Classes Can Miss
```
Iterate through future classes:
  For each skip:
    Calculate: final_percentage = attended / (total + remaining - skipped)
    If final_percentage < 75%:
      Return: previous_skip_count

Example:
Current: 90/100 (90%), 20 future classes
Can miss: 10 classes (will be at 90/110 = 81.8%)
```

## 📱 API Structure

```
http://localhost:8000
├── /                           (Health check)
├── /health                     (Health check)
├── /docs                       (Swagger UI)
├── /redoc                      (ReDoc)
│
└── /api
    ├── /calendar
    │   ├── POST   /            (Upload calendar)
    │   ├── GET    /            (Get calendar)
    │   ├── GET    /summary     (Get summary)
    │   └── DELETE /            (Clear calendar)
    │
    ├── /timetable
    │   ├── POST   /            (Upload timetable)
    │   ├── GET    /            (Get timetable)
    │   ├── GET    /subjects    (Get subjects)
    │   └── DELETE /            (Clear timetable)
    │
    ├── /attendance
    │   ├── POST   /generate    (Generate classes)
    │   ├── GET    /classes     (Get all classes)
    │   ├── GET    /classes/{id} (Get one class)
    │   ├── PATCH  /classes/{id} (Update status)
    │   ├── POST   /classes/bulk-update (Bulk update)
    │   ├── GET    /summary     (Get summary)
    │   ├── GET    /warnings    (Get warnings)
    │   └── DELETE /classes     (Clear classes)
    │
    └── /planner
        ├── POST   /what-if     (Simulate scenario)
        ├── GET    /skip-recommendations (Skip advice)
        ├── GET    /summary     (Planner summary)
        └── GET    /suggestions (AI suggestions)
```

## 🧮 Example Scenario

```
Student: John
Semester: Jan 2024 - May 2024
Subject: CS101 (Data Structures)

Timeline:
┌────────────────────────────────────────────────────────┐
│ Total Classes Generated: 60                            │
│ Classes Completed: 30                                  │
│ Classes Remaining: 30                                  │
├────────────────────────────────────────────────────────┤
│ Attended: 24 classes                                   │
│ Absent: 6 classes                                      │
│ Current Percentage: 80% (24/30)                        │
│ Status: ✅ SAFE                                        │
├────────────────────────────────────────────────────────┤
│ Can miss: 4 more classes                               │
│ If miss 4: 24/34 = 70.6% → 🔴 CRITICAL                │
│ Safe to miss: 3 classes (will be at 24/33 = 72.7%)    │
├────────────────────────────────────────────────────────┤
│ What-if: Skip next 5 classes?                          │
│ Result: 24/35 = 68.6% → 🔴 CRITICAL                   │
│ Warning: Will fall below 75%!                          │
└────────────────────────────────────────────────────────┘
```

## 🎬 Quick Start Commands

```bash
# 1. Setup
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 2. Start Server
python -m uvicorn app.main:app --reload

# 3. Open Browser
http://localhost:8000/docs

# 4. Upload Calendar (in /docs)
POST /api/calendar/
{semester_start, semester_end, holidays, working_saturdays}

# 5. Upload Timetable
POST /api/timetable/
{schedule: [{day, classes}]}

# 6. Generate Classes
POST /api/attendance/generate

# 7. View Summary
GET /api/attendance/summary

# 8. Plan Ahead
POST /api/planner/what-if
{subject_code, classes_to_attend, classes_to_skip}
```

## ✨ You're All Set!

Your attendance planner backend is **production-ready** (minus database persistence).
Start the server and explore the API at `/docs`!

**Happy Planning! 🎓📊**
