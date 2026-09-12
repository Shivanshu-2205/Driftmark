"""
Statistical Drift Engine
Implements PSI, KS Two-Sample Test, and Jensen-Shannon Divergence
for feature distribution drift detection.
"""

import numpy as np
from scipy import stats
from scipy.spatial.distance import jensenshannon


# ─────────────────────────────────────────
# PSI – Population Stability Index
# ─────────────────────────────────────────

def compute_psi(baseline: list[float], current: list[float], bins: int = 10) -> float:
    """
    PSI = Σ (actual% - baseline%) × ln(actual% / baseline%)
    < 0.10 → Stable
    0.10–0.25 → Moderate drift
    ≥ 0.25 → Severe drift
    """
    baseline_arr = np.array(baseline, dtype=float)
    current_arr = np.array(current, dtype=float)

    # Compute bin edges from baseline
    bin_edges = np.percentile(baseline_arr, np.linspace(0, 100, bins + 1))
    bin_edges = np.unique(bin_edges)
    if len(bin_edges) < 2:
        return 0.0

    baseline_counts, _ = np.histogram(baseline_arr, bins=bin_edges)
    current_counts, _ = np.histogram(current_arr, bins=bin_edges)

    # Avoid division by zero by replacing 0s with small epsilon
    eps = 1e-8
    baseline_pct = (baseline_counts / len(baseline_arr)).clip(min=eps)
    current_pct = (current_counts / len(current_arr)).clip(min=eps)

    psi = np.sum((current_pct - baseline_pct) * np.log(current_pct / baseline_pct))
    return float(round(psi, 6))


# ─────────────────────────────────────────
# KS Test – Kolmogorov-Smirnov
# ─────────────────────────────────────────

def compute_ks(baseline: list[float], current: list[float]) -> dict:
    """
    Two-sample KS test. Returns statistic and p-value.
    p < 0.05 → statistically significant distribution shift.
    """
    ks_stat, p_value = stats.ks_2samp(baseline, current)
    return {"ks_statistic": float(round(ks_stat, 6)), "ks_p_value": float(round(p_value, 6))}


# ─────────────────────────────────────────
# Jensen-Shannon Divergence
# ─────────────────────────────────────────

def compute_js_divergence(baseline: list[float], current: list[float], bins: int = 10) -> float:
    """
    Bounded symmetric divergence (0 → identical, 1 → maximally different).
    """
    baseline_arr = np.array(baseline, dtype=float)
    current_arr = np.array(current, dtype=float)

    bin_edges = np.linspace(
        min(baseline_arr.min(), current_arr.min()),
        max(baseline_arr.max(), current_arr.max()),
        bins + 1,
    )

    p, _ = np.histogram(baseline_arr, bins=bin_edges, density=True)
    q, _ = np.histogram(current_arr, bins=bin_edges, density=True)

    eps = 1e-8
    p = p + eps
    q = q + eps

    js = float(jensenshannon(p, q))
    return round(js, 6)


# ─────────────────────────────────────────
# Severity Classifier
# ─────────────────────────────────────────

def classify_severity(psi: float, threshold_moderate: float = 0.10, threshold_severe: float = 0.25) -> str:
    if psi >= threshold_severe:
        return "severe"
    if psi >= threshold_moderate:
        return "moderate"
    return "none"


# ─────────────────────────────────────────
# Per-Feature Drift Analysis
# ─────────────────────────────────────────

def analyze_feature(
    feature_name: str,
    baseline: list[float],
    current: list[float],
    threshold_moderate: float = 0.10,
    threshold_severe: float = 0.25,
) -> dict:
    """Run PSI, KS, JS on a single feature and return full stats."""
    psi = compute_psi(baseline, current)
    ks = compute_ks(baseline, current)
    js = compute_js_divergence(baseline, current)
    severity = classify_severity(psi, threshold_moderate, threshold_severe)

    return {
        "psi": psi,
        "ks_statistic": ks["ks_statistic"],
        "ks_p_value": ks["ks_p_value"],
        "js_divergence": js,
        "severity": severity,
        "ref_mean": float(round(float(np.mean(baseline)), 4)),
        "cur_mean": float(round(float(np.mean(current)), 4)),
        "ref_std": float(round(float(np.std(baseline)), 4)),
        "cur_std": float(round(float(np.std(current)), 4)),
    }


