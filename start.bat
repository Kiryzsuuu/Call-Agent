@echo off
echo Starting Call Agent Services...

start "Backend API" cmd /k "cd agent && python pdf_api.py"
timeout /t 3
start "LiveKit Agent" cmd /k "cd agent && python main.py dev"
timeout /t 3
start "Frontend" cmd /k "cd web && pnpm dev"

echo All services started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8002
pause