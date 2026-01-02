from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App Info
    APP_NAME: str = "Attendance Planner Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://127.0.0.1:5173,http://127.0.0.1:5174"
    ALLOW_ALL_ORIGINS: bool = True  # Allow access from any device on network
    
    # Attendance Rules
    MINIMUM_ATTENDANCE_THRESHOLD: float = 75.0
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
