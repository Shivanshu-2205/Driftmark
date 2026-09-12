"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  Model,
  DriftRun,
  Alert as AlertType,
  ModelVersion,
  PendingBatch,
  DriftRunDetail,
} from "@/lib/api";
import { AppNavbar } from "@/components/Navbar";
import { SeverityTag, StatBlock, ErrorBanner, LoadingSpinner } from "@/components/ui";
import { DriftTrendChart, AccuracyTrendChart } from "@/components/DriftCharts";
import { DistributionChart } from "@/components/DistributionChart";

export default function ModelDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [model, setModel] = useState<Model | null>(null);
  const [runs, setRuns] = useState<DriftRun[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [pendingBatches, setPendingBatches] = useState<PendingBatch[]>([]);

  const [selectedRun, setSelectedRun] = useState<DriftRunDetail | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [distribution, setDistribution] = useState<{ baseline_values: number[]; current_values: number[] } | null>(null);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(200);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [forceIngest, setForceIngest] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      const data = await api.modelDetail(id);
      setModel(data.model);
      setRuns(data.runs);
      setAlerts(data.alerts);
      setVersions(data.versions);
      setPendingBatches(data.pending_batches);
      setErrorMessage(null);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to load model details.");
    }
  }, [id]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-selection of latest run and its first feature
  useEffect(() => {
    if (runs.length === 0) {
      setSelectedRun(null);
      setSelectedFeature("");
      setDistribution(null);
      return;
    }
    const latest = runs[runs.length - 1];
    api.driftRunDetail(id, latest.id).then((detail) => {
      setSelectedRun(detail);
      if (model && model.feature_schema.length > 0) {
        if (!selectedFeature || !model.feature_schema.includes(selectedFeature)) {
          setSelectedFeature(model.feature_schema[0]);
        }
      }
    });
  }, [runs, id, model]);

  // Load distribution when run or feature changes
  useEffect(() => {
    if (!selectedRun || !selectedFeature) return;
    api.distribution(id, selectedRun.batch_name, selectedFeature)
      .then(setDistribution)
      .catch(() => setDistribution(null));
  }, [selectedRun, selectedFeature, id]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chunk_size", chunkSize.toString());
      await api.uploadBatch(id, formData);
      setFile(null);
      const fileInput = document.getElementById("batch-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      await refreshAll();
    } catch (e: any) {
      setErrorMessage(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleProcessBatch = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      await api.processNextBatch(id, forceIngest);
      setForceIngest(false);
      await refreshAll();
    } catch (e: any) {
      setErrorMessage(e.message || "Processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setErrorMessage(null);
    try {
      await api.retrainModel(id);
      await refreshAll();
    } catch (e: any) {
      setErrorMessage(e.message || "Retrain failed.");
    } finally {
      setRetraining(false);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      await refreshAll();
    } catch (e: any) {
      setErrorMessage(e.message || "Acknowledge failed.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this model and all its historical records? This action is permanent!")) return;
    try {
      await api.deleteModel(id);
      router.push("/models");
    } catch (e: any) {
      setErrorMessage(e.message || "Delete failed.");
    }
  };

  if (!model) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <AppNavbar />
        <main style={{ maxWidth: 640, margin: "100px auto", padding: 24 }}>
          {errorMessage ? (
            <div className="card" style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>Error Loading Model</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>{errorMessage}</p>
              <Link href="/models" className="btn btn-outline" style={{ fontSize: 12 }}>
                ← Back to Registry
              </Link>
            </div>
          ) : (
            <LoadingSpinner text="Loading model telemetry..." />
          )}
        </main>
      </div>
    );
  }

  const latestRun = runs[runs.length - 1];
  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const activeVersion = versions.find((v) => v.is_active) || versions[versions.length - 1];
  const isBlocked = model.status === "blocked_pending_retrain";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNavbar />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}>
        {/* Breadcrumb & Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
            <Link href="/models" style={{ color: "var(--green)", textDecoration: "none" }}>
              ← Registry
            </Link>
            <span>/</span>
            <span>Model #{model.id}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge badge-muted">
              v{activeVersion?.version ?? 1} {activeVersion?.is_active ? "· Active" : ""}
            </span>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              style={{ fontSize: 12, padding: "5px 10px" }}
            >
              Delete Model
            </button>
          </div>
        </div>

        {/* Model Header Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {model.name}
              </h1>
              {isBlocked ? (
                <span className="badge badge-red">
                  <span className="dot dot-red pulse" style={{ width: 6, height: 6 }} />
                  Blocked
                </span>
              ) : (
                <span className="badge badge-green">
                  <span className="dot dot-green" style={{ width: 6, height: 6 }} />
                  Healthy
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
              <span>Category: <strong style={{ color: "var(--text-secondary)" }}>{model.category}</strong></span>
              <span>•</span>
              <span>Thresholds: <strong style={{ color: "var(--text-secondary)" }}>{model.threshold_moderate} (Mod) / {model.threshold_severe} (Sev)</strong></span>
            </div>
          </div>
        </div>

        {/* Blocked State Banner */}
        {isBlocked && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 6,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "var(--red)", marginBottom: 4 }}>
                <span className="dot dot-red pulse" style={{ width: 8, height: 8 }} />
                System Blocked: Severe Drift Detected
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, maxWidth: 800 }}>
                Automated ingestion pipeline is currently gated to prevent degraded inferences. Deploy a retrained model version to restore standard operating status.
              </p>
            </div>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="btn btn-amber"
              style={{ fontWeight: 600, fontSize: 13, padding: "8px 18px" }}
            >
              {retraining ? "Retraining Model..." : "⟲ Retrain Model Now"}
            </button>
          </div>
        )}

        {errorMessage && <ErrorBanner message={errorMessage} />}

        {/* 4 Stat KPI Blocks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          <StatBlock
            label="Overall Feature PSI"
            value={latestRun?.overall_psi ? latestRun.overall_psi.toFixed(4) : "—"}
            severity={latestRun?.overall_severity}
            sublabel={latestRun ? `Top: ${latestRun.top_drifted_feature}` : "No runs evaluated"}
          />
          <StatBlock
            label="Prediction Drift (PSI)"
            value={latestRun?.prediction_psi ? latestRun.prediction_psi.toFixed(4) : "—"}
            severity={latestRun?.prediction_severity}
            sublabel="vs baseline distribution"
          />
          <StatBlock
            label="Latest Accuracy"
            value={latestRun?.accuracy ? `${(latestRun.accuracy * 100).toFixed(1)}%` : "—"}
            severity={latestRun?.accuracy && latestRun.accuracy < 0.85 ? "severe" : "none"}
            sublabel="on latest batch"
          />
          <StatBlock
            label="Active Alerts"
            value={unacknowledged.length}
            severity={unacknowledged.length > 0 ? "severe" : "none"}
            sublabel={`${alerts.length} total alerts recorded`}
          />
        </div>

        {/* Control Console Panel (2-column) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16, marginBottom: 24 }}>
          {/* Column 1: Upload Data */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
              Upload &amp; Chunk Datastream
            </div>
            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="label" style={{ marginBottom: 4 }}>Production Inferences (.CSV / .XLSX)</label>
                <input
                  id="batch-file-input"
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  className="input"
                  style={{ padding: 6, fontSize: 12 }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label className="label" style={{ marginBottom: 4 }}>Chunk Size (Rows/Batch)</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                    required
                    className="input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="btn btn-primary"
                  style={{ height: 38 }}
                >
                  {uploading ? "Chunking..." : "⚡ Queue Datastream"}
                </button>
              </div>
            </form>
          </div>

          {/* Column 2: Ingestion Controller */}
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
                Ingestion Controller
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>Pending Queue</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    {pendingBatches.length} batch{pendingBatches.length === 1 ? "" : "es"} queued
                  </span>
                </div>
                {pendingBatches.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Next Batch</span>
                    <span style={{ color: "var(--amber)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                      {pendingBatches[0].batch_name} ({pendingBatches[0].row_count} records)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              <button
                onClick={handleProcessBatch}
                disabled={pendingBatches.length === 0 || processing || (isBlocked && !forceIngest)}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center", height: 38 }}
              >
                {processing ? "Evaluating Drift..." : pendingBatches.length > 0 ? `▶ Run ${pendingBatches[0].batch_name}` : "Queue is Empty"}
              </button>

              {isBlocked && (
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--red)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={forceIngest}
                    onChange={(e) => setForceIngest(e.target.checked)}
                    style={{ accentColor: "var(--red)" }}
                  />
                  <span>Force Bypass Gate</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Section & Sidebar Grid */}
        <div className="analytics-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
          {/* Left Column: Visual Analytics */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Chart 1: Drift Trend */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    Population Stability Index (PSI) Trend
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Rolling batch drift evaluation against reference baseline
                  </div>
                </div>
              </div>
              <DriftTrendChart runs={runs} thresholdSevere={model.threshold_severe} />
            </div>

            {/* Chart 2: Accuracy */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                Model Accuracy Over Time
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
                Inference performance against minimum 85% SLA floor
              </div>
              <AccuracyTrendChart runs={runs} />
            </div>

            {/* Chart 3: Distribution Comparison */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    Feature Distribution: Baseline vs Current
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Histogram comparison for selected feature vector
                  </div>
                </div>
                <select
                  value={selectedFeature}
                  onChange={(e) => setSelectedFeature(e.target.value)}
                  className="input"
                  style={{ width: "auto", minWidth: 160, padding: "5px 10px", fontSize: 12 }}
                >
                  {model.feature_schema.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {distribution ? (
                <DistributionChart baseline={distribution.baseline_values} current={distribution.current_values} />
              ) : (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--text-muted)" }}>
                  Select a run and feature to view comparative distributions
                </div>
              )}

              {selectedRun && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: 12 }}>
                  {Object.entries(selectedRun.feature_drift)
                    .filter(([f]) => f === selectedFeature)
                    .map(([f, d]) => (
                      <div key={f} style={{ display: "contents" }}>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>PSI Score</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--green-bright)" }}>
                            {d.psi.toFixed(4)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>JS Divergence</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                            {d.js_divergence.toFixed(4)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>KS p-value</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                            {d.ks_p_value.toFixed(6)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Severity</div>
                          <SeverityTag severity={d.severity} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Operational Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Run Logs */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                Drift Run Logs
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                {runs.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
                    No drift evaluation runs recorded
                  </div>
                )}
                {runs.slice().reverse().map((run) => (
                  <div
                    key={run.id}
                    onClick={() => api.driftRunDetail(id, run.id).then(setSelectedRun)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: run.id === selectedRun?.id ? "var(--green)" : "var(--border)",
                      background: run.id === selectedRun?.id ? "var(--surface-raised)" : "transparent",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {run.batch_name}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        PSI: {run.overall_psi.toFixed(4)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <SeverityTag severity={run.overall_severity} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(api.getReportUrl(id, run.id));
                        }}
                        className="btn btn-outline"
                        style={{ fontSize: 10, padding: "3px 7px" }}
                        title="Download PDF Audit Report"
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Feed */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  Alert Feed
                </div>
                <span className="badge badge-muted">{unacknowledged.length} pending</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                {alerts.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
                    No alerts generated
                  </div>
                )}
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 4,
                      borderLeft: `3px solid ${a.acknowledged ? "var(--border)" : "var(--red)"}`,
                      background: a.acknowledged ? "transparent" : "var(--surface-raised)",
                      opacity: a.acknowledged ? 0.5 : 1,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        [{a.batch_name}]
                      </span>
                      <SeverityTag severity={a.severity} />
                    </div>
                    <div style={{ color: "var(--text-primary)", fontSize: 11, marginBottom: 4 }}>{a.message}</div>
                    {!a.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(a.id)}
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: "2px 6px", color: "var(--text-muted)" }}
                      >
                        ✓ Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Drift Ranker */}
            {selectedRun && (
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                  Feature Drift Ranker
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                  {Object.entries(selectedRun.feature_drift)
                    .sort((a, b) => b[1].psi - a[1].psi)
                    .map(([f, d]) => (
                      <div
                        key={f}
                        onClick={() => setSelectedFeature(f)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          borderRadius: 4,
                          cursor: "pointer",
                          background: f === selectedFeature ? "var(--surface-raised)" : "transparent",
                          border: f === selectedFeature ? "1px solid var(--border)" : "1px solid transparent",
                        }}
                      >
                        <span style={{ color: f === selectedFeature ? "var(--green)" : "var(--text-secondary)" }}>
                          {f}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                            {d.psi.toFixed(4)}
                          </span>
                          <SeverityTag severity={d.severity} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Version Lineage */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                Model Lineage &amp; Versions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                {versions.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 6,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", marginRight: 6 }}>
                        v{v.version}
                      </span>
                      {v.is_active && (
                        <span className="badge badge-green" style={{ fontSize: 10, padding: "1px 5px" }}>
                          Active
                        </span>
                      )}
                    </div>
                    <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      acc {v.accuracy ? (v.accuracy * 100).toFixed(1) + "%" : "—"} · auc {v.auc ? v.auc.toFixed(3) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}