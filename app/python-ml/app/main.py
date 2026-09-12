"""
DriftWatch ML Layer (Python)
Stateless compute service. No auth, no database — Node backend is in control
and calls this service over HTTP for inference, drift analysis, and retraining.
"""

from fastapi import FastAPI
from app.routers import infer, drift, retrain

app = FastAPI(title="DriftWatch ML Layer", version="1.0.0")

app.include_router(infer.router)
app.include_router(drift.router)
app.include_router(retrain.router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "python-ml"}
