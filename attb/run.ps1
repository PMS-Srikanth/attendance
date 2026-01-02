# Attendance Planner Backend - Run Script for Windows
# This script starts the FastAPI development server

Write-Host "Starting Attendance Planner Backend..." -ForegroundColor Green

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Virtual environment created!" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# Install dependencies if needed
Write-Host "Checking dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet

# Run the server
Write-Host "`nStarting server on http://localhost:8000" -ForegroundColor Green
Write-Host "API Documentation: http://localhost:8000/docs`n" -ForegroundColor Cyan

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
