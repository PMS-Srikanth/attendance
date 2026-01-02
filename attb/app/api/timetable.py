from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.timetable import TimetableInput, TimetableResponse, SubjectInfo
from app.services.timetable_service import TimetableService
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# In-memory storage
_timetable_storage: TimetableResponse = None


@router.post(
    "/",
    response_model=TimetableResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and validate timetable"
)
async def upload_timetable(timetable_input: TimetableInput):
    """
    Upload and process the weekly timetable.
    
    Accepts:
    - Weekly schedule with classes for each day
    - Time slots, subjects, rooms, instructors
    
    Returns normalized timetable with metadata.
    """
    try:
        service = TimetableService()
        
        # Validate timetable
        validation = service.validate_timetable(timetable_input)
        if not validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Timetable validation failed", "issues": validation["issues"]}
            )
        
        # Process timetable
        timetable_response = service.process_timetable(timetable_input)
        
        # Store in memory
        global _timetable_storage
        _timetable_storage = timetable_response
        
        logger.info(f"Timetable processed: {timetable_response.total_classes_per_week} classes/week")
        return timetable_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing timetable: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process timetable: {str(e)}"
        )


@router.get(
    "/",
    response_model=TimetableResponse,
    summary="Get current timetable"
)
async def get_timetable():
    """
    Retrieve the currently stored timetable.
    """
    if _timetable_storage is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No timetable found. Please upload a timetable first."
        )
    
    return _timetable_storage


@router.get(
    "/subjects",
    response_model=List[SubjectInfo],
    summary="Get subject information"
)
async def get_subjects():
    """
    Get detailed information about all subjects in the timetable.
    """
    if _timetable_storage is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No timetable found. Please upload a timetable first."
        )
    
    service = TimetableService()
    subjects = service.get_subject_info(_timetable_storage)
    return subjects


@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear timetable"
)
async def clear_timetable():
    """
    Clear the stored timetable.
    """
    global _timetable_storage
    _timetable_storage = None
    logger.info("Timetable cleared")
