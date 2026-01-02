# Architecture Document

## System Overview

The Attendance Planner Backend is designed as a **pure business logic layer** that serves as the single source of truth for all attendance-related calculations and rules. The frontend is intentionally kept as a presentation-only layer.

---

## Design Principles

### 1. **Separation of Concerns**
- **Frontend**: Pure UI/presentation layer (no business logic)
- **Backend**: All business rules, validations, calculations
- Clean API contracts via Pydantic models

### 2. **Single Source of Truth**
- All attendance rules defined in backend
- 75% threshold enforced server-side
- Calendar and timetable logic centralized

### 3. **Predictable & Testable**
- Pure functions in utilities
- Service layer contains business logic
- Comprehensive unit tests

### 4. **Extensible Design**
- Easy to add new features (database in v2)
- Modular service architecture
- Clean dependency injection

---

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│            Frontend (Presentation)          │
│         (No Business Logic Here)            │
└────────────────┬────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────┐
│         API Layer (FastAPI Routes)          │
│  - calendar.py    - timetable.py            │
│  - attendance.py  - planner.py              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│      Pydantic Models (Data Contracts)       │
│  - Validation    - Serialization            │
│  - Type Safety   - Documentation            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│       Service Layer (Business Logic)        │
│  ┌─────────────────────────────────────┐   │
│  │  CalendarService                    │   │
│  │  - Process calendar                 │   │
│  │  - Identify working days            │   │
│  │  - Handle Saturday logic            │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  TimetableService                   │   │
│  │  - Validate timetable               │   │
│  │  - Normalize schedule               │   │
│  │  - Extract subject info             │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  ClassGenerator                     │   │
│  │  - Generate class instances         │   │
│  │  - Combine calendar + timetable     │   │
│  │  - Create trackable events          │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  AttendanceService                  │   │
│  │  - Calculate percentages            │   │
│  │  - Enforce 75% rule                 │   │
│  │  - Generate warnings                │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  PlannerService                     │   │
│  │  - What-if simulations              │   │
│  │  - Skip recommendations             │   │
│  │  - Optimization suggestions         │   │
│  └─────────────────────────────────────┘   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│      Utils (Pure Helper Functions)          │
│  - date_utils: Date calculations            │
│  - calculations: Attendance math            │
│  - validators: Input validation             │
└─────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Calendar Upload Flow
```
User uploads calendar (JSON)
    ↓
CalendarInput (Pydantic validation)
    ↓
CalendarService.process_calendar()
    - Classify each day (working/holiday/Saturday)
    - Use date_utils for calculations
    ↓
CalendarResponse (with all days classified)
    ↓
Store in memory (_calendar_storage)
```

### 2. Timetable Upload Flow
```
User uploads timetable (JSON)
    ↓
TimetableInput (Pydantic validation)
    ↓
TimetableService.validate_timetable()
    - Check for time conflicts
    ↓
TimetableService.process_timetable()
    - Extract subjects
    - Count classes per subject
    ↓
TimetableResponse
    ↓
Store in memory (_timetable_storage)
```

### 3. Class Generation Flow
```
Calendar + Timetable (both required)
    ↓
ClassGenerator.generate_classes()
    - For each working day in calendar:
        - Find matching day in timetable
        - Create ClassInstance for each time slot
        - Assign unique ID
    ↓
List[ClassInstance] (all classes for semester)
    ↓
Store in memory (_classes_storage)
```

### 4. Attendance Calculation Flow
```
List[ClassInstance] + current_date
    ↓
AttendanceService.calculate_attendance()
    - Group by subject
    - Count: attended, absent, cancelled, scheduled
    - Calculate percentage = attended / (attended + absent)
    - Determine status (safe/warning/critical)
    - Calculate: classes_needed_for_75, classes_can_miss
    ↓
OverallAttendance (with per-subject breakdown)
```

### 5. What-If Simulation Flow
```
WhatIfScenario (attend X, skip Y)
    ↓
PlannerService.simulate_what_if()
    - Get current attendance
    - For each subject:
        - Simulate: new_attended = current + attend
        - Simulate: new_total = current + attend + skip
        - Calculate: projected_percentage
        - Check: will_meet_threshold
    ↓
WhatIfResponse (projections + warnings)
```

---

## Key Business Rules

### 1. **75% Attendance Rule**
```python
MINIMUM_ATTENDANCE_PERCENTAGE = 75.0

# Percentage calculation
percentage = (attended / total) * 100
# where total = attended + absent (excludes cancelled & future)

# Status determination
if percentage >= 80:    → SAFE
elif percentage >= 75:  → WARNING
elif percentage >= 70:  → AT_RISK
else:                   → CRITICAL
```

### 2. **Working Day Classification**
```python
# Priority order:
1. If in holidays list → HOLIDAY
2. If Sunday → SUNDAY (always non-working)
3. If Saturday:
   - If in working_saturdays → SATURDAY_WORKING
   - Else → SATURDAY_HOLIDAY
4. Else (Mon-Fri) → WORKING
```

