@echo off
rem Run from backend/ directory

echo Installing dependencies...
pip install fastapi uvicorn scipy scikit-learn pandas numpy sqlalchemy python-multipart pydantic -q
if %errorlevel% neq 0 exit /b %errorlevel%

echo Generating synthetic data (if not present)...
if not exist "data\baseline.csv" (
    python generate_data.py
)
if %errorlevel% neq 0 exit /b %errorlevel%

echo Training baseline model (if not present)...
if not exist "models\model.pkl" (
    python train_model.py
)
if %errorlevel% neq 0 exit /b %errorlevel%

echo Starting API server on http://localhost:8000 ...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
