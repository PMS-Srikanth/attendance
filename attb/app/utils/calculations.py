from typing import List, Tuple
from app.core.constants import MINIMUM_ATTENDANCE_PERCENTAGE, AttendanceStatus


def calculate_percentage(attended: int, total: int) -> float:
    """
    Calculate attendance percentage.
    
    Args:
        attended: Number of classes attended
        total: Total number of classes (excluding cancelled)
        
    Returns:
        Percentage (0-100)
    """
    if total == 0:
        return 0.0
    return round((attended / total) * 100, 2)


def calculate_classes_needed_for_threshold(
    current_attended: int,
    current_total: int,
    threshold: float = MINIMUM_ATTENDANCE_PERCENTAGE
) -> int:
    """
    Calculate how many consecutive classes need to be attended to reach threshold.
    
    Formula: If we attend next x classes:
    (current_attended + x) / (current_total + x) >= threshold/100
    
    Solving for x:
    x >= (threshold * current_total - 100 * current_attended) / (100 - threshold)
    
    Args:
        current_attended: Classes attended so far
        current_total: Total classes so far
        threshold: Target percentage (default 75%)
        
    Returns:
        Number of classes to attend (0 if already above threshold)
    """
    current_percentage = calculate_percentage(current_attended, current_total)
    
    if current_percentage >= threshold:
        return 0
    
    if threshold >= 100:
        return float('inf')  # Impossible to reach 100%
    
    # Calculate using the formula
    numerator = (threshold * current_total) - (100 * current_attended)
    denominator = 100 - threshold
    
    classes_needed = numerator / denominator
    
    return max(0, int(classes_needed) + (1 if classes_needed % 1 > 0 else 0))


def calculate_classes_can_miss(
    current_attended: int,
    current_total: int,
    future_classes: int,
    threshold: float = MINIMUM_ATTENDANCE_PERCENTAGE
) -> int:
    """
    Calculate how many future classes can be missed while staying above threshold.
    
    Args:
        current_attended: Classes attended so far
        current_total: Total classes so far
        future_classes: Number of remaining scheduled classes
        threshold: Minimum percentage threshold
        
    Returns:
        Number of classes that can be missed
    """
    if future_classes == 0:
        return 0
    
    # Try missing classes one by one
    can_miss = 0
    for missed in range(future_classes + 1):
        final_attended = current_attended
        final_total = current_total + future_classes
        final_percentage = calculate_percentage(final_attended, final_total)
        
        if final_percentage >= threshold:
            can_miss = missed
        else:
            break
    
    return can_miss


def get_attendance_status(percentage: float) -> AttendanceStatus:
    """
    Determine attendance status based on percentage.
    
    Args:
        percentage: Attendance percentage
        
    Returns:
        AttendanceStatus enum
    """
    if percentage >= 80:
        return AttendanceStatus.SAFE
    elif percentage >= MINIMUM_ATTENDANCE_PERCENTAGE:
        return AttendanceStatus.WARNING
    elif percentage >= MINIMUM_ATTENDANCE_PERCENTAGE - 5:
        return AttendanceStatus.AT_RISK
    else:
        return AttendanceStatus.CRITICAL


def simulate_attendance_change(
    current_attended: int,
    current_total: int,
    classes_to_attend: int,
    classes_to_miss: int
) -> Tuple[float, float]:
    """
    Simulate attendance change.
    
    Args:
        current_attended: Current attended count
        current_total: Current total count
        classes_to_attend: Number of future classes to attend
        classes_to_miss: Number of future classes to miss
        
    Returns:
        Tuple of (current_percentage, projected_percentage)
    """
    current_percentage = calculate_percentage(current_attended, current_total)
    
    new_attended = current_attended + classes_to_attend
    new_total = current_total + classes_to_attend + classes_to_miss
    
    projected_percentage = calculate_percentage(new_attended, new_total)
    
    return current_percentage, projected_percentage


def calculate_required_attendance_rate(
    current_attended: int,
    current_total: int,
    remaining_classes: int,
    target_percentage: float = MINIMUM_ATTENDANCE_PERCENTAGE
) -> float:
    """
    Calculate what percentage of remaining classes must be attended to reach target.
    
    Args:
        current_attended: Classes attended so far
        current_total: Total classes so far
        remaining_classes: Number of remaining classes
        target_percentage: Target attendance percentage
        
    Returns:
        Required attendance rate for remaining classes (0-100)
    """
    if remaining_classes == 0:
        return 0.0
    
    # Final total classes
    final_total = current_total + remaining_classes
    
    # Need this many total attended
    required_attended = (target_percentage / 100) * final_total
    
    # Need to attend this many of remaining
    need_to_attend = required_attended - current_attended
    
    # As a percentage of remaining
    required_rate = (need_to_attend / remaining_classes) * 100
    
    return round(max(0, min(100, required_rate)), 2)
