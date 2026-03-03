from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import date
from app.models.planner import (
    WhatIfScenario, WhatIfResponse, SkipRecommendation,
    PlannerSummary, OptimizationSuggestion
)
from app.services.planner_service import PlannerService
import app.api.attendance as attendance_mod
import app.api.calendar as calendar_mod
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post(
    "/what-if",
    response_model=WhatIfResponse,
    summary="Simulate what-if scenario"
)
async def simulate_what_if(
    scenario: WhatIfScenario,
    current_date: Optional[date] = Query(None, description="Reference date (defaults to today)")
):
    """
    Simulate a what-if scenario for attendance planning.
    
    Example scenarios:
    - "What if I attend next 5 classes of CS101?"
    - "What if I skip 2 classes across all subjects?"
    - "What if I attend 3 and skip 1?"
    """
    if not attendance_mod._classes_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No classes found. Generate classes first."
        )
    
    try:
        service = PlannerService()
        response = service.simulate_what_if(attendance_mod._classes_storage, scenario, current_date)
        
        logger.info(f"What-if simulation: attend={scenario.classes_to_attend}, skip={scenario.classes_to_skip}")
        return response
        
    except Exception as e:
        logger.error(f"Error in what-if simulation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}"
        )


@router.get(
    "/skip-recommendations",
    response_model=List[SkipRecommendation],
    summary="Get skip recommendations"
)
async def get_skip_recommendations(
    current_date: Optional[date] = Query(None, description="Reference date (defaults to today)")
):
    """
    Get recommendations for which classes can be safely skipped.
    
    Returns per-subject analysis of:
    - How many classes can be skipped
    - Projected percentage after skips
    - Whether it's safe to skip
    """
    if not attendance_mod._classes_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No classes found. Generate classes first."
        )
    
    service = PlannerService()
    recommendations = service.get_skip_recommendations(attendance_mod._classes_storage, current_date)
    
    return recommendations


@router.get(
    "/summary",
    response_model=PlannerSummary,
    summary="Get planner summary"
)
async def get_planner_summary(
    current_date: Optional[date] = Query(None, description="Reference date (defaults to today)")
):
    """
    Get comprehensive planner summary.
    
    Includes:
    - Days remaining in semester
    - Subjects at risk
    - Safe skip recommendations
    - Must-attend subjects
    """
    if not attendance_mod._classes_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No classes found. Generate classes first."
        )
    
    if calendar_mod._calendar_storage is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calendar not found."
        )
    
    service = PlannerService()
    summary = service.get_planner_summary(
        attendance_mod._classes_storage,
        calendar_mod._calendar_storage.semester_end,
        current_date
    )
    
    return summary


@router.get(
    "/suggestions",
    response_model=List[OptimizationSuggestion],
    summary="Get optimization suggestions"
)
async def get_optimization_suggestions(
    current_date: Optional[date] = Query(None, description="Reference date (defaults to today)")
):
    """
    Get AI-powered suggestions for optimizing attendance.
    
    Provides actionable recommendations:
    - Critical: Must attend immediately
    - Warning: Should attend more to build buffer
    - Safe: Can skip X classes
    """
    if not attendance_mod._classes_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No classes found. Generate classes first."
        )
    
    service = PlannerService()
    suggestions = service.get_optimization_suggestions(attendance_mod._classes_storage, current_date)
    
    return suggestions
