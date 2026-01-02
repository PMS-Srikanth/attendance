from fastapi import APIRouter, HTTPException, status
from app.models.calendar import CalendarInput, CalendarResponse, CalendarSummary
from app.services.calendar_service import CalendarService
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# In-memory storage (will be replaced with database in v2)
_calendar_storage: CalendarResponse = None


@router.post(
    "/",
    response_model=CalendarResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process academic calendar"
)
async def upload_calendar(calendar_input: CalendarInput):
    """
    Upload and process the academic calendar.
    
    This endpoint accepts:
    - Semester start and end dates
    - List of holidays
    - Working Saturday configurations
    
    Returns a processed calendar with all days classified.
    """
    try:
        service = CalendarService()
        calendar_response = service.process_calendar(calendar_input)
        
        # Store in memory
        global _calendar_storage
        _calendar_storage = calendar_response
        
        logger.info(f"Calendar processed: {calendar_response.working_days} working days")
        return calendar_response
        
    except Exception as e:
        logger.error(f"Error processing calendar: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process calendar: {str(e)}"
        )


@router.get(
    "/",
    response_model=CalendarResponse,
    summary="Get current calendar"
)
async def get_calendar():
    """
    Retrieve the currently stored calendar.
    """
    if _calendar_storage is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No calendar found. Please upload a calendar first."
        )
    
    return _calendar_storage


@router.get(
    "/summary",
    response_model=CalendarSummary,
    summary="Get calendar summary statistics"
)
async def get_calendar_summary():
    """
    Get summary statistics of the calendar.
    """
    if _calendar_storage is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No calendar found. Please upload a calendar first."
        )
    
    service = CalendarService()
    summary = service.get_summary(_calendar_storage)
    return summary


@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear calendar"
)
async def clear_calendar():
    """
    Clear the stored calendar.
    """
    global _calendar_storage
    _calendar_storage = None
    logger.info("Calendar cleared")
