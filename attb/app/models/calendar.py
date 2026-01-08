from datetime import date
from typing import List, Dict, Optional
from pydantic import BaseModel, Field, field_validator
from app.core.constants import DayType, SaturdayType


class Holiday(BaseModel):
    """Represents a holiday in the academic calendar."""
    date: date
    name: str
    description: Optional[str] = None


class SaturdaySchedule(BaseModel):
    """Represents working Saturday configuration."""
    saturday_type: SaturdayType
    date: date
    
    class Config:
        use_enum_values = True


class CalendarInput(BaseModel):
    """Input model for academic calendar."""
    semester_start: date
    semester_end: date
    holidays: List[Holiday] = Field(default_factory=list)
    working_saturdays: List[SaturdaySchedule] = Field(default_factory=list)
    
    @field_validator('semester_end')
    @classmethod
    def validate_dates(cls, v, info):
        """Ensure semester_end is not before semester_start."""
        if 'semester_start' in info.data and v < info.data['semester_start']:
            raise ValueError("semester_end must be on or after semester_start")
        return v


class CalendarDay(BaseModel):
    """Represents a single day in the calendar."""
    date: date
    day_type: DayType
    is_working: bool
    day_name: str
    holiday_name: Optional[str] = None
    
    class Config:
        use_enum_values = True


class CalendarResponse(BaseModel):
    """Processed academic calendar response."""
    semester_start: date
    semester_end: date
    total_days: int
    working_days: int
    holidays: int
    saturdays_working: int
    calendar: List[CalendarDay]


class CalendarSummary(BaseModel):
    """Summary statistics of the calendar."""
    total_days: int
    working_days: int
    holiday_count: int
    working_saturdays: int
    weekdays_working: int
