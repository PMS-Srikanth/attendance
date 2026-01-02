from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field
from app.core.constants import ClassStatus


class ClassInstance(BaseModel):
    """Represents a single class instance on a specific date."""
    id: str  # Unique identifier
    subject_code: str
    subject_name: str
    date: date
    day_name: str
    start_time: str
    end_time: str
    status: ClassStatus = ClassStatus.SCHEDULED
    room: Optional[str] = None
    instructor: Optional[str] = None
    is_makeup: bool = False  # For makeup classes on Saturdays
    
    class Config:
        use_enum_values = True


class ClassInstanceUpdate(BaseModel):
    """Model for updating class instance status."""
    status: ClassStatus
    
    class Config:
        use_enum_values = True


class ClassGenerationRequest(BaseModel):
    """Request to generate class instances from calendar and timetable."""
    # This will be handled by combining calendar and timetable data
    # No direct user input needed
    pass


class ClassGenerationResponse(BaseModel):
    """Response after generating class instances."""
    total_classes: int
    classes_by_subject: dict[str, int]
    classes: list[ClassInstance]
    semester_start: date
    semester_end: date
