from typing import List, Optional
from datetime import date
from app.models.class_instance import ClassInstance
from app.models.attendance import AttendanceProjection, AttendanceWarning
from app.models.planner import (
    WhatIfScenario, WhatIfResponse, SkipRecommendation,
    PlannerSummary, OptimizationSuggestion
)
from app.services.attendance_service import AttendanceService
from app.services.class_generator import ClassGenerator
from app.core.constants import ClassStatus, MINIMUM_ATTENDANCE_PERCENTAGE
from app.utils.calculations import (
    simulate_attendance_change,
    calculate_classes_can_miss,
    get_attendance_status
)
from collections import defaultdict


class PlannerService:
    """Service for attendance planning and what-if simulations."""
    
    def __init__(self):
        self.attendance_service = AttendanceService()
        self.class_generator = ClassGenerator()
    
    def simulate_what_if(
        self,
        classes: List[ClassInstance],
        scenario: WhatIfScenario,
        current_date: date = None
    ) -> WhatIfResponse:
        """
        Simulate a what-if scenario for attendance planning.
        
        Args:
            classes: All class instances
            scenario: What-if scenario to simulate
            current_date: Current date (defaults to today)
            
        Returns:
            Simulation results with projections
        """
        if current_date is None:
            current_date = date.today()
        
        # Get current attendance
        current_attendance = self.attendance_service.calculate_attendance(
            classes, current_date
        )
        
        # Filter subjects to simulate
        subjects_to_simulate = (
            [scenario.subject_code] if scenario.subject_code
            else [s.subject_code for s in current_attendance.subjects]
        )
        
        projections = []
        warnings = []
        
        for subject_code in subjects_to_simulate:
            # Get subject's current attendance
            subject_att = next(
                (s for s in current_attendance.subjects if s.subject_code == subject_code),
                None
            )
            
            if not subject_att:
                continue
            
            # Simulate changes
            current_pct, projected_pct = simulate_attendance_change(
                subject_att.attended,
                subject_att.attended + subject_att.absent,
                scenario.classes_to_attend,
                scenario.classes_to_skip
            )
            
            # Create projection
            projection = AttendanceProjection(
                subject_code=subject_code,
                current_percentage=current_pct,
                projected_percentage=projected_pct,
                change=projected_pct - current_pct,
                classes_simulated=scenario.classes_to_attend + scenario.classes_to_skip,
                will_meet_threshold=projected_pct >= MINIMUM_ATTENDANCE_PERCENTAGE
            )
            projections.append(projection)
            
            # Generate warnings if projection is problematic
            if projected_pct < MINIMUM_ATTENDANCE_PERCENTAGE:
                warnings.append(AttendanceWarning(
                    subject_code=subject_code,
                    subject_name=subject_att.subject_name,
                    current_percentage=projected_pct,
                    message="Projected attendance will be below 75%",
                    severity="critical",
                    recommendation="Attend more classes to stay above threshold"
                ))
        
        return WhatIfResponse(
            scenario=scenario,
            projections=projections,
            warnings=warnings
        )
    
    def get_skip_recommendations(
        self,
        classes: List[ClassInstance],
        current_date: date = None
    ) -> List[SkipRecommendation]:
        """
        Get recommendations for which classes can be safely skipped.
        
        Args:
            classes: All class instances
            current_date: Current date
            
        Returns:
            Skip recommendations per subject
        """
        if current_date is None:
            current_date = date.today()
        
        attendance = self.attendance_service.calculate_attendance(classes, current_date)
        recommendations = []
        
        for subject in attendance.subjects:
            max_skip = calculate_classes_can_miss(
                subject.attended,
                subject.attended + subject.absent,
                subject.scheduled,
                MINIMUM_ATTENDANCE_PERCENTAGE
            )
            
            # Calculate percentage after skipping max allowed
            if subject.scheduled > 0:
                final_attended = subject.attended
                final_total = subject.attended + subject.absent + subject.scheduled
                pct_after = (final_attended / final_total) * 100 if final_total > 0 else 0
            else:
                pct_after = subject.percentage
            
            is_safe = max_skip > 0 and pct_after >= MINIMUM_ATTENDANCE_PERCENTAGE
            
            recommendations.append(SkipRecommendation(
                subject_code=subject.subject_code,
                subject_name=subject.subject_name,
                current_percentage=subject.percentage,
                max_classes_can_skip=max_skip,
                remaining_classes=subject.scheduled,
                percentage_after_skips=round(pct_after, 2),
                is_safe=is_safe
            ))
        
        return recommendations
    
    def get_planner_summary(
        self,
        classes: List[ClassInstance],
        semester_end: date,
        current_date: date = None
    ) -> PlannerSummary:
        """
        Get comprehensive planner summary.
        
        Args:
            classes: All class instances
            semester_end: Semester end date
            current_date: Current date
            
        Returns:
            Planner summary
        """
        if current_date is None:
            current_date = date.today()
        
        attendance = self.attendance_service.calculate_attendance(classes, current_date)
        skip_recs = self.get_skip_recommendations(classes, current_date)
        
        # Days remaining
        days_remaining = (semester_end - current_date).days
        
        # Subjects at risk
        subjects_at_risk = [
            s.subject_code for s in attendance.subjects
            if s.percentage < MINIMUM_ATTENDANCE_PERCENTAGE + 5
        ]
        
        # Safe to skip
        safe_to_skip = [rec for rec in skip_recs if rec.is_safe]
        
        # Must attend (can't miss any)
        must_attend = [
            s.subject_code for s in attendance.subjects
            if s.classes_can_miss == 0 and s.scheduled > 0
        ]
        
        return PlannerSummary(
            current_date=current_date,
            days_remaining=days_remaining,
            subjects_at_risk=subjects_at_risk,
            safe_to_skip=safe_to_skip,
            must_attend=must_attend
        )
    
    def get_optimization_suggestions(
        self,
        classes: List[ClassInstance],
        current_date: date = None
    ) -> List[OptimizationSuggestion]:
        """
        Get AI-powered suggestions for optimizing attendance.
        
        Args:
            classes: All class instances
            current_date: Current date
            
        Returns:
            List of optimization suggestions
        """
        if current_date is None:
            current_date = date.today()
        
        attendance = self.attendance_service.calculate_attendance(classes, current_date)
        suggestions = []
        
        for subject in attendance.subjects:
            # Critical: Below 75%
            if subject.percentage < MINIMUM_ATTENDANCE_PERCENTAGE:
                suggestions.append(OptimizationSuggestion(
                    subject_code=subject.subject_code,
                    subject_name=subject.subject_name,
                    suggestion_type="critical",
                    current_percentage=subject.percentage,
                    target_percentage=MINIMUM_ATTENDANCE_PERCENTAGE,
                    actions_needed=subject.classes_needed_for_75,
                    description=f"URGENT: Must attend next {subject.classes_needed_for_75} "
                               f"classes without fail to reach 75%"
                ))
            
            # At risk: Between 75-80%
            elif MINIMUM_ATTENDANCE_PERCENTAGE <= subject.percentage < 80:
                suggestions.append(OptimizationSuggestion(
                    subject_code=subject.subject_code,
                    subject_name=subject.subject_name,
                    suggestion_type="attend_more",
                    current_percentage=subject.percentage,
                    target_percentage=85.0,
                    actions_needed=max(0, subject.classes_needed_for_75),
                    description=f"Recommended: Attend more classes to build buffer. "
                               f"Currently can only miss {subject.classes_can_miss} classes."
                ))
            
            # Safe: Above 85%
            elif subject.percentage >= 85:
                suggestions.append(OptimizationSuggestion(
                    subject_code=subject.subject_code,
                    subject_name=subject.subject_name,
                    suggestion_type="safe_to_skip",
                    current_percentage=subject.percentage,
                    target_percentage=MINIMUM_ATTENDANCE_PERCENTAGE,
                    actions_needed=subject.classes_can_miss,
                    description=f"Safe: Can skip up to {subject.classes_can_miss} classes "
                               f"while staying above 75%"
                ))
        
        return suggestions
