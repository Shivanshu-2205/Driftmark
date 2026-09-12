import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { getDb, nextId } from "../db/index.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { mlDriftAnalyze, mlDistribution, mlRetrain } from "../services/mlClient.js";

export const router = Router();
router.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage() });

function ensureDirs() {
  fs.mkdirSync(config.modelsDir, { recursive: true });
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(path.join(config.dataDir, "batches"), { recursive: true });
}

function countCsvRows(buffer) {
  const records = parse(buffer, { columns: true, skip_empty_lines: true });
  return records.length;
}

// ──────────── List Models ────────────
router.get("/", async (req, res) => {
  const db = getDb();
  const docs = await db.collection("models").find({}).toArray();
  const out = [];
  for (const doc of docs) {
    doc.id = doc._id;
    delete doc._id;
    const lastRun = await db
      .collection("drift_runs")
      .find({ model_id: doc.id })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();
    if (lastRun.length) {
      lastRun[0].id = lastRun[0]._id;
      delete lastRun[0]._id;
      doc.last_run = lastRun[0];
    } else {
      doc.last_run = null;
    }
    doc.active_alerts_count = await db
      .collection("alerts")
      .countDocuments({ model_id: doc.id, acknowledged: false });
    out.push(doc);
  }
  res.json(out);
});

// ──────────── Get Model Detail ────────────
router.get("/:modelId", async (req, res) => {
  const db = getDb();
  const modelId = parseInt(req.params.modelId, 10);
  const modelDoc = await db.collection("models").findOne({ _id: modelId });
  if (!modelDoc) return res.status(404).json({ detail: "Model not found" });
  modelDoc.id = modelDoc._id;
  delete modelDoc._id;

  const runs = await db.collection("drift_runs").find({ model_id: modelId }).sort({ timestamp: 1, _id: 1 }).toArray();
  runs.forEach((r) => {
    r.id = r._id;
    delete r._id;
  });

  const alerts = await db.collection("alerts").find({ model_id: modelId }).sort({ timestamp: -1 }).toArray();
  alerts.forEach((a) => {
    a.id = a._id;
    delete a._id;
  });

  const versions = await db.collection("model_versions").find({ model_id: modelId }).sort({ version: -1 }).toArray();
  versions.forEach((v) => {
    v.id = v._id;
    delete v._id;
  });

  const pendingBatches = await db
    .collection("pending_batches")
    .find({ model_id: modelId, status: "pending" })
    .sort({ created_at: 1, _id: 1 })
    .toArray();
  pendingBatches.forEach((b) => {
    b.id = b._id;
    delete b._id;
  });

  res.json({ model: modelDoc, runs, alerts, versions, pending_batches: pendingBatches });
});

