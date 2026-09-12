@echo off
echo ===================================================
echo   Starting DriftWatch Observability Platform
echo ===================================================
echo.

echo [1/3] Starting Python ML Service (port 8001)...
start "DriftWatch - Python ML" cmd /k "cd /d %~dp0app\python-ml && uvicorn app.main:app --port 8001 --reload"

echo [2/3] Starting Node Backend Control Layer (port 8000)...
start "DriftWatch - Node Backend" cmd /k "cd /d %~dp0app\node-backend && npm run dev"

echo [3/3] Starting Next.js Frontend Dashboard (port 3000)...
start "DriftWatch - Frontend UI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo   All DriftWatch services launched!
echo   - Web Console: http://localhost:3000
echo   - Backend API: http://localhost:8000
echo   - Python ML:   http://localhost:8001
echo ===================================================
pause
