"""
Retrain endpoint — trains a candidate model from a baseline CSV path
supplied by the Node backend, saves artifacts to disk, and returns metrics
+ artifact paths. Promotion/versioning decisions stay in the Node backend.
"""

import os
import pickle

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score

router = APIRouter(prefix="/retrain", tags=["retrain"])


class RetrainRequest(BaseModel):
    model_id: int
    next_version: int
    baseline_path: str
    feature_cols: list[str]
    target_col: str
    models_dir: str


@router.post("")
async def retrain(req: RetrainRequest):
    if not os.path.exists(req.baseline_path):
        raise HTTPException(status_code=404, detail="Baseline CSV not found")

    df = pd.read_csv(req.baseline_path)
    if req.target_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{req.target_col}' not in CSV")

    X = df[req.feature_cols].fillna(0)
    y = df[req.target_col]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    candidate = GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
    candidate.fit(X_train_s, y_train)

    y_pred = candidate.predict(X_test_s)
    y_proba = candidate.predict_proba(X_test_s)[:, 1]
    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    f1 = f1_score(y_test, y_pred, average="weighted")

    os.makedirs(req.models_dir, exist_ok=True)
    model_path = os.path.join(req.models_dir, f"model_{req.model_id}_v{req.next_version}.pkl")
    scaler_path = os.path.join(req.models_dir, f"scaler_{req.model_id}_v{req.next_version}.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(candidate, f)
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)

    return {
        "artifact_path": model_path,
        "scaler_path": scaler_path,
        "accuracy": round(float(accuracy), 4),
        "auc": round(float(auc), 4),
        "f1_score": round(float(f1), 4),
    }