// ──────────── Create Model ────────────
router.post(
  "/",
  upload.fields([
    { name: "model_file", maxCount: 1 },
    { name: "scaler_file", maxCount: 1 },
    { name: "baseline_csv", maxCount: 1 },
    { name: "baseline_file", maxCount: 1 },
  ]),
  async (req, res) => {
    ensureDirs();
    const db = getDb();
    const {
      name,
      category,
      target_column = "default",
      feature_schema,
      threshold_moderate = "0.10",
      threshold_severe = "0.25",
    } = req.body;

    const modelFile = req.files?.model_file?.[0];
    const scalerFile = req.files?.scaler_file?.[0];
    const baselineFile = req.files?.baseline_csv?.[0] || req.files?.baseline_file?.[0];

    if (!name || !category || !target_column || !modelFile || !baselineFile) {
      return res.status(422).json({ detail: "Missing required fields (name, category, target_column, model_file, baseline_file/csv)" });
    }

    try {
      // Check for duplicate model name
      const existing = await db.collection("models").findOne({ name });
      if (existing) {
        return res.status(409).json({ detail: `A model named '${name}' already exists. Please choose a different name.` });
      }

      const modelId = await nextId("models");

      const modelPath = path.join(config.modelsDir, `model_${modelId}_v1.pkl`);
      fs.writeFileSync(modelPath, modelFile.buffer);

      let scalerPath = null;
      if (scalerFile) {
        scalerPath = path.join(config.modelsDir, `scaler_${modelId}_v1.pkl`);
        fs.writeFileSync(scalerPath, scalerFile.buffer);
      }

      let baselinePath = path.join(config.dataDir, `baseline_${modelId}_v1.csv`);
      fs.writeFileSync(baselinePath, baselineFile.buffer);

      let features = [];
      if (feature_schema) {
        features = typeof feature_schema === "string"
          ? feature_schema.split(",").map((f) => f.trim()).filter(Boolean)
          : (Array.isArray(feature_schema) ? feature_schema : []);
      }
      if (!features.length) {
        const records = parse(baselineFile.buffer, { to: 1, skip_empty_lines: true });
        if (records && records.length && records[0]) {
          features = records[0].map((c) => c.trim()).filter((c) => c && c !== target_column);
        }
      }

      const now = new Date();

      const modelDoc = {
        _id: modelId,
        name,
        category,
        modality: "tabular",
        status: "active",
        target_column,
        feature_schema: features,
        threshold_moderate: parseFloat(threshold_moderate),
        threshold_severe: parseFloat(threshold_severe),
        active_version: 1,
        fallback_version: 1,
        deployment_strategy: "canary",
        canary_traffic_pct: 0,
        retrain_lock: false,
        created_at: now,
        updated_at: now,
      };
      await db.collection("models").insertOne(modelDoc);

      await db.collection("model_versions").insertOne({
        model_id: modelId,
        version: 1,
        state: "active",
        artifact_path: modelPath,
        scaler_path: scalerPath,
        baseline_path: baselinePath,
        trigger_reason: "initial_registration",
        hyperparameters: {},
        evaluation_metrics: { accuracy: null, auc: null, f1_score: null },
        is_active: true,
        trained_at: now,
      });

      modelDoc.id = modelDoc._id;
      delete modelDoc._id;
      res.status(201).json(modelDoc);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ detail: `A model named '${name}' already exists. Please choose a different name.` });
      }
      res.status(500).json({ detail: err.message || "Failed to register model" });
    }
  }
);

// ──────────── Delete Model ────────────
router.delete("/:modelId", async (req, res) => {
  const db = getDb();
  const modelId = parseInt(req.params.modelId, 10);
  const model = await db.collection("models").findOne({ _id: modelId });
  if (!model) return res.status(404).json({ detail: "Model not found" });

  await db.collection("models").deleteOne({ _id: modelId });
  await db.collection("model_versions").deleteMany({ model_id: modelId });
  await db.collection("drift_runs").deleteMany({ model_id: modelId });
  await db.collection("alerts").deleteMany({ model_id: modelId });
  await db.collection("pending_batches").deleteMany({ model_id: modelId });

  res.json({ status: "deleted", model_id: modelId });
});

// ──────────── Upload Batch ────────────
router.post("/:modelId/upload-batch", upload.single("file"), async (req, res) => {
  ensureDirs();
  const db = getDb();
  const modelId = parseInt(req.params.modelId, 10);
  const model = await db.collection("models").findOne({ _id: modelId });
  if (!model) return res.status(404).json({ detail: "Model not found" });
  if (!req.file) return res.status(422).json({ detail: "file is required" });

  const batchName = `model_${modelId}_${req.file.originalname}`;
  const filePath = path.join(config.dataDir, "batches", batchName);
  fs.writeFileSync(filePath, req.file.buffer);

  const batchId = await nextId("pending_batches");
  const rowCount = countCsvRows(req.file.buffer);

  await db.collection("pending_batches").insertOne({
    _id: batchId,
    model_id: modelId,
    batch_name: batchName,
    file_path: filePath,
    row_count: rowCount,
    status: "pending",
    created_at: new Date(),
  });

  res.json({ message: "Batch uploaded", batches_created: 1, batch_id: batchId });
});

