from fastapi import APIRouter
from app.api import calendar, timetable, planner, attendance

api_router = APIRouter()

# Include all sub-routers
api_router.include_router(
    calendar.router,
    prefix="/calendar",
    tags=["Calendar"]
)

api_router.include_router(
    timetable.router,
    prefix="/timetable",
    tags=["Timetable"]
)

api_router.include_router(
    planner.router,
    prefix="/planner",
    tags=["Planner"]
)

api_router.include_router(
    attendance.router,
    prefix="/attendance",
    tags=["Attendance"]
)
