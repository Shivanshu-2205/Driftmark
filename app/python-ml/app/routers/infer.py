"""
Inference endpoint — loads a pickled model/scaler from a path the Node
backend supplies and returns a prediction. No DB access here.
"""

import time
import pickle

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/infer", tags=["infer"])


class InferRequest(BaseModel):
    artifact_path: str
    scaler_path: str | None = None
    feature_cols: list[str]
    features: dict


@router.post("")
async def infer(req: InferRequest):
    try:
        with open(req.artifact_path, "rb") as f:
            clf = pickle.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {e}")

    raw_vector = [req.features.get(col, 0.0) for col in req.feature_cols]

    processed = raw_vector
    if req.scaler_path:
        try:
            with open(req.scaler_path, "rb") as f:
                scaler = pickle.load(f)
            processed = scaler.transform([raw_vector])[0].tolist()
        except Exception:
            processed = raw_vector

    t0 = time.time()
    try:
        proba = clf.predict_proba([processed])[0]
        prediction_score = float(proba[1]) if len(proba) > 1 else float(proba[0])
        predicted_label = int(np.argmax(proba))
        confidence = float(max(proba))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")
    latency_ms = round((time.time() - t0) * 1000, 2)

    return {
        "prediction_score": prediction_score,
        "predicted_label": predicted_label,
        "confidence": confidence,
        "latency_ms": latency_ms,
        "preprocessed_vector": processed,
    }
