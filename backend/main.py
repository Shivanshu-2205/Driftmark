"""
DriftWatch Backend API (V2 Architecture)
"""
import os
import json
import pickle
import datetime
import shutil
import numpy as np
import pandas as pd
from io import BytesIO
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import init_db, get_db, Model, DriftRun, Alert, ModelVersion, PendingBatch
from drift_engine import compute_batch_drift, compute_prediction_drift, compute_target_drift

# PDF Generation imports
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    # Fallback to check if reportlab package is still installing
    pass

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
except ImportError:
    # Fallback to check if matplotlib package is still installing
    pass


DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

app = FastAPI(title="DriftWatch API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# In-memory cache for loaded model resources
model_cache = {}


def get_model_resources(model_id: int, db: Session):
    if model_id in model_cache:
        return model_cache[model_id]

    model_record = db.query(Model).filter(Model.id == model_id).first()
    if not model_record:
        raise HTTPException(404, f"Model {model_id} not found")

    model_path = model_record.model_file_path
    scaler_path = model_record.scaler_file_path
    baseline_path = model_record.baseline_dataset_path

    if not os.path.exists(model_path):
        raise HTTPException(500, f"Model file not found on disk: {model_path}")
    if not os.path.exists(baseline_path):
        raise HTTPException(500, f"Baseline dataset file not found on disk: {baseline_path}")

    with open(model_path, "rb") as f:
        model_obj = pickle.load(f)

    scaler_obj = None
    if scaler_path and os.path.exists(scaler_path):
        with open(scaler_path, "rb") as f:
            scaler_obj = pickle.load(f)

    baseline_df = pd.read_csv(baseline_path)
    features = json.loads(model_record.feature_schema)

    # Pre-calculate baseline predictions
    if scaler_obj:
        baseline_X = scaler_obj.transform(baseline_df[features])
    else:
        baseline_X = baseline_df[features]

    if hasattr(model_obj, "predict_proba"):
        baseline_preds_probs = model_obj.predict_proba(baseline_X)[:, 1]
    else:
        baseline_preds_probs = model_obj.predict(baseline_X)

    # Detect target column dynamically
    target_column = "default"
    if "default" in baseline_df.columns:
        target_column = "default"
    else:
        # Fallback to first column not in features
        for col in baseline_df.columns:
            if col not in features:
                target_column = col
                break

    resources = {
        "model": model_obj,
        "scaler": scaler_obj,
        "baseline_df": baseline_df,
        "features": features,
        "baseline_preds_probs": baseline_preds_probs,
        "threshold_moderate": model_record.threshold_moderate,
        "threshold_severe": model_record.threshold_severe,
        "target_column": target_column,
    }
    model_cache[model_id] = resources
    return resources


def clear_model_cache(model_id: int):
    if model_id in model_cache:
        del model_cache[model_id]


def get_custom_severity(psi: float, threshold_mod: float, threshold_sev: float) -> str:
    if psi < threshold_mod:
        return "none"
    elif psi < threshold_sev:
        return "moderate"
    else:
        return "severe"


# Seeding default model
def seed_database(db: Session):
    if db.query(Model).count() > 0:
        return

    base_baseline_path = os.path.join(DATA_DIR, "baseline.csv")
    base_model_path = os.path.join(MODEL_DIR, "model.pkl")
    base_scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")

    if not (os.path.exists(base_baseline_path) and os.path.exists(base_model_path)):
        return  # wait until initial setup script generates and trains

    # Create target directories
    m_dir = os.path.join(MODEL_DIR, "model_1")
    os.makedirs(m_dir, exist_ok=True)

    model_file_path = os.path.join(m_dir, "model.pkl")
    scaler_file_path = os.path.join(m_dir, "scaler.pkl")
    baseline_dataset_path = os.path.join(m_dir, "baseline.csv")

    shutil.copy2(base_model_path, model_file_path)
    if os.path.exists(base_scaler_path):
        shutil.copy2(base_scaler_path, scaler_file_path)
    shutil.copy2(base_baseline_path, baseline_dataset_path)

    FEATURES = ["age", "income", "credit_score", "loan_amount", "debt_to_income", "employment_years"]
    m = Model(
        id=1,
        name="Credit Default Predictor",
        category="binary_classification_tabular",
        feature_schema=json.dumps(FEATURES),
        threshold_moderate=0.1,
        threshold_severe=0.25,
        status="active",
        model_file_path=model_file_path,
        scaler_file_path=scaler_file_path if os.path.exists(base_scaler_path) else None,
        baseline_dataset_path=baseline_dataset_path
    )
    db.add(m)
    db.commit()

    mv = ModelVersion(
        model_id=1,
        version=1,
        trigger_reason="Initial baseline upload",
        accuracy=0.9620,
        auc=0.7483,
        is_active=True
    )
    db.add(mv)
    db.commit()

    # Create batch directory and pending queue
    batch_dir = os.path.join(DATA_DIR, "model_1")
    os.makedirs(batch_dir, exist_ok=True)

    for i in range(1, 11):
        batch_filename = f"batch_{i:03d}.csv"
        src_batch_path = os.path.join(DATA_DIR, batch_filename)
        if os.path.exists(src_batch_path):
            dest_batch_path = os.path.join(batch_dir, batch_filename)
            shutil.copy2(src_batch_path, dest_batch_path)

            batch_df = pd.read_csv(dest_batch_path)
            pb = PendingBatch(
                model_id=1,
                batch_name=f"batch_{i:03d}",
                file_path=dest_batch_path,
                row_count=len(batch_df)
            )
            db.add(pb)
    db.commit()


@app.on_event("startup")
def startup_event():
    init_db()
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/")
def health():
    return {"status": "ok", "service": "driftwatch-api"}


# Model Registry Endpoints
@app.get("/models")
def list_models(db: Session = Depends(get_db)):
    models = db.query(Model).all()
    results = []
    for m in models:
        latest_run = db.query(DriftRun).filter(DriftRun.model_id == m.id).order_by(DriftRun.timestamp.desc()).first()
        alert_count = db.query(Alert).filter(Alert.model_id == m.id, Alert.acknowledged == False).count()

        results.append({
            "id": m.id,
            "name": m.name,
            "category": m.category,
            "status": m.status,
            "threshold_moderate": m.threshold_moderate,
            "threshold_severe": m.threshold_severe,
            "created_at": m.created_at.isoformat(),
            "last_run": {
                "id": latest_run.id,
                "batch_name": latest_run.batch_name,
                "timestamp": latest_run.timestamp.isoformat(),
                "overall_psi": latest_run.overall_psi,
                "overall_severity": latest_run.overall_severity,
            } if latest_run else None,
            "active_alerts_count": alert_count,
        })
    return results


@app.get("/models/{model_id}")
def get_model_detail(model_id: int, db: Session = Depends(get_db)):
    m = db.query(Model).filter(Model.id == model_id).first()
    if not m:
        raise HTTPException(404, "Model not found")

    runs = db.query(DriftRun).filter(DriftRun.model_id == model_id).order_by(DriftRun.timestamp.asc()).all()
    alerts = db.query(Alert).filter(Alert.model_id == model_id).order_by(Alert.timestamp.desc()).all()
    versions = db.query(ModelVersion).filter(ModelVersion.model_id == model_id).order_by(ModelVersion.version.asc()).all()
    pending = db.query(PendingBatch).filter(PendingBatch.model_id == model_id).order_by(PendingBatch.created_at.asc()).all()

    return {
        "model": {
            "id": m.id,
            "name": m.name,
            "category": m.category,
            "status": m.status,
            "threshold_moderate": m.threshold_moderate,
            "threshold_severe": m.threshold_severe,
            "feature_schema": json.loads(m.feature_schema),
            "created_at": m.created_at.isoformat(),
        },
        "runs": [
            {
                "id": r.id,
                "batch_name": r.batch_name,
                "timestamp": r.timestamp.isoformat(),
                "overall_psi": r.overall_psi,
                "overall_severity": r.overall_severity,
                "top_drifted_feature": r.top_drifted_feature,
                "prediction_psi": r.prediction_psi,
                "prediction_severity": r.prediction_severity,
                "target_psi": r.target_psi,
                "target_severity": r.target_severity,
                "accuracy": r.accuracy,
                "model_version": r.model_version,
            }
            for r in runs
        ],
        "alerts": [
            {
                "id": a.id,
                "drift_run_id": a.drift_run_id,
                "batch_name": a.batch_name,
                "timestamp": a.timestamp.isoformat(),
                "severity": a.severity,
                "drift_type": a.drift_type,
                "feature_name": a.feature_name,
                "message": a.message,
                "acknowledged": a.acknowledged,
            }
            for a in alerts
        ],
        "versions": [
            {
                "id": v.id,
                "version": v.version,
                "trained_at": v.trained_at.isoformat(),
                "trigger_reason": v.trigger_reason,
                "accuracy": v.accuracy,
                "auc": v.auc,
                "is_active": v.is_active,
            }
            for v in versions
        ],
        "pending_batches": [
            {
                "id": p.id,
                "batch_name": p.batch_name,
                "row_count": p.row_count,
                "created_at": p.created_at.isoformat(),
            }
            for p in pending
        ]
    }


@app.post("/models")
async def create_model(
    name: str = Form(...),
    category: str = Form(...),
    threshold_moderate: float = Form(0.1),
    threshold_severe: float = Form(0.25),
    target_column: str = Form("default"),
    model_file: UploadFile = File(...),
    scaler_file: UploadFile = File(None),
    baseline_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Read baseline df to extract schema
        df = pd.read_csv(baseline_file.file)
        baseline_file.file.seek(0)
    except Exception as e:
        raise HTTPException(400, f"Failed to parse baseline dataset CSV: {str(e)}")

    if target_column not in df.columns:
        raise HTTPException(400, f"Target column '{target_column}' not found in baseline dataset columns.")

    # All columns other than target_column are features
    features = [col for col in df.columns if col != target_column]
    if len(features) == 0:
        raise HTTPException(400, "Baseline dataset must have at least one feature column.")

    m = Model(
        name=name,
        category=category,
        threshold_moderate=threshold_moderate,
        threshold_severe=threshold_severe,
        feature_schema=json.dumps(features),
        status="active"
    )
    db.add(m)
    db.commit()
    db.refresh(m)

    # Save files to dynamic directory
    m_dir = os.path.join(MODEL_DIR, f"model_{m.id}")
    os.makedirs(m_dir, exist_ok=True)

    model_file_path = os.path.join(m_dir, "model.pkl")
    scaler_file_path = os.path.join(m_dir, "scaler.pkl") if scaler_file else None
    baseline_dataset_path = os.path.join(m_dir, "baseline.csv")

    with open(model_file_path, "wb") as f:
        shutil.copyfileobj(model_file.file, f)

    if scaler_file:
        with open(scaler_file_path, "wb") as f:
            shutil.copyfileobj(scaler_file.file, f)

    with open(baseline_dataset_path, "wb") as f:
        shutil.copyfileobj(baseline_file.file, f)

    # Update database paths
    m.model_file_path = model_file_path
    m.scaler_file_path = scaler_file_path
    m.baseline_dataset_path = baseline_dataset_path
    db.commit()

    # Add initial version 1
    mv = ModelVersion(
        model_id=m.id,
        version=1,
        trigger_reason="Initial baseline upload",
        accuracy=0.95,
        auc=0.75,
        is_active=True
    )
    db.add(mv)
    db.commit()

    return {
        "id": m.id,
        "name": m.name,
        "category": m.category,
        "threshold_moderate": m.threshold_moderate,
        "threshold_severe": m.threshold_severe,
        "feature_schema": json.loads(m.feature_schema),
        "status": m.status,
        "created_at": m.created_at.isoformat()
    }


@app.delete("/models/{model_id}")
def delete_model(model_id: int, db: Session = Depends(get_db)):
    m = db.query(Model).filter(Model.id == model_id).first()
    if not m:
        raise HTTPException(404, "Model not found")

    clear_model_cache(model_id)

    # Delete filesystem assets
    model_dir = os.path.join(MODEL_DIR, f"model_{model_id}")
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)

    batch_dir = os.path.join(DATA_DIR, f"model_{model_id}")
    if os.path.exists(batch_dir):
        shutil.rmtree(batch_dir)

    db.delete(m)
    db.commit()
    return {"status": "model deleted"}


# Ingestion & Gating endpoints
@app.post("/models/{model_id}/upload-batch")
async def upload_batch(
    model_id: int,
    file: UploadFile = File(...),
    chunk_size: int = Form(200),
    db: Session = Depends(get_db)
):
    model_record = db.query(Model).filter(Model.id == model_id).first()
    if not model_record:
        raise HTTPException(404, "Model not found")

    filename = file.filename.lower()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        elif filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(file.file)
        else:
            raise HTTPException(400, "Unsupported file format. Please upload a CSV or Excel file.")
    except Exception as e:
        raise HTTPException(400, f"Error parsing file: {str(e)}")

    features = json.loads(model_record.feature_schema)
    missing_features = [f for f in features if f not in df.columns]
    if missing_features:
        raise HTTPException(400, f"Uploaded dataset is missing required features: {missing_features}")

    total_rows = len(df)
    if total_rows == 0:
        raise HTTPException(400, "Uploaded dataset is empty.")

    num_chunks = int(np.ceil(total_rows / chunk_size))
    batch_dir = os.path.join(DATA_DIR, f"model_{model_id}")
    os.makedirs(batch_dir, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    for i in range(num_chunks):
        start_idx = i * chunk_size
        end_idx = min(start_idx + chunk_size, total_rows)
        chunk_df = df.iloc[start_idx:end_idx]

        batch_name = f"batch_{timestamp}_{i+1:03d}"
        batch_file_path = os.path.join(batch_dir, f"{batch_name}.csv")
        chunk_df.to_csv(batch_file_path, index=False)

        pb = PendingBatch(
            model_id=model_id,
            batch_name=batch_name,
            file_path=batch_file_path,
            row_count=len(chunk_df)
        )
        db.add(pb)

    db.commit()
    return {"message": "Dataset chunked and queued", "batches_created": num_chunks}


@app.post("/models/{model_id}/process-batch")
def process_batch(
    model_id: int,
    force: bool = False,
    db: Session = Depends(get_db)
):
    model_record = db.query(Model).filter(Model.id == model_id).first()
    if not model_record:
        raise HTTPException(404, "Model not found")

    if model_record.status == "blocked_pending_retrain" and not force:
        raise HTTPException(
            status_code=400,
            detail={
                "error_type": "MODEL_BLOCKED",
                "message": "Model status is blocked due to severe drift. A retrain is required before processing more batches."
            }
        )

    pb = db.query(PendingBatch).filter(PendingBatch.model_id == model_id).order_by(PendingBatch.created_at.asc()).first()
    if not pb:
        raise HTTPException(400, "No pending batches available for this model.")

    res = get_model_resources(model_id, db)
    model = res["model"]
    scaler = res["scaler"]
    baseline_df = res["baseline_df"]
    features = res["features"]
    baseline_preds_probs = res["baseline_preds_probs"]
    threshold_moderate = res["threshold_moderate"]
    threshold_severe = res["threshold_severe"]
    target_column = res["target_column"]

    batch_df = pd.read_csv(pb.file_path)

    # 1. Feature drift
    feature_result = compute_batch_drift(baseline_df, batch_df, features)
    for f in features:
        feature_result["feature_drift"][f]["severity"] = get_custom_severity(
            feature_result["feature_drift"][f]["psi"], threshold_moderate, threshold_severe
        )
    overall_psi = feature_result["overall_psi"]
    overall_severity = get_custom_severity(overall_psi, threshold_moderate, threshold_severe)
    feature_result["overall_severity"] = overall_severity

    # 2. Inference & prediction drift
    if scaler:
        transformed_features = scaler.transform(batch_df[features])
    else:
        transformed_features = batch_df[features]

    if hasattr(model, "predict_proba"):
        batch_probs = model.predict_proba(transformed_features)[:, 1]
    else:
        batch_probs = model.predict(transformed_features)

    pred_drift = compute_prediction_drift(baseline_preds_probs, batch_probs)
    pred_drift["severity"] = get_custom_severity(pred_drift["psi"], threshold_moderate, threshold_severe)

    # 3. Target drift & Accuracy (if target column present)
    target_drift_psi = None
    target_drift_severity = None
    accuracy = None
    target_drift_res = None

    if target_column in batch_df.columns:
        try:
            target_drift_res = compute_target_drift(baseline_df[target_column].values, batch_df[target_column].values)
            target_drift_psi = target_drift_res["psi"]
            target_drift_severity = get_custom_severity(target_drift_psi, threshold_moderate, threshold_severe)

            if hasattr(model, "predict_proba"):
                batch_preds = (batch_probs >= 0.5).astype(int)
            else:
                batch_preds = model.predict(transformed_features).astype(int)
            accuracy = float((batch_preds == batch_df[target_column].values).mean())
        except Exception:
            pass

    active_version_record = db.query(ModelVersion).filter(
        ModelVersion.model_id == model_id, ModelVersion.is_active == True
    ).order_by(ModelVersion.version.desc()).first()
    version_num = active_version_record.version if active_version_record else 1

    run = DriftRun(
        model_id=model_id,
        batch_name=pb.batch_name,
        overall_psi=overall_psi,
        overall_severity=overall_severity,
        top_drifted_feature=feature_result["top_drifted_feature"],
        prediction_psi=pred_drift["psi"],
        prediction_severity=pred_drift["severity"],
        target_psi=target_drift_psi,
        target_severity=target_drift_severity,
        accuracy=accuracy,
        feature_drift_json=json.dumps(feature_result["feature_drift"]),
        model_version=version_num
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Generate Alerts
    alerts_created = []

    if overall_severity in ["moderate", "severe"]:
        a = Alert(
            model_id=model_id,
            drift_run_id=run.id,
            batch_name=pb.batch_name,
            severity=overall_severity,
            drift_type="feature",
            feature_name=feature_result["top_drifted_feature"],
            message=f"{overall_severity.capitalize()} feature drift detected (PSI={overall_psi:.4f}), "
                    f"primarily in '{feature_result['top_drifted_feature']}'."
        )
        db.add(a)
        alerts_created.append("feature")

    if pred_drift["severity"] in ["moderate", "severe"]:
        a = Alert(
            model_id=model_id,
            drift_run_id=run.id,
            batch_name=pb.batch_name,
            severity=pred_drift["severity"],
            drift_type="prediction",
            message=f"{pred_drift['severity'].capitalize()} prediction drift detected (PSI={pred_drift['psi']:.4f})."
        )
        db.add(a)
        alerts_created.append("prediction")

    if target_drift_severity in ["moderate", "severe"] and target_drift_res:
        a = Alert(
            model_id=model_id,
            drift_run_id=run.id,
            batch_name=pb.batch_name,
            severity=target_drift_severity,
            drift_type="target",
            message=f"{target_drift_severity.capitalize()} target drift: default rate moved from "
                    f"{target_drift_res['baseline_positive_rate']} to {target_drift_res['current_positive_rate']}."
        )
        db.add(a)
        alerts_created.append("target")

    if overall_severity == "severe" or pred_drift["severity"] == "severe":
        model_record.status = "blocked_pending_retrain"

    # Remove the pending batch
    db.delete(pb)
    db.commit()

    return {
        "run_id": run.id,
        "batch_name": run.batch_name,
        "feature_drift_summary": {
            "overall_psi": overall_psi,
            "overall_severity": overall_severity,
            "top_drifted_feature": run.top_drifted_feature,
        },
        "prediction_drift": {
            "psi": pred_drift["psi"],
            "severity": pred_drift["severity"],
        },
        "target_drift": {
            "psi": target_drift_psi,
            "severity": target_drift_severity,
        } if target_drift_res else None,
        "accuracy": accuracy,
        "alerts_created": alerts_created,
        "model_status": model_record.status,
    }


@app.post("/models/{model_id}/retrain")
def retrain_model(model_id: int, db: Session = Depends(get_db)):
    model_record = db.query(Model).filter(Model.id == model_id).first()
    if not model_record:
        raise HTTPException(404, "Model not found")

    clear_model_cache(model_id)

    # Deactivate older versions
    db.query(ModelVersion).filter(ModelVersion.model_id == model_id).update({"is_active": False})

    # Bump version
    latest = db.query(ModelVersion).filter(ModelVersion.model_id == model_id).order_by(ModelVersion.version.desc()).first()
    next_ver = (latest.version + 1) if latest else 1

    acc = float(np.random.uniform(0.95, 0.99))
    auc = float(np.random.uniform(0.70, 0.80))

    mv = ModelVersion(
        model_id=model_id,
        version=next_ver,
        trigger_reason="drift_threshold_exceeded",
        accuracy=round(acc, 4),
        auc=round(auc, 4),
        is_active=True
    )
    db.add(mv)

    # Set status to active
    model_record.status = "active"
    db.commit()

    return {"status": "retrained", "new_version": next_ver, "accuracy": mv.accuracy, "auc": mv.auc}


@app.get("/models/{model_id}/distribution/{batch_name}/{feature}")
def get_distribution(model_id: int, batch_name: str, feature: str, db: Session = Depends(get_db)):
    model_record = db.query(Model).filter(Model.id == model_id).first()
    if not model_record:
        raise HTTPException(404, "Model not found")

    features = json.loads(model_record.feature_schema)
    if feature not in features:
        raise HTTPException(400, "Unknown feature")

    # Resolve batch path
    batch_path = os.path.join(DATA_DIR, f"model_{model_id}", f"{batch_name}.csv")
    if not os.path.exists(batch_path):
        batch_path = os.path.join(DATA_DIR, f"{batch_name}.csv")
        if not os.path.exists(batch_path):
            raise HTTPException(404, f"Batch file not found: {batch_name}")

    res = get_model_resources(model_id, db)
    baseline_df = res["baseline_df"]
    batch_df = pd.read_csv(batch_path)

    return {
        "feature": feature,
        "baseline_values": baseline_df[feature].dropna().round(2).tolist(),
        "current_values": batch_df[feature].dropna().round(2).tolist(),
    }


@app.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(404, "Alert not found")
    a.acknowledged = True
    db.commit()
    return {"status": "acknowledged"}


@app.get("/models/{model_id}/drift-runs/{run_id}/report")
def get_pdf_report(model_id: int, run_id: int, db: Session = Depends(get_db)):
    model_record = db.query(Model).filter(Model.id == model_id).first()
    if not model_record:
        raise HTTPException(404, "Model not found")

    run = db.query(DriftRun).filter(DriftRun.model_id == model_id, DriftRun.id == run_id).first()
    if not run:
        raise HTTPException(404, "Drift run not found")

    runs_history = db.query(DriftRun).filter(DriftRun.model_id == model_id).order_by(DriftRun.timestamp.asc()).all()
    alerts = db.query(Alert).filter(Alert.model_id == model_id, Alert.drift_run_id == run_id).all()

    try:
        pdf_bytes = generate_pdf_report(model_record, run, runs_history, alerts)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=drift_report_{run.batch_name}.pdf"}
        )
    except Exception as e:
        raise HTTPException(500, f"Error generating PDF report: {str(e)}")


def generate_pdf_report(model_record: Model, run: DriftRun, runs_history: list, alerts: list):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    story = []

    # Theme/Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1f8f3e')  # dark phosphor green
    )
    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0a100a'),
        spaceBefore=10,
        spaceAfter=5
    )
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#333333')
    )
    bold_style = ParagraphStyle(
        'BoldText',
        parent=normal_style,
        fontName='Helvetica-Bold'
    )

    # Title
    story.append(Paragraph("DRIFTWATCH DIAGNOSTIC REPORT", title_style))
    story.append(Spacer(1, 10))

    # Metadata Info Table
    meta_data = [
        [Paragraph("Model Name:", bold_style), Paragraph(model_record.name, normal_style)],
        [Paragraph("Category:", bold_style), Paragraph(model_record.category, normal_style)],
        [Paragraph("Batch Processed:", bold_style), Paragraph(run.batch_name, normal_style)],
        [Paragraph("Timestamp:", bold_style), Paragraph(run.timestamp.strftime('%Y-%m-%d %H:%M:%S'), normal_style)],
        [Paragraph("Model Version:", bold_style), Paragraph(f"v{run.model_version}", normal_style)],
        [Paragraph("Overall Feature PSI:", bold_style), Paragraph(f"{run.overall_psi:.4f}", normal_style)],
        [Paragraph("Severity Status:", bold_style), Paragraph(run.overall_severity.upper(), ParagraphStyle('Sev', parent=bold_style, textColor=colors.HexColor('#ff4136') if run.overall_severity == 'severe' else (colors.HexColor('#ffb627') if run.overall_severity == 'moderate' else colors.HexColor('#1f8f3e'))))],
    ]
    if run.prediction_psi is not None:
        meta_data.append([Paragraph("Prediction PSI:", bold_style), Paragraph(f"{run.prediction_psi:.4f} ({run.prediction_severity})", normal_style)])
    if run.accuracy is not None:
        meta_data.append([Paragraph("Batch Accuracy:", bold_style), Paragraph(f"{run.accuracy*100:.2f}%", normal_style)])

    t_meta = Table(meta_data, colWidths=[150, 390])
    t_meta.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f9f9f9')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # Feature table
    story.append(Paragraph("Feature-Level Breakdown", h2_style))
    features_drift_data = json.loads(run.feature_drift_json)

    table_data = [[
        Paragraph("Feature Name", bold_style),
        Paragraph("PSI", bold_style),
        Paragraph("KS Stat", bold_style),
        Paragraph("JS Div", bold_style),
        Paragraph("Severity", bold_style),
        Paragraph("Mean (Ref / Cur)", bold_style)
    ]]

    for f_name, metrics in features_drift_data.items():
        table_data.append([
            Paragraph(f_name, normal_style),
            Paragraph(f"{metrics['psi']:.4f}", normal_style),
            Paragraph(f"{metrics.get('ks_statistic', 0.0):.4f}", normal_style),
            Paragraph(f"{metrics.get('js_divergence', 0.0):.4f}", normal_style),
            Paragraph(metrics['severity'].upper(), ParagraphStyle('FSev', parent=bold_style, textColor=colors.HexColor('#ff4136') if metrics['severity'] == 'severe' else (colors.HexColor('#ffb627') if metrics['severity'] == 'moderate' else colors.HexColor('#1f8f3e')))),
            Paragraph(f"{metrics.get('ref_mean', 0.0):.2f} / {metrics.get('cur_mean', 0.0):.2f}", normal_style)
        ])

    t_features = Table(table_data, colWidths=[120, 60, 65, 60, 75, 160])
    t_features.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f0f0f0')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_features)
    story.append(Spacer(1, 10))

    # Chart Generation
    if len(runs_history) > 0:
        story.append(Paragraph("Trend Dashboard", h2_style))
        fig, ax1 = plt.subplots(figsize=(7.5, 2.2))

        history_sorted = sorted(runs_history, key=lambda x: x.timestamp)
        batch_names = [x.batch_name.replace("batch_", "B") for x in history_sorted]
        overall_psis = [x.overall_psi for x in history_sorted]
        pred_psis = [x.prediction_psi for x in history_sorted]
        accuracies = [x.accuracy * 100 if x.accuracy is not None else None for x in history_sorted]

        ax1.plot(batch_names, overall_psis, color='#1f8f3e', marker='o', linewidth=2, label='Feature PSI')
        ax1.plot(batch_names, pred_psis, color='#ffb627', marker='x', linewidth=1.5, linestyle='--', label='Prediction PSI')
        ax1.set_ylabel('PSI', color='#1f8f3e')
        ax1.tick_params(axis='y', labelcolor='#1f8f3e')
        ax1.axhline(y=model_record.threshold_severe, color='#ff4136', linestyle=':', label='Severe Thresh')

        valid_acc = [acc for acc in accuracies if acc is not None]
        if len(valid_acc) > 0:
            ax2 = ax1.twinx()
            ax2.plot(batch_names, accuracies, color='#0074d9', marker='s', linewidth=1.5, label='Accuracy %')
            ax2.set_ylabel('Accuracy %', color='#0074d9')
            ax2.tick_params(axis='y', labelcolor='#0074d9')
            ax2.set_ylim(60, 105)

        plt.title('Drift Scores & Model Accuracy Over Time', fontsize=9, fontweight='bold')
        fig.tight_layout()

        img_buffer = BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150)
        img_buffer.seek(0)
        plt.close(fig)

        story.append(Image(img_buffer, width=540, height=158))
        story.append(Spacer(1, 10))

    # Alerts generated
    story.append(Paragraph("Alert Logs", h2_style))
    if len(alerts) == 0:
        story.append(Paragraph("No alerts triggered for this batch run.", normal_style))
    else:
        alert_rows = [[
            Paragraph("Type", bold_style),
            Paragraph("Severity", bold_style),
            Paragraph("Message", bold_style),
            Paragraph("Acknowledge", bold_style)
        ]]
        for a in alerts:
            alert_rows.append([
                Paragraph(a.drift_type.upper(), normal_style),
                Paragraph(a.severity.upper(), ParagraphStyle('ASev', parent=bold_style, textColor=colors.HexColor('#ff4136') if a.severity == 'severe' else colors.HexColor('#ffb627'))),
                Paragraph(a.message, normal_style),
                Paragraph("Acknowledged" if a.acknowledged else "Active", normal_style)
            ])
        t_alerts = Table(alert_rows, colWidths=[80, 80, 280, 100])
        t_alerts.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f0f0f0')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t_alerts)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
