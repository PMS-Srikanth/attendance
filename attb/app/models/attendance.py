from typing import Dict, List
from pydantic import BaseModel, Field
from app.core.constants import AttendanceStatus


class SubjectAttendance(BaseModel):
    """Attendance statistics for a single subject."""
    subject_code: str
    subject_name: str
    total_classes: int
    attended: int
    absent: int
    cancelled: int
    scheduled: int  # Future classes
    percentage: float
    status: AttendanceStatus
    classes_needed_for_75: int  # How many more to attend to reach 75%
    classes_can_miss: int  # How many can be missed while staying above 75%
    
    class Config:
        use_enum_values = True


class OverallAttendance(BaseModel):
    """Overall attendance summary across all subjects."""
    total_classes: int
    attended: int
    absent: int
    cancelled: int
    scheduled: int
    overall_percentage: float
    status: AttendanceStatus
    subjects: List[SubjectAttendance]
    
    class Config:
        use_enum_values = True


class AttendanceWarning(BaseModel):
    """Warning message for attendance issues."""
    subject_code: str
    subject_name: str
    current_percentage: float
    message: str
    severity: str  # "info", "warning", "critical"
    recommendation: str


class AttendanceProjection(BaseModel):
    """Projected attendance after simulated changes."""
    subject_code: str
    current_percentage: float
    projected_percentage: float
    change: float
    classes_simulated: int
    will_meet_threshold: bool
