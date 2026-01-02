from datetime import date, timedelta
from typing import List
import calendar


def get_date_range(start_date: date, end_date: date) -> List[date]:
    """
    Generate a list of dates between start and end (inclusive).
    
    Args:
        start_date: Start date
        end_date: End date
        
    Returns:
        List of dates
    """
    dates = []
    current = start_date
    while current <= end_date:
        dates.append(current)
        current += timedelta(days=1)
    return dates


def is_weekend(d: date) -> bool:
    """Check if date is a weekend (Saturday or Sunday)."""
    return d.weekday() >= 5


def is_sunday(d: date) -> bool:
    """Check if date is Sunday."""
    return d.weekday() == 6


def is_saturday(d: date) -> bool:
    """Check if date is Saturday."""
    return d.weekday() == 5


def get_day_name(d: date) -> str:
    """Get day name from date."""
    return d.strftime("%A")


def get_week_number(d: date) -> int:
    """Get ISO week number."""
    return d.isocalendar()[1]


def get_saturday_of_week(d: date) -> date:
    """Get the Saturday of the week for a given date."""
    days_until_saturday = (5 - d.weekday()) % 7
    if days_until_saturday == 0 and not is_saturday(d):
        days_until_saturday = 7
    return d + timedelta(days=days_until_saturday)


def get_nth_saturday_of_month(year: int, month: int, n: int) -> date:
    """
    Get the nth Saturday of a given month.
    
    Args:
        year: Year
        month: Month (1-12)
        n: Which Saturday (1-5)
        
    Returns:
        Date of the nth Saturday
        
    Raises:
        ValueError: If the month doesn't have n Saturdays
    """
    # First day of month
    first_day = date(year, month, 1)
    
    # Find first Saturday
    days_until_saturday = (5 - first_day.weekday()) % 7
    if days_until_saturday == 0 and first_day.weekday() != 5:
        days_until_saturday = 7
    
    first_saturday = first_day + timedelta(days=days_until_saturday)
    
    # Get nth Saturday
    target_saturday = first_saturday + timedelta(weeks=n-1)
    
    # Check if still in the same month
    if target_saturday.month != month:
        raise ValueError(f"Month {month}/{year} doesn't have {n} Saturdays")
    
    return target_saturday


def count_saturdays_in_range(start_date: date, end_date: date) -> int:
    """Count number of Saturdays in a date range."""
    count = 0
    current = start_date
    while current <= end_date:
        if is_saturday(current):
            count += 1
        current += timedelta(days=1)
    return count


def get_saturdays_in_range(start_date: date, end_date: date) -> List[date]:
    """Get all Saturdays in a date range."""
    saturdays = []
    current = start_date
    while current <= end_date:
        if is_saturday(current):
            saturdays.append(current)
        current += timedelta(days=1)
    return saturdays


def count_weekdays_in_range(start_date: date, end_date: date, exclude_saturdays: bool = True) -> int:
    """
    Count weekdays (Monday-Friday or Monday-Saturday) in a date range.
    
    Args:
        start_date: Start date
        end_date: End date
        exclude_saturdays: If True, only count Mon-Fri
        
    Returns:
        Count of weekdays
    """
    count = 0
    current = start_date
    while current <= end_date:
        if is_sunday(current):
            current += timedelta(days=1)
            continue
        if exclude_saturdays and is_saturday(current):
            current += timedelta(days=1)
            continue
        count += 1
        current += timedelta(days=1)
    return count


def format_date_display(d: date) -> str:
    """Format date for display (e.g., '15 Jan 2024')."""
    return d.strftime("%d %b %Y")


def parse_date_string(date_str: str, format_str: str = "%Y-%m-%d") -> date:
    """Parse date string to date object."""
    from datetime import datetime
    return datetime.strptime(date_str, format_str).date()
