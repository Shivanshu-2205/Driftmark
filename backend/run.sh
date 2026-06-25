#!/bin/bash
# Run from backend/ directory
set -e
echo "Installing dependencies..."
pip install fastapi uvicorn scipy scikit-learn pandas numpy sqlalchemy python-multipart pydantic --break-system-packages -q

echo "Generating synthetic data (if not present)..."
if [ ! -f "data/baseline.csv" ]; then
  python3 generate_data.py
fi

echo "Training baseline model (if not present)..."
if [ ! -f "models/model.pkl" ]; then
  python3 train_model.py
fi

echo "Starting API server on http://localhost:8000 ..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
