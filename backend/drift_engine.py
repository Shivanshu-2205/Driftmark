"""
Drift detection engine: PSI, Kolmogorov-Smirnov, Jensen-Shannon Divergence.
Computes per-feature drift scores comparing a current batch to baseline.
"""
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp, entropy
from scipy.spatial.distance import jensenshannon


def _bin_edges(reference: np.ndarray, n_bins: int = 10):
    """Quantile-based bin edges from reference distribution."""
    quantiles = np.linspace(0, 100, n_bins + 1)
    edges = np.percentile(reference, quantiles)
    edges[0] = -np.inf
    edges[-1] = np.inf
    return edges


def calculate_psi(reference: np.ndarray, current: np.ndarray, n_bins: int = 10) -> float:
    """
    Population Stability Index.
    PSI < 0.1: no significant shift
    0.1 <= PSI < 0.25: moderate shift
    PSI >= 0.25: significant shift
    """
    edges = _bin_edges(reference, n_bins)
    ref_counts, _ = np.histogram(reference, bins=edges)
    cur_counts, _ = np.histogram(current, bins=edges)

    ref_pct = ref_counts / max(len(reference), 1)
    cur_pct = cur_counts / max(len(current), 1)

    # avoid div by zero / log(0)
    ref_pct = np.where(ref_pct == 0, 1e-4, ref_pct)
    cur_pct = np.where(cur_pct == 0, 1e-4, cur_pct)

    psi = np.sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct))
    return float(psi)


def calculate_ks(reference: np.ndarray, current: np.ndarray) -> dict:
    """Kolmogorov-Smirnov 2-sample test. Returns statistic and p-value."""
    stat, p_value = ks_2samp(reference, current)
    return {"statistic": float(stat), "p_value": float(p_value)}


def calculate_js_divergence(reference: np.ndarray, current: np.ndarray, n_bins: int = 10) -> float:
    """Jensen-Shannon divergence between binned distributions (0 = identical, 1 = max different)."""
    edges = _bin_edges(reference, n_bins)
    ref_counts, _ = np.histogram(reference, bins=edges)
    cur_counts, _ = np.histogram(current, bins=edges)

    ref_dist = ref_counts / max(ref_counts.sum(), 1)
    cur_dist = cur_counts / max(cur_counts.sum(), 1)

    ref_dist = np.where(ref_dist == 0, 1e-8, ref_dist)
    cur_dist = np.where(cur_dist == 0, 1e-8, cur_dist)

    return float(jensenshannon(ref_dist, cur_dist))


def severity_from_psi(psi: float) -> str:
    if psi < 0.1:
        return "none"
    elif psi < 0.25:
        return "moderate"
    else:
        return "severe"


def compute_feature_drift(reference: pd.Series, current: pd.Series) -> dict:
    ref = reference.dropna().values
    cur = current.dropna().values
    psi = calculate_psi(ref, cur)
    ks = calculate_ks(ref, cur)
    js = calculate_js_divergence(ref, cur)
    return {
        "psi": round(psi, 4),
        "ks_statistic": round(ks["statistic"], 4),
        "ks_p_value": round(ks["p_value"], 6),
        "js_divergence": round(js, 4),
        "severity": severity_from_psi(psi),
        "ref_mean": round(float(ref.mean()), 4),
        "cur_mean": round(float(cur.mean()), 4),
        "ref_std": round(float(ref.std()), 4),
        "cur_std": round(float(cur.std()), 4),
    }


def compute_batch_drift(baseline_df: pd.DataFrame, current_df: pd.DataFrame, features: list) -> dict:
    """Computes drift for every feature in a batch and an overall score."""
    results = {}
    for feat in features:
        results[feat] = compute_feature_drift(baseline_df[feat], current_df[feat])

    overall_psi = float(np.mean([results[f]["psi"] for f in features]))
    max_psi_feature = max(features, key=lambda f: results[f]["psi"])

    return {
        "feature_drift": results,
        "overall_psi": round(overall_psi, 4),
        "overall_severity": severity_from_psi(overall_psi),
        "top_drifted_feature": max_psi_feature,
    }


def compute_prediction_drift(baseline_preds: np.ndarray, current_preds: np.ndarray) -> dict:
    """Drift in model output distribution (predicted probabilities)."""
    psi = calculate_psi(baseline_preds, current_preds)
    ks = calculate_ks(baseline_preds, current_preds)
    return {
        "psi": round(psi, 4),
        "ks_statistic": round(ks["statistic"], 4),
        "severity": severity_from_psi(psi),
    }


def compute_target_drift(baseline_labels: np.ndarray, current_labels: np.ndarray) -> dict:
    """Drift in label/target distribution (requires ground truth)."""
    ref_rate = float(np.mean(baseline_labels))
    cur_rate = float(np.mean(current_labels))
    psi = calculate_psi(baseline_labels.astype(float), current_labels.astype(float), n_bins=2)
    return {
        "baseline_positive_rate": round(ref_rate, 4),
        "current_positive_rate": round(cur_rate, 4),
        "psi": round(psi, 4),
        "severity": severity_from_psi(psi),
    }
