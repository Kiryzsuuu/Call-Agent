@echo off
echo Starting Frontend...

echo.
echo Starting Next.js Frontend on port 3000...
cd web
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Frontend Started!
echo ========================================
echo Frontend: http://localhost:3000
echo Make sure backend is running on port 8002
echo ========================================
pause