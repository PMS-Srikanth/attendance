import pytest
from datetime import date, timedelta
from app.models.calendar import CalendarInput, Holiday, SaturdaySchedule
from app.services.calendar_service import CalendarService
from app.core.constants import DayType, SaturdayType


def test_calendar_processing_basic():
    """Test basic calendar processing."""
    start_date = date(2024, 1, 1)  # Monday
    end_date = date(2024, 1, 31)
    
    calendar_input = CalendarInput(
        semester_start=start_date,
        semester_end=end_date,
        holidays=[
            Holiday(date=date(2024, 1, 15), name="Republic Day")
        ],
        working_saturdays=[]
    )
    
    service = CalendarService()
    result = service.process_calendar(calendar_input)
    
    assert result.semester_start == start_date
    assert result.semester_end == end_date
    assert result.total_days == 31
    assert result.holidays == 1


def test_working_saturdays():
    """Test working Saturday configuration."""
    start_date = date(2024, 1, 1)
    end_date = date(2024, 1, 31)
    
    calendar_input = CalendarInput(
        semester_start=start_date,
        semester_end=end_date,
        holidays=[],
        working_saturdays=[
            SaturdaySchedule(
                saturday_type=SaturdayType.FIRST,
                date=date(2024, 1, 6)  # First Saturday
            )
        ]
    )
    
    service = CalendarService()
    result = service.process_calendar(calendar_input)
    
    assert result.saturdays_working == 1
    
    # Check that the specific Saturday is marked as working
    saturday_day = next(
        (d for d in result.calendar if d.date == date(2024, 1, 6)),
        None
    )
    assert saturday_day is not None
    assert saturday_day.day_type == DayType.SATURDAY_WORKING
    assert saturday_day.is_working is True


def test_holiday_marking():
    """Test that holidays are correctly marked."""
    start_date = date(2024, 1, 1)
    end_date = date(2024, 1, 10)
    
    holiday_date = date(2024, 1, 5)
    holiday_name = "Test Holiday"
    
    calendar_input = CalendarInput(
        semester_start=start_date,
        semester_end=end_date,
        holidays=[Holiday(date=holiday_date, name=holiday_name)],
        working_saturdays=[]
    )
    
    service = CalendarService()
    result = service.process_calendar(calendar_input)
    
    holiday_day = next(
        (d for d in result.calendar if d.date == holiday_date),
        None
    )
    
    assert holiday_day is not None
    assert holiday_day.day_type == DayType.HOLIDAY
    assert holiday_day.is_working is False
    assert holiday_day.holiday_name == holiday_name


def test_sundays_always_non_working():
    """Test that Sundays are always marked as non-working."""
    # Jan 7, 2024 is a Sunday
    start_date = date(2024, 1, 7)
    end_date = date(2024, 1, 7)
    
    calendar_input = CalendarInput(
        semester_start=start_date,
        semester_end=end_date,
        holidays=[],
        working_saturdays=[]
    )
    
    service = CalendarService()
    result = service.process_calendar(calendar_input)
    
    sunday = result.calendar[0]
    assert sunday.day_type == DayType.SUNDAY
    assert sunday.is_working is False
    assert sunday.day_name == "Sunday"


def test_get_working_days():
    """Test getting only working days."""
    start_date = date(2024, 1, 1)
    end_date = date(2024, 1, 7)  # One week
    
    calendar_input = CalendarInput(
        semester_start=start_date,
        semester_end=end_date,
        holidays=[],
        working_saturdays=[]
    )
    
    service = CalendarService()
    result = service.process_calendar(calendar_input)
    working_days = service.get_working_days(result)
    
    # Should have 5 weekdays (Mon-Fri)
    assert len(working_days) == 5
    assert all(day.is_working for day in working_days)