// ──────────── Process Batch ────────────
router.post("/:modelId/process-batch", async (req, res) => {
  const db = getDb();
  const modelId = parseInt(req.params.modelId, 10);
  const force = req.query.force === "true";

  const model = await db.collection("models").findOne({ _id: modelId });
  if (!model) return res.status(404).json({ detail: "Model not found" });

  const batch = await db
    .collection("pending_batches")
    .find({ model_id: modelId, status: "pending" })
    .sort({ created_at: 1 })
    .limit(1)
    .next();
  if (!batch) return res.json({ message: "No pending batches" });

  await db.collection("pending_batches").updateOne({ _id: batch._id }, { $set: { status: "processing" } });

  try {
    const version = await db.collection("model_versions").findOne({ model_id: modelId, is_active: true });
    const baselinePath = version?.baseline_path;
    if (!baselinePath || !fs.existsSync(baselinePath)) {
      throw new Error("Baseline CSV not found");
    }

    // Node orchestrates; the actual statistical computation happens in the
    // Python ML layer.
    const driftResult = await mlDriftAnalyze({
      baseline_path: baselinePath,
      current_path: batch.file_path,
      feature_columns: model.feature_schema || [],
      threshold_moderate: model.threshold_moderate ?? 0.1,
      threshold_severe: model.threshold_severe ?? 0.25,
      artifact_path: version?.artifact_path || null,
      scaler_path: version?.scaler_path || null,
      target_col: model.target_column || null,
    });

    const nextDriftId = await nextId("drift_runs");
    const runId = nextDriftId < 101 ? 101 : nextDriftId;
    const runDoc = {
      _id: runId,
      model_id: modelId,
      model_version: model.active_version || 1,
      batch_name: batch.batch_name,
      timestamp: new Date(),
      overall_psi: driftResult.overall_psi,
      overall_severity: driftResult.overall_severity,
      top_drifted_feature: driftResult.top_drifted_feature,
      prediction_psi: driftResult.prediction_psi ?? 0.0,
      prediction_severity: driftResult.prediction_severity ?? "none",
      target_psi: driftResult.target_psi ?? null,
      target_severity: driftResult.target_severity ?? null,
      accuracy: driftResult.accuracy ?? null,
      feature_drift: driftResult.feature_drift,
    };
    await db.collection("drift_runs").insertOne(runDoc);

    if (["moderate", "severe"].includes(driftResult.overall_severity)) {
      const nextAlertId = await nextId("alerts");
      const alertId = nextAlertId < 501 ? 501 : nextAlertId;
      await db.collection("alerts").insertOne({
        _id: alertId,
        model_id: modelId,
        drift_run_id: runId,
        batch_name: batch.batch_name,
        timestamp: new Date(),
        severity: driftResult.overall_severity,
        drift_type: "data_drift",
        feature_name: driftResult.top_drifted_feature,
        message: `${driftResult.overall_severity[0].toUpperCase()}${driftResult.overall_severity.slice(
          1
        )} drift detected on '${driftResult.top_drifted_feature}' (PSI: ${driftResult.overall_psi.toFixed(4)})`,
        acknowledged: false,
        acknowledged_at: null,
      });

      if (driftResult.overall_severity === "severe" && !force) {
        await db
          .collection("models")
          .updateOne({ _id: modelId }, { $set: { status: "blocked_pending_retrain", updated_at: new Date() } });
      }
    }

    await db.collection("pending_batches").updateOne({ _id: batch._id }, { $set: { status: "processed" } });

    runDoc.id = runDoc._id;
    delete runDoc._id;
    res.json(runDoc);
  } catch (err) {
    await db.collection("pending_batches").updateOne({ _id: batch._id }, { $set: { status: "failed" } });
    res.status(500).json({ detail: err.message });
  }
});

