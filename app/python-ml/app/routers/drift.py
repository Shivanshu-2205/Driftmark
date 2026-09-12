"""
Drift analysis endpoint — reads two CSV paths supplied by the Node backend
and returns PSI / KS / JS drift stats. No DB access here.
"""

import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.drift_engine import run_drift_analysis

router = APIRouter(prefix="/drift", tags=["drift"])


class DriftRequest(BaseModel):
    baseline_path: str
    current_path: str
    feature_columns: list[str]
    threshold_moderate: float = 0.10
    threshold_severe: float = 0.25
    artifact_path: str | None = None
    scaler_path: str | None = None
    target_col: str | None = None


@router.post("/analyze")
async def analyze(req: DriftRequest):
    if not os.path.exists(req.baseline_path):
        raise HTTPException(status_code=404, detail="Baseline CSV not found")
    if not os.path.exists(req.current_path):
        raise HTTPException(status_code=404, detail="Current batch CSV not found")

    baseline_df = pd.read_csv(req.baseline_path)
    current_df = pd.read_csv(req.current_path)

    result = run_drift_analysis(
        baseline_df,
        current_df,
        req.feature_columns,
        req.threshold_moderate,
        req.threshold_severe,
        artifact_path=req.artifact_path,
        scaler_path=req.scaler_path,
        target_col=req.target_col,
    )
    return result


class DistributionRequest(BaseModel):
    baseline_path: str
    current_path: str
    feature: str


@router.post("/distribution")
async def distribution(req: DistributionRequest):
    if not os.path.exists(req.baseline_path) or not os.path.exists(req.current_path):
        raise HTTPException(status_code=404, detail="Data file not found")

    baseline_df = pd.read_csv(req.baseline_path)
    current_df = pd.read_csv(req.current_path)

    if req.feature not in baseline_df.columns or req.feature not in current_df.columns:
        raise HTTPException(status_code=404, detail=f"Feature '{req.feature}' not found")

    return {
        "feature": req.feature,
        "baseline_values": baseline_df[req.feature].dropna().tolist(),
        "current_values": current_df[req.feature].dropna().tolist(),
    }
