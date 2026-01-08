import pytest
from datetime import date
from app.utils.date_utils import (
    get_date_range,
    is_weekend,
    is_saturday,
    is_sunday,
    get_day_name,
    count_saturdays_in_range,
    count_weekdays_in_range
)


def test_get_date_range():
    """Test date range generation."""
    start = date(2024, 1, 1)
    end = date(2024, 1, 5)
    
    dates = get_date_range(start, end)
    
    assert len(dates) == 5
    assert dates[0] == start
    assert dates[-1] == end


def test_is_weekend():
    """Test weekend detection."""
    # Jan 6, 2024 is Saturday
    saturday = date(2024, 1, 6)
    assert is_weekend(saturday) is True
    assert is_saturday(saturday) is True
    assert is_sunday(saturday) is False
    
    # Jan 7, 2024 is Sunday
    sunday = date(2024, 1, 7)
    assert is_weekend(sunday) is True
    assert is_sunday(sunday) is True
    assert is_saturday(sunday) is False
    
    # Jan 8, 2024 is Monday
    monday = date(2024, 1, 8)
    assert is_weekend(monday) is False


def test_get_day_name():
    """Test day name retrieval."""
    monday = date(2024, 1, 1)
    assert get_day_name(monday) == "Monday"
    
    friday = date(2024, 1, 5)
    assert get_day_name(friday) == "Friday"


def test_count_saturdays_in_range():
    """Test counting Saturdays in a range."""
    # January 2024 has 4 Saturdays (6, 13, 20, 27)
    start = date(2024, 1, 1)
    end = date(2024, 1, 31)
    
    count = count_saturdays_in_range(start, end)
    assert count == 4


def test_count_weekdays_in_range():
    """Test counting weekdays."""
    # Jan 1-7, 2024 (Mon-Sun)
    start = date(2024, 1, 1)
    end = date(2024, 1, 7)
    
    # Excluding Saturdays: Mon-Fri = 5 days
    count = count_weekdays_in_range(start, end, exclude_saturdays=True)
    assert count == 5
    
    # Including Saturdays: Mon-Sat = 6 days
    count = count_weekdays_in_range(start, end, exclude_saturdays=False)
    assert count == 6
