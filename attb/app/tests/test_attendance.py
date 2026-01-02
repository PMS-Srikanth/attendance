import pytest
from app.utils.calculations import (
    calculate_percentage,
    calculate_classes_needed_for_threshold,
    calculate_classes_can_miss,
    get_attendance_status,
    simulate_attendance_change
)
from app.core.constants import AttendanceStatus


def test_calculate_percentage():
    """Test percentage calculation."""
    assert calculate_percentage(75, 100) == 75.0
    assert calculate_percentage(0, 100) == 0.0
    assert calculate_percentage(100, 100) == 100.0
    assert calculate_percentage(0, 0) == 0.0
    assert calculate_percentage(3, 4) == 75.0


def test_classes_needed_for_threshold():
    """Test calculation of classes needed to reach 75%."""
    # Already above threshold
    assert calculate_classes_needed_for_threshold(80, 100, 75) == 0
    
    # Below threshold - need to attend classes
    # Current: 60/100 = 60%
    # Need: (60 + x) / (100 + x) >= 0.75
    # x >= 40
    result = calculate_classes_needed_for_threshold(60, 100, 75)
    assert result == 40
    
    # Another scenario: 50/100 = 50%
    result = calculate_classes_needed_for_threshold(50, 100, 75)
    assert result == 67  # Need 67 more classes


def test_classes_can_miss():
    """Test calculation of classes that can be missed."""
    # Current: 90/100 = 90%, 20 future classes
    # Can miss some while staying above 75%
    result = calculate_classes_can_miss(90, 100, 20, 75)
    assert result >= 0
    
    # Current: 75/100 = 75%, 10 future classes
    # At threshold, can't miss any
    result = calculate_classes_can_miss(75, 100, 10, 75)
    assert result == 0
    
    # Current: 100/100 = 100%, 10 future classes
    result = calculate_classes_can_miss(100, 100, 10, 75)
    assert result == 10  # Can miss all future classes


def test_get_attendance_status():
    """Test attendance status determination."""
    assert get_attendance_status(90) == AttendanceStatus.SAFE
    assert get_attendance_status(80) == AttendanceStatus.SAFE
    assert get_attendance_status(77) == AttendanceStatus.WARNING
    assert get_attendance_status(75) == AttendanceStatus.WARNING
    assert get_attendance_status(72) == AttendanceStatus.AT_RISK
    assert get_attendance_status(60) == AttendanceStatus.CRITICAL


def test_simulate_attendance_change():
    """Test attendance change simulation."""
    # Current: 70/100 = 70%
    # Attend 10 more: 80/110 = 72.73%
    current, projected = simulate_attendance_change(70, 100, 10, 0)
    
    assert current == 70.0
    assert 72 <= projected <= 73
    
    # Skip 5 classes: 70/105 = 66.67%
    current, projected = simulate_attendance_change(70, 100, 0, 5)
    assert projected < current
