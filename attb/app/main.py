from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.api.router import api_router

# Setup logging
setup_logging("INFO" if not settings.DEBUG else "DEBUG")
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## Attendance Planner Backend
    
    The single source of truth for attendance logic, modeling real college 
    attendance rules, processing academic calendar and timetable data, and 
    providing reliable attendance calculations and predictive simulations.
    
    ### Key Features
    - 📅 Academic calendar processing with holidays and working Saturdays
    - 📚 Timetable validation and normalization
    - 🎯 Automated class instance generation
    - 📊 Real-time attendance calculation (75% rule)
    - 🔮 What-if simulations for attendance planning
    - ⚠️ Smart attendance warnings and recommendations
    
    ### Workflow
    1. Upload academic calendar → `/api/calendar/`
    2. Upload timetable → `/api/timetable/`
    3. Generate class instances → `/api/attendance/generate`
    4. Mark attendance → `/api/attendance/classes/{id}`
    5. Get analytics → `/api/attendance/summary`
    6. Plan ahead → `/api/planner/what-if`
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - Allow access from any device on local network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ALLOW_ALL_ORIGINS else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - Health check.
    """
    return {
        "message": "Attendance Planner Backend API",
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/health", tags=["Root"])
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.on_event("startup")
async def startup_event():
    """
    Run on application startup.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"CORS origins: {settings.cors_origins}")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Run on application shutdown.
    """
    logger.info(f"Shutting down {settings.APP_NAME}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
