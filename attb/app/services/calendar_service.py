from datetime import date
from typing import List, Dict
from app.models.calendar import (
    CalendarInput, CalendarResponse, CalendarDay, 
    CalendarSummary, SaturdaySchedule
)
from app.core.constants import DayType
from app.utils.date_utils import (
    get_date_range, is_sunday, is_saturday, get_day_name
)


class CalendarService:
    """Service for processing academic calendar."""
    
    def __init__(self):
        self.holidays_map: Dict[date, str] = {}
        self.working_saturdays_set: set[date] = set()
    
    def process_calendar(self, calendar_input: CalendarInput) -> CalendarResponse:
        """
        Process calendar input and generate full calendar with day types.
        
        Args:
            calendar_input: Calendar configuration
            
        Returns:
            Processed calendar with all days marked
        """
        # Build lookup maps
        self.holidays_map = {h.date: h.name for h in calendar_input.holidays}
        self.working_saturdays_set = {ws.date for ws in calendar_input.working_saturdays}
        
        # Generate all days
        all_dates = get_date_range(calendar_input.semester_start, calendar_input.semester_end)
        calendar_days: List[CalendarDay] = []
        
        working_count = 0
        holiday_count = 0
        working_saturdays_count = 0
        
        for d in all_dates:
            day_info = self._classify_day(d)
            calendar_days.append(day_info)
            
            if day_info.is_working:
                working_count += 1
                if is_saturday(d):
                    working_saturdays_count += 1
            else:
                if day_info.day_type == DayType.HOLIDAY:
                    holiday_count += 1
        
        return CalendarResponse(
            semester_start=calendar_input.semester_start,
            semester_end=calendar_input.semester_end,
            total_days=len(all_dates),
            working_days=working_count,
            holidays=holiday_count,
            saturdays_working=working_saturdays_count,
            calendar=calendar_days
        )
    
    def _classify_day(self, d: date) -> CalendarDay:
        """
        Classify a single day as working/holiday/etc.
        
        Args:
            d: Date to classify
            
        Returns:
            CalendarDay with classification
        """
        day_name = get_day_name(d)
        
        # Check if it's a holiday
        if d in self.holidays_map:
            return CalendarDay(
                date=d,
                day_type=DayType.HOLIDAY,
                is_working=False,
                day_name=day_name,
                holiday_name=self.holidays_map[d]
            )
        
        # Check if Sunday (always non-working)
        if is_sunday(d):
            return CalendarDay(
                date=d,
                day_type=DayType.SUNDAY,
                is_working=False,
                day_name=day_name
            )
        
        # Check if Saturday
        if is_saturday(d):
            if d in self.working_saturdays_set:
                return CalendarDay(
                    date=d,
                    day_type=DayType.SATURDAY_WORKING,
                    is_working=True,
                    day_name=day_name
                )
            else:
                return CalendarDay(
                    date=d,
                    day_type=DayType.SATURDAY_HOLIDAY,
                    is_working=False,
                    day_name=day_name
                )
        
        # Regular weekday (Mon-Fri)
        return CalendarDay(
            date=d,
            day_type=DayType.WORKING,
            is_working=True,
            day_name=day_name
        )
    
    def get_working_days(self, calendar_response: CalendarResponse) -> List[CalendarDay]:
        """Get only working days from calendar."""
        return [day for day in calendar_response.calendar if day.is_working]
    
    def get_summary(self, calendar_response: CalendarResponse) -> CalendarSummary:
        """Get calendar summary statistics."""
        working_saturdays = sum(
            1 for day in calendar_response.calendar 
            if day.day_type == DayType.SATURDAY_WORKING
        )
        
        weekdays_working = sum(
            1 for day in calendar_response.calendar
            if day.is_working and day.day_type == DayType.WORKING
        )
        
        return CalendarSummary(
            total_days=calendar_response.total_days,
            working_days=calendar_response.working_days,
            holiday_count=calendar_response.holidays,
            working_saturdays=working_saturdays,
            weekdays_working=weekdays_working
        )
