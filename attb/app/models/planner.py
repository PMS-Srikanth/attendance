from typing import List, Dict, Optional
from datetime import date
from pydantic import BaseModel, Field
from app.models.attendance import AttendanceProjection, AttendanceWarning


class WhatIfScenario(BaseModel):
    """Input for what-if simulation."""
    subject_code: Optional[str] = None  # If None, applies to all subjects
    classes_to_attend: int = 0
    classes_to_skip: int = 0


class WhatIfResponse(BaseModel):
    """Response from what-if simulation."""
    scenario: WhatIfScenario
    projections: List[AttendanceProjection]
    warnings: List[AttendanceWarning]


class SkipRecommendation(BaseModel):
    """Recommendation for which classes can be safely skipped."""
    subject_code: str
    subject_name: str
    current_percentage: float
    max_classes_can_skip: int
    remaining_classes: int
    percentage_after_skips: float
    is_safe: bool


class PlannerSummary(BaseModel):
    """Summary of attendance planning options."""
    current_date: date
    days_remaining: int
    subjects_at_risk: List[str]
    safe_to_skip: List[SkipRecommendation]
    must_attend: List[str]  # Subjects that can't afford any more absences


class OptimizationSuggestion(BaseModel):
    """Suggestions for optimizing attendance."""
    subject_code: str
    subject_name: str
    suggestion_type: str  # "attend_more", "safe_to_skip", "critical"
    current_percentage: float
    target_percentage: float
    actions_needed: int  # Number of classes to attend/skip
    description: str