// ──────────── Retrain ────────────
router.post("/:modelId/retrain", async (req, res) => {
  const db = getDb();
  const modelId = parseInt(req.params.modelId, 10);
  const model = await db.collection("models").findOne({ _id: modelId });
  if (!model) return res.status(404).json({ detail: "Model not found" });

  // Distributed lock, same semantics as before, owned by Node now.
  const lockResult = await db
    .collection("models")
    .findOneAndUpdate(
      { _id: modelId, $or: [{ retrain_lock: { $exists: false } }, { retrain_lock: false }] },
      { $set: { retrain_lock: true, retrain_lock_acquired_at: new Date() } }
    );
  // mongodb driver v6: findOneAndUpdate resolves to the matched doc (pre-update) or null
  if (!lockResult) {
    return res.json({ status: "skipped", reason: "Retraining already in progress" });
  }

  try {
    const activeVersion = await db.collection("model_versions").findOne({ model_id: modelId, is_active: true });
    if (!activeVersion) {
      return res.json({ status: "error", reason: "No active version found" });
    }
    const baselinePath = activeVersion.baseline_path;
    if (!baselinePath || !fs.existsSync(baselinePath)) {
      return res.json({ status: "error", reason: "Baseline CSV not found" });
    }

    const nextVersion = (activeVersion.version || 1) + 1;

    const result = await mlRetrain({
      model_id: modelId,
      next_version: nextVersion,
      baseline_path: baselinePath,
      feature_cols: model.feature_schema || [],
      target_col: model.target_column,
      models_dir: config.modelsDir,
    });

    const championAccuracy = activeVersion.evaluation_metrics?.accuracy || 0.0;
    if (result.accuracy <= championAccuracy) {
      return res.json({
        status: "rejected",
        reason: `Candidate accuracy (${result.accuracy.toFixed(4)}) did not beat champion (${championAccuracy.toFixed(
          4
        )})`,
      });
    }

    await db
      .collection("model_versions")
      .updateOne({ _id: activeVersion._id }, { $set: { is_active: false, state: "retired" } });

    await db.collection("model_versions").insertOne({
      model_id: modelId,
      version: nextVersion,
      state: "active",
      artifact_path: result.artifact_path,
      scaler_path: result.scaler_path,
      baseline_path: baselinePath,
      trigger_reason: "drift_retrain",
      hyperparameters: { n_estimators: 100, max_depth: 4 },
      evaluation_metrics: { accuracy: result.accuracy, auc: result.auc, f1_score: result.f1_score },
      is_active: true,
      trained_at: new Date(),
    });

    await db
      .collection("models")
      .updateOne({ _id: modelId }, { $set: { active_version: nextVersion, updated_at: new Date(), status: "active" } });

    res.json({
      status: "promoted",
      new_version: nextVersion,
      accuracy: result.accuracy,
      auc: result.auc,
      f1_score: result.f1_score,
    });
  } finally {
    await db.collection("models").updateOne({ _id: modelId }, { $set: { retrain_lock: false } });
  }
});

// ──────────── Distribution ────────────
router.get("/:modelId/distribution/:batchName/:feature", async (req, res) => {
  const db = getDb();
  const modelId = parseInt(req.params.modelId, 10);
  const { batchName, feature } = req.params;

  const version = await db.collection("model_versions").findOne({ model_id: modelId, is_active: true });
  if (!version || !version.baseline_path) {
    return res.status(404).json({ detail: "Baseline not found" });
  }
  const batchPath = path.join(config.dataDir, "batches", batchName);
  if (!fs.existsSync(batchPath)) {
    return res.status(404).json({ detail: "Batch file not found" });
  }

  try {
    const result = await mlDistribution({
      baseline_path: version.baseline_path,
      current_path: batchPath,
      feature,
    });
    res.json(result);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { detail: err.message });
  }
});
