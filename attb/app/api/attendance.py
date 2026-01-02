from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import date
from app.models.class_instance import ClassInstance, ClassInstanceUpdate, ClassGenerationResponse
from app.models.attendance import OverallAttendance, AttendanceWarning
from app.services.class_generator import ClassGenerator
from app.services.attendance_service import AttendanceService
from app.api.calendar import _calendar_storage
from app.api.timetable import _timetable_storage
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# In-memory storage for classes
_classes_storage: List[ClassInstance] = []


@router.post(
    "/generate",
    response_model=ClassGenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate class instances"
)
async def generate_classes():
    """
    Generate all class instances from calendar and timetable.
    
    Requires:
    - Calendar must be uploaded first
    - Timetable must be uploaded first
    
    Creates individual class instances that can be tracked for attendance.
    """
    if _calendar_storage is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calendar not found. Please upload calendar first."
        )
    
    if _timetable_storage is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timetable not found. Please upload timetable first."
        )
    
    try:
        generator = ClassGenerator()
        response = generator.generate_classes(_calendar_storage, _timetable_storage)
        
        # Store classes
        global _classes_storage
        _classes_storage = response.classes
        
        logger.info(f"Generated {response.total_classes} class instances")
        return response
        
    except Exception as e:
        logger.error(f"Error generating classes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate classes: {str(e)}"
        )


@router.get(
    "/classes",
    response_model=List[ClassInstance],
    summary="Get all class instances"
)
async def get_classes(
    subject_code: Optional[str] = Query(None, description="Filter by subject code"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date")
):
    """
    Get all class instances with optional filters.
    """
    if not _classes_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No classes found. Generate classes first."
        )
    
    filtered_classes = _classes_storage
    
    # Apply filters
    if subject_code:
        filtered_classes = [c for c in filtered_classes if c.subject_code == subject_code]
    
    if start_date:
        filtered_classes = [c for c in filtered_classes if c.date >= start_date]
    
    if end_date:
        filtered_classes = [c for c in filtered_classes if c.date <= end_date]
    
    return filtered_classes


@router.get(
    "/classes/{class_id}",
    response_model=ClassInstance,
    summary="Get a specific class instance"
)
async def get_class(class_id: str):
    """
    Get a specific class instance by ID.
    """
    class_instance = next((c for c in _classes_storage if c.id == class_id), None)
    
    if not class_instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found"
        )
    
    return class_instance


@router.patch(
    "/classes/{class_id}",
    response_model=ClassInstance,
    summary="Update class instance status"
)
async def update_class_status(class_id: str, update: ClassInstanceUpdate):
    """
    Update the status of a class instance (mark as present/absent/cancelled).
    """
    class_instance = next((c for c in _classes_storage if c.id == class_id), None)
    
    if not class_instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found"
        )
    
    # Update status
    class_instance.status = update.status
    
    logger.info(f"Updated class {class_id} to {update.status}")
    return class_instance


@router.post(
    "/classes/bulk-update",
    summary="Bulk update class statuses"
)
async def bulk_update_classes(updates: dict[str, str]):
    """
    Update multiple class statuses at once.
    
    Body: {"class_id": "status", ...}
    """
    updated_count = 0
    errors = []
    
    for class_id, new_status in updates.items():
        class_instance = next((c for c in _classes_storage if c.id == class_id), None)
        
        if class_instance:
            try:
                class_instance.status = new_status
                updated_count += 1
            except Exception as e:
                errors.append({"class_id": class_id, "error": str(e)})
        else:
            errors.append({"class_id": class_id, "error": "Not found"})
    
    return {
        "updated": updated_count,
        "total": len(updates),
        "errors": errors
    }


@router.get(
    "/summary",
    response_model=OverallAttendance,
    summary="Get attendance summary"
)
async def get_attendance_summary(
    current_date: Optional[date] = Query(None, description="Reference date (defaults to today)")
):
    """
    Get overall attendance summary with per-subject breakdown.
    """
    if not _classes_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No classes found. Generate classes first."
        )
    
    service = AttendanceService()
    attendance = service.calculate_attendance(_classes_storage, current_date)
    
    return attendance


@router.get(
    "/warnings",
    response_model=List[AttendanceWarning],
    summary="Get attendance warnings"
)
async def get_warnings(
    current_date: Optional[date] = Query(None, description="Reference date (defaults to today)")
):
    """
    Get attendance warnings for subjects with issues.
    """
    if not _classes_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No classes found. Generate classes first."
        )
    
    service = AttendanceService()
    attendance = service.calculate_attendance(_classes_storage, current_date)
    warnings = service.generate_warnings(attendance)
    
    return warnings


@router.delete(
    "/classes",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear all classes"
)
async def clear_classes():
    """
    Clear all stored class instances.
    """
    global _classes_storage
    _classes_storage = []
    logger.info("All classes cleared")
