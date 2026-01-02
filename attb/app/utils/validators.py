from typing import List, Any
from datetime import date


def validate_date_range(start: date, end: date) -> bool:
    """Validate that end date is after start date."""
    return end > start


def validate_not_empty(items: List[Any], field_name: str) -> None:
    """Validate that a list is not empty."""
    if not items:
        raise ValueError(f"{field_name} cannot be empty")


def validate_unique(items: List[Any], field_name: str) -> None:
    """Validate that all items in list are unique."""
    if len(items) != len(set(items)):
        raise ValueError(f"{field_name} must contain unique values")


def validate_percentage(value: float, field_name: str = "Percentage") -> None:
    """Validate that percentage is between 0 and 100."""
    if not (0 <= value <= 100):
        raise ValueError(f"{field_name} must be between 0 and 100")


def validate_positive(value: int, field_name: str = "Value") -> None:
    """Validate that value is positive."""
    if value < 0:
        raise ValueError(f"{field_name} must be positive")


def validate_subject_code(code: str) -> bool:
    """
    Validate subject code format.
    Basic validation - can be extended.
    """
    if not code or not code.strip():
        return False
    return True


def validate_time_format(time_str: str) -> bool:
    """
    Validate time format HH:MM.
    """
    import re
    pattern = r'^\d{2}:\d{2}$'
    if not re.match(pattern, time_str):
        return False
    
    # Validate hour and minute ranges
    try:
        hour, minute = map(int, time_str.split(':'))
        return 0 <= hour <= 23 and 0 <= minute <= 59
    except:
        return False


def validate_time_range(start_time: str, end_time: str) -> bool:
    """Validate that end_time is after start_time."""
    if not (validate_time_format(start_time) and validate_time_format(end_time)):
        return False
    
    start_hour, start_min = map(int, start_time.split(':'))
    end_hour, end_min = map(int, end_time.split(':'))
    
    start_minutes = start_hour * 60 + start_min
    end_minutes = end_hour * 60 + end_min
    
    return end_minutes > start_minutes
