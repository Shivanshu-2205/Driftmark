from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import datetime
import os

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "driftwatch.db"))
db_dir = os.path.dirname(DB_PATH)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Model(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    feature_schema = Column(Text)  # JSON list of feature names: ["age", "income", ...]
    threshold_moderate = Column(Float, default=0.1)
    threshold_severe = Column(Float, default=0.25)
    status = Column(String, default="active")  # active / blocked_pending_retrain
    model_file_path = Column(String)
    scaler_file_path = Column(String, nullable=True)
    baseline_dataset_path = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    runs = relationship("DriftRun", back_populates="model", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="model", cascade="all, delete-orphan")
    versions = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")
    pending_batches = relationship("PendingBatch", back_populates="model", cascade="all, delete-orphan")


class DriftRun(Base):
    __tablename__ = "drift_runs"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    batch_name = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    overall_psi = Column(Float)
    overall_severity = Column(String)
    top_drifted_feature = Column(String)
    prediction_psi = Column(Float)
    prediction_severity = Column(String)
    target_psi = Column(Float, nullable=True)
    target_severity = Column(String, nullable=True)
    accuracy = Column(Float, nullable=True)
    feature_drift_json = Column(Text)  # JSON blob of per-feature stats
    model_version = Column(Integer, default=1)

    model = relationship("Model", back_populates="runs")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    drift_run_id = Column(Integer)
    batch_name = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    severity = Column(String)
    drift_type = Column(String)  # feature / prediction / target
    feature_name = Column(String, nullable=True)
    message = Column(Text)
    acknowledged = Column(Boolean, default=False)

    model = relationship("Model", back_populates="alerts")


class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    trigger_reason = Column(String)
    accuracy = Column(Float, nullable=True)
    auc = Column(Float, nullable=True)
    is_active = Column(Boolean, default=False)

    model = relationship("Model", back_populates="versions")


class PendingBatch(Base):
    __tablename__ = "pending_batches"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    batch_name = Column(String, index=True)
    file_path = Column(String)
    row_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    model = relationship("Model", back_populates="pending_batches")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

