@echo off
echo Starting Backend Services...

cd agent

echo Starting PDF API...
start "PDF API" uvicorn pdf_api:app --reload --host 0.0.0.0 --port 8002

echo Starting LiveKit Agent...
start "LiveKit Agent" python main.py dev

echo Backend services started!
echo PDF API: http://localhost:8002
echo API Docs: http://localhost:8002/docs