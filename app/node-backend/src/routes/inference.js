import { Router } from "express";
import { randomUUID } from "crypto";
import { getDb } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { mlInfer } from "../services/mlClient.js";

export const router = Router();
router.use(requireAuth);

// ──────────── Predict ────────────
router.post("/predict", async (req, res) => {
  const db = getDb();
  const { prediction_id, model_id, features } = req.body;
  if (model_id === undefined || !features) {
    return res.status(422).json({ detail: "model_id and features are required" });
  }

  const modelDoc = await db.collection("models").findOne({ _id: model_id });
  if (!modelDoc) return res.status(404).json({ detail: "Model not found" });

  const version = await db.collection("model_versions").findOne({ model_id, is_active: true });
  if (!version) return res.status(404).json({ detail: "No active model version found" });

  const artifactPath = version.artifact_path;
  if (!artifactPath) return res.status(500).json({ detail: "Model artifact path not set" });

  const featureCols = modelDoc.feature_schema || Object.keys(features);

  let result;
  try {
    // Node controls the request; the Python ML layer only computes.
    result = await mlInfer({
      artifact_path: artifactPath,
      scaler_path: version.scaler_path || null,
      feature_cols: featureCols,
      features,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json(err.response?.data || { detail: err.message });
  }

  const predId = prediction_id || `pred_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

  const logDoc = {
    prediction_id: predId,
    served_at: new Date(),
    meta: {
      model_id,
      model_version: version.version || 1,
      environment: "production",
    },
    raw_features: features,
    preprocessed_vector: result.preprocessed_vector,
    prediction_score: result.prediction_score,
    predicted_label: result.predicted_label,
    confidence: result.confidence,
    latency_ms: result.latency_ms,
    ground_truth: null,
    ground_truth_at: null,
    label_delay_hours: null,
  };

  try {
    await db.collection("prediction_logs").insertOne(logDoc);
  } catch (_) {
    // Logging failure should not block the prediction response.
  }

  res.json({
    prediction_id: predId,
    prediction_score: result.prediction_score,
    predicted_label: result.predicted_label,
    confidence: result.confidence,
    latency_ms: result.latency_ms,
    model_version: version.version || 1,
  });
});

// ──────────── Ground Truth ────────────
router.post("/ground-truth", async (req, res) => {
  const db = getDb();
  const { prediction_id, ground_truth } = req.body;
  if (!prediction_id || ground_truth === undefined) {
    return res.status(422).json({ detail: "prediction_id and ground_truth are required" });
  }

  const now = new Date();
  const result = await db
    .collection("prediction_logs")
    .findOneAndUpdate(
      { prediction_id },
      { $set: { ground_truth, ground_truth_at: now } }
    );

  if (!result) {
    return res.status(404).json({ detail: "Prediction log not found. It may still be writing – retry shortly." });
  }
  res.json({ status: "joined", prediction_id });
});
