from enum import Enum


# Attendance Threshold
MINIMUM_ATTENDANCE_PERCENTAGE = 75.0
ATTENDANCE_WARNING_BUFFER = 5.0  # Warn when within 5% of threshold


class AttendanceStatus(str, Enum):
    """Attendance status indicators."""
    SAFE = "safe"               # Above 80%
    WARNING = "warning"         # Between 75-80%
    CRITICAL = "critical"       # Below 75%
    AT_RISK = "at_risk"        # Close to falling below 75%


class ClassStatus(str, Enum):
    """Class instance status."""
    SCHEDULED = "scheduled"     # Future class
    PRESENT = "present"         # Attended
    ABSENT = "absent"          # Missed
    CANCELLED = "cancelled"     # Class cancelled


class DayType(str, Enum):
    """Day types in academic calendar."""
    WORKING = "working"
    HOLIDAY = "holiday"
    SATURDAY_WORKING = "saturday_working"
    SATURDAY_HOLIDAY = "saturday_holiday"
    SUNDAY = "sunday"


class SaturdayType(str, Enum):
    """Saturday working patterns."""
    FIRST = "1st"
    SECOND = "2nd"
    THIRD = "3rd"
    FOURTH = "4th"
    FIFTH = "5th"
    ALL = "all"


# Timetable Constants
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
TIME_SLOT_PATTERN = r"^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$"  # e.g., "9:00 - 10:00"

# Date Format
DATE_FORMAT = "%Y-%m-%d"
DISPLAY_DATE_FORMAT = "%d %b %Y"