### 3. **Classes Needed Calculation**
```python
# To reach 75% from current state:
# (current_attended + x) / (current_total + x) >= 0.75
# Solving for x:
x = (0.75 * current_total - current_attended) / (1 - 0.75)
x = (0.75 * current_total - current_attended) / 0.25
```

### 4. **Classes Can Miss Calculation**
```python
# Maximum classes that can be missed while staying >= 75%
for missed in range(0, future_classes + 1):
    final_percentage = attended / (attended + absent + future - missed)
    if final_percentage < 75:
        return missed - 1
```

---

## Storage Strategy

### V1 (Current): In-Memory
```python
_calendar_storage: CalendarResponse = None
_timetable_storage: TimetableResponse = None
_classes_storage: List[ClassInstance] = []
```

**Pros:**
- Simple and fast
- No database setup needed
- Perfect for prototyping

**Cons:**
- Data lost on restart
- Not suitable for production
- No user isolation

### V2 (Future): Database
```python
# Will use SQLAlchemy with:
- User model (authentication)
- Calendar model (per-user calendars)
- Timetable model (per-user timetables)
- ClassInstance model (attendance tracking)
- Relationships and foreign keys
```

---

## API Design Patterns

### 1. **RESTful Resources**
```
/api/calendar/          → Calendar resource
/api/timetable/         → Timetable resource
/api/attendance/        → Attendance & classes
/api/planner/           → Planning & simulations
```

### 2. **HTTP Methods**
- `GET` - Retrieve data
- `POST` - Create/compute
- `PATCH` - Update specific fields
- `DELETE` - Remove data

### 3. **Response Patterns**
```python
# Success
{
  "data": {...},
  "status": "success"
}

# Error
{
  "detail": "Error message",
  "status_code": 400
}
```

---

## Testing Strategy

### 1. **Unit Tests**
- Test pure functions in isolation
- Mock external dependencies
- Test edge cases

```python
def test_calculate_percentage():
    assert calculate_percentage(75, 100) == 75.0
    assert calculate_percentage(0, 0) == 0.0
```

### 2. **Service Tests**
- Test business logic
- Use real models
- Verify calculations

```python
def test_calendar_processing():
    service = CalendarService()
    result = service.process_calendar(input_data)
    assert result.working_days == expected_count
```

### 3. **Integration Tests** (Future)
- Test API endpoints
- Test complete workflows
- Use TestClient

```python
def test_complete_workflow():
    client.post("/api/calendar/", json=calendar_data)
    client.post("/api/timetable/", json=timetable_data)
    response = client.post("/api/attendance/generate")
    assert response.status_code == 201
```

---

## Performance Considerations

### 1. **Efficient Algorithms**
- O(n) for calendar processing
- O(n*m) for class generation (n days * m classes/day)
- O(n) for attendance calculations

### 2. **Caching** (Future)
- Cache calendar working days
- Cache timetable lookups
- Memoize calculations

### 3. **Pagination** (Future)
- Paginate class lists
- Limit bulk operations
- Stream large responses

---

## Security Considerations (V2)

### 1. **Authentication**
- JWT tokens
- Password hashing
- Session management

### 2. **Authorization**
- User-specific data isolation
- Role-based access control
- Admin capabilities

### 3. **Input Validation**
- Pydantic models (already implemented)
- SQL injection prevention (via ORM)
- XSS prevention

---

## Deployment Architecture

### Development
```
Local Machine
  ↓
Uvicorn (--reload)
  ↓
FastAPI App
```

### Production (Future)
```
Load Balancer
  ↓
Multiple Uvicorn Workers
  ↓
FastAPI App + Database
  ↓
PostgreSQL/MySQL
```

---

## Future Enhancements

### Phase 2: Database
- [ ] Add SQLAlchemy models
- [ ] Implement user authentication
- [ ] Add data persistence
- [ ] Migration with Alembic

### Phase 3: Advanced Features
- [ ] Email notifications for low attendance
- [ ] Export reports (PDF/Excel)
- [ ] Bulk attendance upload
- [ ] Analytics dashboard data

### Phase 4: AI Features
- [ ] Predict attendance patterns
- [ ] Suggest optimal class attendance
- [ ] Anomaly detection
- [ ] Risk scoring

---

## Monitoring & Logging

### Current Logging
```python
# Structured logging with levels
logger.info("Calendar processed: X working days")
logger.warning("Attendance below threshold")
logger.error("Failed to process: error details")
```

### Future Monitoring
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Usage analytics
- Performance metrics

---

## Contributing Guidelines

### Code Style
- Follow PEP 8
- Use type hints
- Write docstrings
- Keep functions small and focused

### Git Workflow
1. Create feature branch
2. Implement changes
3. Write tests
4. Update documentation
5. Create pull request

### Testing
- All new features must have tests
- Maintain >80% code coverage
- Run `pytest` before committing

---

## Support & Documentation

- API Docs: `/docs` (Swagger UI)
- Redoc: `/redoc`
- Quick Start: `QUICKSTART.md`
- API Examples: `API_EXAMPLES.md`
- Architecture: `ARCHITECTURE.md` (this file)
