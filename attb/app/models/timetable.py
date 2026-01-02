from typing import List, Dict, Optional
from pydantic import BaseModel, Field, field_validator
from app.core.constants import WEEKDAYS


class TimeSlot(BaseModel):
    """Represents a time slot for a class."""
    start_time: str  # e.g., "09:00"
    end_time: str    # e.g., "10:00"
    
    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time_format(cls, v):
        """Validate time format HH:MM."""
        import re
        if not re.match(r'^\d{2}:\d{2}$', v):
            raise ValueError(f"Time must be in HH:MM format, got: {v}")
        return v


class ClassSlot(BaseModel):
    """Represents a single class slot in the timetable."""
    subject_code: str
    subject_name: str
    time_slot: TimeSlot
    room: Optional[str] = None
    instructor: Optional[str] = None
    is_non_academic: Optional[bool] = False


class DaySchedule(BaseModel):
    """Schedule for a single day."""
    day: str
    classes: List[ClassSlot] = Field(default_factory=list)
    
    @field_validator('day')
    @classmethod
    def validate_day(cls, v):
        """Ensure day is valid."""
        if v not in WEEKDAYS:
            raise ValueError(f"Day must be one of {WEEKDAYS}")
        return v


class TimetableInput(BaseModel):
    """Input model for weekly timetable."""
    schedule: List[DaySchedule]
    
    @field_validator('schedule')
    @classmethod
    def validate_schedule(cls, v):
        """Ensure no duplicate days."""
        days = [day_schedule.day for day_schedule in v]
        if len(days) != len(set(days)):
            raise ValueError("Duplicate days found in schedule")
        return v


class TimetableResponse(BaseModel):
    """Normalized timetable response."""
    schedule: List[DaySchedule]
    subjects: List[str]  # List of unique subject codes
    total_classes_per_week: int
    classes_per_subject: Dict[str, int]


class SubjectInfo(BaseModel):
    """Information about a subject in the timetable."""
    subject_code: str
    subject_name: str
    weekly_classes: int
    days: List[str]  # Days when this subject has classes
