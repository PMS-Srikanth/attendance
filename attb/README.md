# Attendance Planner Backend

## Overview
The backend system acts as the single source of truth for attendance logic by accurately modeling real college attendance rules, processing academic calendar and timetable data, and providing reliable attendance calculations and predictive simulations to the frontend.

## Key Principles
- **Business Logic Encapsulation**: All attendance rules, validations, and calculations reside in the backend
- **Pure Presentation Frontend**: Frontend is a presentation layer with no embedded attendance logic
- **Accurate Rule Modeling**: Implements real college attendance rules (75% threshold)
- **Predictive Simulations**: What-if scenarios for attendance planning

## Project Structure
```
attendance-planner-backend/
├── app/
│   ├── main.py                   # FastAPI entry point
│   ├── core/                     # Configuration & constants
│   ├── api/                      # API routing layer
│   ├── models/                   # Pydantic models
│   ├── services/                 # Business logic
│   ├── utils/                    # Helper functions
│   ├── db/                       # Database (v2)
│   └── tests/                    # Unit tests
```

## Getting Started

### Prerequisites
- Python 3.9+
- pip

### Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn app.main:app --reload

# Or use the run script
chmod +x run.sh
./run.sh
```

### API Documentation
Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Features
- 📅 Calendar upload & processing
- 📚 Timetable validation & normalization
- 🎯 Class instance generation
- 📊 Attendance calculation (75% rule)
- 🔮 What-if simulations
- ⚠️ Attendance warnings

## Tech Stack
- FastAPI
- Pydantic
- Python-dateutil
- Pandas (data processing)
- OpenPyXL (Excel parsing)
