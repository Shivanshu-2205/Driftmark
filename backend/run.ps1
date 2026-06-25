# Run from backend/ directory
$ErrorActionPreference = "Stop"

Write-Host "Installing dependencies..." -ForegroundColor Green
pip install fastapi uvicorn scipy scikit-learn pandas numpy sqlalchemy python-multipart pydantic -q

Write-Host "Generating synthetic data (if not present)..." -ForegroundColor Green
if (-not (Test-Path "data/baseline.csv")) {
    python generate_data.py
}

Write-Host "Training baseline model (if not present)..." -ForegroundColor Green
if (-not (Test-Path "models/model.pkl")) {
    python train_model.py
}

Write-Host "Starting API server on http://localhost:8000 ..." -ForegroundColor Green
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
