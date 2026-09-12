# DriftWatch — Node (control) + Python (ML) Architecture

```
app/
├── node-backend/     Node.js + Express — auth, MongoDB, business logic, orchestration
├── python-ml/        Python + FastAPI — stateless ML compute (infer/drift/retrain)
└── docker-compose.yml
```

Node is in control: it owns auth, the database, request validation, and
decides when/what to call. Python has no DB access and no auth — it only
receives file paths + params over HTTP from Node and returns computed
results. Python's port (8001) is not published outside the Docker network.

## Run

```bash
cp node-backend/.env.example node-backend/.env   # edit if needed
docker compose up --build
```

- Node control layer: http://localhost:8000
- Python ML layer: internal only, http://python-ml:8001 inside the network
- MongoDB: localhost:27017

Default admin user is seeded on first boot: `admin@example.com` / `admin123`.

## Run without Docker

```bash
# terminal 1 — mongodb must be running locally
cd python-ml && pip install -r requirements.txt && uvicorn app.main:app --port 8001

# terminal 2
cd node-backend && npm install && npm run dev
```

## API surface (Node, port 8000)

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET/POST/DELETE /models`, `POST /models/:id/upload-batch`, `POST /models/:id/process-batch`
- `POST /models/:id/retrain`, `GET /models/:id/distribution/:batchName/:feature`
- `GET /models/:id/drift-runs/:runId`, `GET /models/:id/drift-runs/:runId/report`
- `GET /alerts`, `POST /alerts/:id/acknowledge`
- `POST /predict`, `POST /ground-truth`

## Internal ML surface (Python, port 8001, not public)

- `POST /infer`, `POST /drift/analyze`, `POST /drift/distribution`, `POST /retrain`