# ─────────────────────────────────────────
# Batch Drift Run
# ─────────────────────────────────────────

def run_drift_analysis(
    baseline_df,
    current_df,
    feature_columns: list[str],
    threshold_moderate: float = 0.10,
    threshold_severe: float = 0.25,
    artifact_path: str | None = None,
    scaler_path: str | None = None,
    target_col: str | None = None,
) -> dict:
    """
    Compute drift across all features.
    Returns overall PSI, per-feature stats, severity, top drifted feature,
    prediction drift, and accuracy if model/target are available.
    """
    feature_drift = {}
    psi_values = []
    top_feature = None
    top_psi = -1.0

    for col in feature_columns:
        if col not in baseline_df.columns or col not in current_df.columns:
            continue
        baseline_vals = baseline_df[col].dropna().tolist()
        current_vals = current_df[col].dropna().tolist()
        if not baseline_vals or not current_vals:
            continue

        stats_result = analyze_feature(
            col, baseline_vals, current_vals, threshold_moderate, threshold_severe
        )
        feature_drift[col] = stats_result
        psi_values.append(stats_result["psi"])

        if stats_result["psi"] > top_psi:
            top_psi = stats_result["psi"]
            top_feature = col

    overall_psi = float(round(float(np.mean(psi_values)), 6)) if psi_values else 0.0
    overall_severity = classify_severity(overall_psi, threshold_moderate, threshold_severe)

    # Optional model prediction drift and accuracy
    prediction_psi = 0.0
    prediction_severity = "none"
    target_psi = None
    target_severity = None
    accuracy = None

    if artifact_path and os.path.exists(artifact_path):
        try:
            import pickle
            from sklearn.metrics import accuracy_score
            with open(artifact_path, "rb") as f:
                clf = pickle.load(f)

            scaler = None
            if scaler_path and os.path.exists(scaler_path):
                with open(scaler_path, "rb") as f:
                    scaler = pickle.load(f)

            X_base = baseline_df[feature_columns].fillna(0)
            X_curr = current_df[feature_columns].fillna(0)

            if scaler:
                X_base_s = scaler.transform(X_base)
                X_curr_s = scaler.transform(X_curr)
            else:
                X_base_s = X_base.values
                X_curr_s = X_curr.values

            # Probabilities or raw predictions
            if hasattr(clf, "predict_proba"):
                base_preds = clf.predict_proba(X_base_s)[:, 1].tolist()
                curr_preds = clf.predict_proba(X_curr_s)[:, 1].tolist()
            else:
                base_preds = clf.predict(X_base_s).tolist()
                curr_preds = clf.predict(X_curr_s).tolist()

            prediction_psi = compute_psi(base_preds, curr_preds)
            prediction_severity = classify_severity(prediction_psi, threshold_moderate, threshold_severe)

            # Accuracy if target is present
            if target_col and target_col in current_df.columns:
                curr_labels = (np.array(curr_preds) >= 0.5).astype(int) if hasattr(clf, "predict_proba") else clf.predict(X_curr_s)
                y_true = current_df[target_col].dropna()
                if len(y_true) == len(curr_labels):
                    accuracy = float(round(accuracy_score(y_true, curr_labels), 4))

            if target_col and target_col in baseline_df.columns and target_col in current_df.columns:
                target_psi = compute_psi(baseline_df[target_col].tolist(), current_df[target_col].tolist())
                target_severity = classify_severity(target_psi, threshold_moderate, threshold_severe)
        except Exception:
            pass

    return {
        "overall_psi": overall_psi,
        "overall_severity": overall_severity,
        "top_drifted_feature": top_feature,
        "prediction_psi": prediction_psi,
        "prediction_severity": prediction_severity,
        "target_psi": target_psi,
        "target_severity": target_severity,
        "accuracy": accuracy,
        "feature_drift": feature_drift,
    }
