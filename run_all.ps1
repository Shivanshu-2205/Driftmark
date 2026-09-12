# DriftWatch Multi-Service Launcher (PowerShell)
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Starting DriftWatch Observability Platform" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""

$root = $PSScriptRoot

Write-Host "[1/3] Launching Python ML Engine (port 8001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\app\python-ml'; uvicorn app.main:app --port 8001 --reload"

Write-Host "[2/3] Launching Node Backend Control Layer (port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\app\node-backend'; npm run dev"

Write-Host "[3/3] Launching Next.js Web Console (port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  All services launched in separate windows!" -ForegroundColor Green
Write-Host "  Dashboard:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "  API Server: http://localhost:8000" -ForegroundColor Yellow
Write-Host "  ML Worker:  http://localhost:8001" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Green
