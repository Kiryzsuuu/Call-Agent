@echo off
echo Starting Backend Services...

echo.
echo 1. Starting PDF API on port 8002...
cd agent
start "Backend API" cmd /k "uvicorn pdf_api:app --reload --host 0.0.0.0 --port 8002"

timeout /t 3 /nobreak

echo.
echo 2. Starting LiveKit Agent...
start "LiveKit Agent" cmd /k "python main.py dev"

echo.
echo ========================================
echo Backend Services Started!
echo ========================================
echo PDF API: http://localhost:8002
echo LiveKit Agent: Running
echo API Documentation: http://localhost:8002/docs
echo ========================================
pause