# ▓ DRIFTWATCH // ML Observability Platform

A full-stack, zero-config observability platform built to detect feature-level data drift, prediction drift, and concept shift in production ML models (using a credit-default classifier demonstration).

Featuring a premium **phosphor green / retro CRT terminal aesthetic** that simulates monitor scanlines, screen flicker, and real-time radar scanner sweeps.

---

## ◈ System Architecture

```text
       ┌─────────────────────────────────────────────────────────────┐
       │                  Python Inference Client                    │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ (Ingest CSV Batch Logs)
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │              FastAPI Backend (JWT Auth Protected)           │
       └─────┬────────────────────────┬────────────────────────┬─────┘
             │                        │                        │
             ▼ (Store Runs & Alerts)  ▼ (Compute Shift Metrics)  ▼ (Pickled Models)
       ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
       │   MongoDB   │          │    Drift    │          │  Artifact   │
       │  7.0 (Motor)│          │   Engine    │          │   Store     │
       │ Time Series │          │  (PSI/KS/JS)│          │(Local Files)│
       └─────────────┘          └─────────────┘          └─────────────┘
                                      ▲
                                      │ (REST APIs)
       ┌──────────────────────────────┴──────────────────────────────┐
       │                 Next.js Frontend Dashboard                  │
       │             (Retro CRT Theme & Interactive UI)              │
       └─────────────────────────────────────────────────────────────┘
```

* **Backend (`/backend`)**: Built with **FastAPI**, **Motor (async MongoDB driver)**, and **MongoDB 7.0**. Handles model registration, JWT-based authentication, batch ingestion pipelines, statistical drift analysis, and alert routing.
* **Frontend (`/frontend`)**: Built with **Next.js**, **Tailwind CSS**, and **Recharts**. Features a login page, protected dashboard, and real-time drift monitoring UI.
* **Drift Engine**: Mathematical suite computing PSI, KS two-sample test, and Jensen–Shannon divergence on feature distributions.

---

## 🔐 Authentication Setup

DriftWatch uses **JWT Bearer token authentication**. All API endpoints (except `/auth/login` and `/auth/register`) require a valid token.

### Default Admin Credentials
When the backend starts for the first time, it seeds a default admin user:
- **Email:** `admin@example.com`
- **Password:** `admin123`

> **Important:** Change these in production by registering a new admin via `POST /auth/register` and disabling the seed.

### Environment Variable
Set a strong secret for JWT signing:
```bash
JWT_SECRET=your-very-long-random-secret-key-here
```

In `docker-compose.yml`:
```yaml
environment:
  - JWT_SECRET=your-very-long-random-secret-key-here
```

### Auth API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Login with email + password. Returns JWT. |
| `POST` | `/auth/register` | Register a new operator account. |
| `GET` | `/auth/me` | Returns current authenticated user info. |



---

## ◉ Core Capabilities

* **Population Stability Index (PSI)**: Quantifies the magnitude of shift between reference distributions and active production batches. Categorized as stable ($<0.10$), moderate drift ($0.10 - 0.25$), or severe drift ($\ge 0.25$).
* **Kolmogorov-Smirnov (KS) Test**: Runs continuous 2-sample KS calculations on variable distributions to flag structural shifts with statistical p-value confidence limits.
* **Jensen-Shannon (JS) Divergence**: Evaluates probability density variations across continuous variables.
* **Ingestion Gating**: When severe drift is detected, the platform automatically flags an alert, locks the model status, and blocks further production batch ingestion until retraining is triggered.

---

## ⊟ The Ingestion Simulation

DriftWatch contains a script (`generate_data.py`) that builds a reference training dataset and **10 distinct production batches** demonstrating model behavior over time:

1. **Batches 1–4 (Normal)**: Variables remain stable. Accuracies hold at ~89%. PSI stays low ($\le 0.05$).
2. **Batches 5–7 (Gradual Drift)**: Shifts are injected into key features (e.g. `income` and `debt_to_income`). PSI warning triggers.
3. **Batches 8–10 (Concept & Severe Drift)**: Feature distributions shift radically, accompanied by a concept shift (feature-to-target relationship changes). Ingestion gates lock as accuracy drops below 80%.

---

## ⊞ Setup & Execution

### 1. Using Docker Compose (Recommended)
You can run the backend container, data generator, initial training run, and Next.js frontend in a single step:
```bash
docker compose up --build
```
* **Dashboard Console**: [http://localhost:3000](http://localhost:3000)
* **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Manual Startup (Without Docker)

#### Backend Setup
Ensure you have Python 3.10+ installed.
```bash
cd backend

# On macOS / Linux:
chmod +x run.sh && ./run.sh

# On Windows (PowerShell):
.\run.ps1
```
This script configures a virtual environment, installs dependencies, runs data generation, trains the baseline model, and launches the FastAPI server at `http://localhost:8000`.

#### Frontend Setup
Ensure you have Node.js 18+ installed.
```bash
cd frontend
npm install
npm run dev
```
Launches the Next.js app on `http://localhost:3000`.

---

## ⊿ Interactive Demo Flow

1. **Explore the Landing Page**: Visit the homepage (`/`) to review core capabilities and terminal outputs.
2. **Open the Registry**: Click **Start Monitoring** to navigate to the model registry (`/models`).
3. **Run Safe Batches**: Click on your model card to open the dashboard (`/models/[id]`). Ingest **Batches 1 to 4**. Watch the metrics populate on the Recharts graph. PSI remains low and status shows `ACTIVE`.
4. **Trigger Warnings**: Ingest **Batches 5 to 7**. You will observe warning colors (Amber) as the feature drift indexes rise.
5. **System Gate Lock**: Ingest **Batch 8**. The overall PSI crosses the severe threshold. An alert is thrown in the alert feed, and the model enters `▓ BLOCKED` status, locking further batch ingestion.
6. **Trigger Retraining**: Click **Retrain Model Now**. This simulates a model update, bumps the version from `v1` to `v2`, updates baseline parameters, and returns the status to `ACTIVE`.
7. **Resume Ingestion**: Normal operations resume. Ingest the remaining batches to complete the timeline.

---

## ◧ Backend Endpoint Map

* `GET /health` — Checks database connectivity and system status.
* `POST /models` — Registers a new model. Accepts picked files (`.pkl`), scalers, and baseline datasets.
* `GET /models` — Lists all registered models.
* `GET /models/{id}` — Queries a detailed overview of model telemetry, historical runs, alerts, versions, and pending batches.
* `POST /models/{id}/process-batch` — Processes the next pending batch queue through the drift analysis engine.
* `POST /models/{id}/retrain` — Simulates model retraining, logging a new active version and clearing block filters.
* `GET /models/{id}/distribution/{batch}/{feature}` — Returns histogram frequency arrays for baseline vs current variable comparisons.

---

## ◨ Project Layout

```text
├── backend/                  # Python backend application
│   ├── data/                 # Baseline references and raw datasets
│   ├── models/               # Pickled scikit-learn models and scalers
│   ├── database.py           # SQLAlchemy ORM schemas and DB session
│   ├── drift_engine.py       # PSI, KS-test, and JS-divergence engines
│   ├── generate_data.py      # Synthetic drift timeline generator
│   ├── main.py               # FastAPI routers and control handlers
│   └── train_model.py        # Baseline model training script
│
└── frontend/                 # Next.js web client
    ├── app/
    │   ├── page.tsx          # CRT Terminal landing page
    │   ├── docs/             # Technical specifications viewer
    │   └── models/           # Model listing and diagnostic dashboards
    ├── components/           # Recharts wrappers and reusable UI panels
    └── lib/api.ts            # Typed API client library
```