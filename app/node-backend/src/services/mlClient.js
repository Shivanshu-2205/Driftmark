import axios from "axios";
import { config } from "../config.js";

// The Node layer is in control: it decides *when* to call the Python ML
// layer, persists all results, and owns auth/business logic. The Python
// layer is a stateless compute worker with no DB access of its own.
const ml = axios.create({ baseURL: config.mlServiceUrl, timeout: 120000 });

export async function mlInfer({ artifact_path, scaler_path, feature_cols, features }) {
  const { data } = await ml.post("/infer", { artifact_path, scaler_path, feature_cols, features });
  return data;
}

export async function mlDriftAnalyze({
  baseline_path,
  current_path,
  feature_columns,
  threshold_moderate,
  threshold_severe,
  artifact_path,
  scaler_path,
  target_col,
}) {
  const { data } = await ml.post("/drift/analyze", {
    baseline_path,
    current_path,
    feature_columns,
    threshold_moderate,
    threshold_severe,
    artifact_path,
    scaler_path,
    target_col,
  });
  return data;
}

export async function mlDistribution({ baseline_path, current_path, feature }) {
  const { data } = await ml.post("/drift/distribution", { baseline_path, current_path, feature });
  return data;
}

export async function mlRetrain({ model_id, next_version, baseline_path, feature_cols, target_col, models_dir }) {
  const { data } = await ml.post("/retrain", {
    model_id,
    next_version,
    baseline_path,
    feature_cols,
    target_col,
    models_dir,
  });
  return data;
}
