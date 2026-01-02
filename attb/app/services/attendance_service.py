from typing import List, Dict
from datetime import date
from collections import defaultdict
from app.models.class_instance import ClassInstance
from app.models.attendance import (
    SubjectAttendance, OverallAttendance, AttendanceWarning
)
from app.core.constants import ClassStatus, MINIMUM_ATTENDANCE_PERCENTAGE
from app.utils.calculations import (
    calculate_percentage,
    calculate_classes_needed_for_threshold,
    calculate_classes_can_miss,
    get_attendance_status
)


class AttendanceService:
    """Service for calculating attendance statistics and warnings."""
    
    def calculate_attendance(
        self,
        classes: List[ClassInstance],
        current_date: date = None
    ) -> OverallAttendance:
        """
        Calculate overall attendance from class instances.
        
        Args:
            classes: List of all class instances
            current_date: Current date (defaults to today)
            
        Returns:
            Overall attendance with per-subject breakdown
        """
        if current_date is None:
            current_date = date.today()
        
        # Group classes by subject
        classes_by_subject = defaultdict(list)
        for class_inst in classes:
            classes_by_subject[class_inst.subject_code].append(class_inst)
        
        # Calculate per-subject attendance
        subject_attendances = []
        total_attended = 0
        total_absent = 0
        total_cancelled = 0
        total_scheduled = 0
        total_classes_count = 0
        
        for subject_code, subject_classes in classes_by_subject.items():
            subject_att = self._calculate_subject_attendance(
                subject_code,
                subject_classes,
                current_date
            )
            subject_attendances.append(subject_att)
            
            total_attended += subject_att.attended
            total_absent += subject_att.absent
            total_cancelled += subject_att.cancelled
            total_scheduled += subject_att.scheduled
            total_classes_count += subject_att.total_classes
        
        # Calculate overall percentage (excluding cancelled and future)
        completed_classes = total_attended + total_absent
        overall_percentage = calculate_percentage(total_attended, completed_classes)
        overall_status = get_attendance_status(overall_percentage)
        
        return OverallAttendance(
            total_classes=total_classes_count,
            attended=total_attended,
            absent=total_absent,
            cancelled=total_cancelled,
            scheduled=total_scheduled,
            overall_percentage=overall_percentage,
            status=overall_status,
            subjects=subject_attendances
        )
    
    def _calculate_subject_attendance(
        self,
        subject_code: str,
        classes: List[ClassInstance],
        current_date: date
    ) -> SubjectAttendance:
        """Calculate attendance for a single subject."""
        # Count by status
        attended = sum(1 for c in classes if c.status == ClassStatus.PRESENT)
        absent = sum(1 for c in classes if c.status == ClassStatus.ABSENT)
        cancelled = sum(1 for c in classes if c.status == ClassStatus.CANCELLED)
        scheduled = sum(
            1 for c in classes
            if c.status == ClassStatus.SCHEDULED and c.date >= current_date
        )
        
        # Total classes (excluding cancelled)
        total_classes = len(classes)
        completed_classes = attended + absent
        
        # Calculate percentage
        percentage = calculate_percentage(attended, completed_classes)
        status = get_attendance_status(percentage)
        
        # Calculate metrics
        classes_needed = calculate_classes_needed_for_threshold(
            attended, completed_classes, MINIMUM_ATTENDANCE_PERCENTAGE
        )
        
        classes_can_skip = calculate_classes_can_miss(
            attended, completed_classes, scheduled, MINIMUM_ATTENDANCE_PERCENTAGE
        )
        
        # Get subject name (from first class)
        subject_name = classes[0].subject_name if classes else subject_code
        
        return SubjectAttendance(
            subject_code=subject_code,
            subject_name=subject_name,
            total_classes=total_classes,
            attended=attended,
            absent=absent,
            cancelled=cancelled,
            scheduled=scheduled,
            percentage=percentage,
            status=status,
            classes_needed_for_75=classes_needed,
            classes_can_miss=classes_can_skip
        )
    
    def generate_warnings(
        self,
        attendance: OverallAttendance
    ) -> List[AttendanceWarning]:
        """
        Generate warnings for subjects with attendance issues.
        
        Args:
            attendance: Overall attendance data
            
        Returns:
            List of warnings
        """
        warnings = []
        
        for subject in attendance.subjects:
            # Critical: Below 75%
            if subject.percentage < MINIMUM_ATTENDANCE_PERCENTAGE:
                warnings.append(AttendanceWarning(
                    subject_code=subject.subject_code,
                    subject_name=subject.subject_name,
                    current_percentage=subject.percentage,
                    message=f"Attendance is below 75% threshold",
                    severity="critical",
                    recommendation=f"Must attend next {subject.classes_needed_for_75} classes to reach 75%"
                ))
            
            # Warning: Between 75-80%
            elif MINIMUM_ATTENDANCE_PERCENTAGE <= subject.percentage < 80:
                warnings.append(AttendanceWarning(
                    subject_code=subject.subject_code,
                    subject_name=subject.subject_name,
                    current_percentage=subject.percentage,
                    message=f"Attendance is in warning zone",
                    severity="warning",
                    recommendation=f"Can miss only {subject.classes_can_miss} more classes"
                ))
            
            # Info: Safe but should monitor
            elif 80 <= subject.percentage < 85:
                warnings.append(AttendanceWarning(
                    subject_code=subject.subject_code,
                    subject_name=subject.subject_name,
                    current_percentage=subject.percentage,
                    message=f"Attendance is healthy but monitor carefully",
                    severity="info",
                    recommendation=f"Can miss up to {subject.classes_can_miss} classes"
                ))
        
        return warnings
    
    def get_at_risk_subjects(
        self,
        attendance: OverallAttendance,
        threshold: float = MINIMUM_ATTENDANCE_PERCENTAGE + 5
    ) -> List[str]:
        """
        Get subjects that are at risk (within 5% of threshold).
        
        Args:
            attendance: Overall attendance
            threshold: Risk threshold (default 80%)
            
        Returns:
            List of at-risk subject codes
        """
        return [
            subject.subject_code
            for subject in attendance.subjects
            if subject.percentage < threshold
        ]
