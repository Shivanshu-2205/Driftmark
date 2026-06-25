#!/bin/sh
set -e

# Generate synthetic data if not present
if [ ! -f "data/baseline.csv" ]; then
  echo "Generating synthetic data..."
  python generate_data.py
fi

# Train baseline model if not present
if [ ! -f "models/model.pkl" ]; then
  echo "Training baseline model..."
  python train_model.py
fi

echo "Starting API server on port 8000..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
