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
import { SeverityTag, StatBlock } from "@/components/ui";
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

  // Handle auto-selection of latest run and its first feature
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
        // preserve selection if still in schema, else pick first
        if (!selectedFeature || !model.feature_schema.includes(selectedFeature)) {
          setSelectedFeature(model.feature_schema[0]);
        }
      }
    });
  }, [runs, id, model]);

  // Load distribution when run or feature selection changes
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
      // Reset input element
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
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="panel p-6 text-center">
          {errorMessage ? (
            <>
              <div className="text-xl text-[var(--danger)] mb-2 glow-text">▓ ERROR LOADING MODEL</div>
              <p className="text-xs opacity-70 mb-4">{errorMessage}</p>
              <Link href="/models" className="text-xs underline hover:opacity-100">Back to Registry</Link>
            </>
          ) : (
            <div className="text-sm blink">LOADING MODEL DATA...</div>
          )}
        </div>
      </main>
    );
  }

  const latestRun = runs[runs.length - 1];
  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const activeVersion = versions.find((v) => v.is_active) || versions[versions.length - 1];
  const isBlocked = model.status === "blocked_pending_retrain";

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: "var(--border-dim)" }}>
        <div>
          <div className="text-xs opacity-50 flex items-center gap-2 mb-1">
            <Link href="/models" className="hover:underline text-[var(--phosphor)]">← BACK TO REGISTRY</Link>
            <span>//</span>
            <span>MODEL ID: #{model.id}</span>
          </div>
          <h1 className="text-2xl font-extrabold glow-text tracking-tight uppercase">
            {model.name}<span className="blink">_</span>
          </h1>
          <p className="text-xs opacity-50">{model.category}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="opacity-40">MODEL VERSION v{activeVersion?.version ?? 1}</span>
          <button
            onClick={handleDelete}
            className="px-2 py-1 text-[10px] border border-red-900 text-red-500 hover:bg-[rgba(239,68,68,0.08)] transition"
          >
            [X] DELETE MODEL
          </button>
        </div>
      </header>

      {/* Blocked state banner */}
      {isBlocked && (
        <div className="panel border-[var(--danger)] p-4 mb-6 flex items-center justify-between flex-wrap gap-4" style={{ background: "rgba(255,65,54,0.06)", boxShadow: "0 0 10px rgba(255,65,54,0.1) inset" }}>
          <div>
            <div className="text-sm font-bold text-[var(--danger)] glow-text animate-pulse mb-1">
              ▓ SYSTEM BLOCKED: SEVERE DRIFT DETECTED
            </div>
            <p className="text-xs opacity-80 max-w-2xl">
              Model performance is compromised. Automated processing pipeline is currently gated. Please trigger simulated retraining to redeploy weights and restore service.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="px-4 py-2 text-xs font-bold border border-[var(--amber)] text-[var(--amber)] hover:bg-[rgba(255,182,39,0.08)] transition"
            >
              {retraining ? "DEPLOYING RETRAIN..." : "⟲ RETRAIN MODEL NOW"}
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="panel border-red-500 p-3 mb-6 text-xs text-red-400 bg-black/40">
          <span className="font-bold">SYSTEM ERROR:</span> {errorMessage}
        </div>
      )}

      {/* Summary blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBlock
          label="Overall Feature PSI"
          value={latestRun?.overall_psi ? latestRun.overall_psi.toFixed(4) : "—"}
          severity={latestRun?.overall_severity}
          sublabel={latestRun ? `Top: ${latestRun.top_drifted_feature}` : "No runs processed"}
        />
        <StatBlock
          label="Prediction Drift"
          value={latestRun?.prediction_psi ? latestRun.prediction_psi.toFixed(4) : "—"}
          severity={latestRun?.prediction_severity}
          sublabel="vs baseline output"
        />
        <StatBlock
          label="Accuracy"
          value={latestRun?.accuracy ? `${(latestRun.accuracy * 100).toFixed(1)}%` : "—"}
          severity={latestRun?.accuracy && latestRun.accuracy < 0.85 ? "severe" : "none"}
          sublabel="on latest batch"
        />
        <StatBlock
          label="Active Alerts"
          value={unacknowledged.length}
          severity={unacknowledged.length > 0 ? "severe" : "none"}
          sublabel={`${alerts.length} total alerts`}
        />
      </div>

      {/* Control console panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Dataset file chunking upload form */}
        <div className="panel p-4">
          <h2 className="text-xs font-bold mb-3 opacity-60 tracking-wider">▲ UPLOAD AND CHUNK DATASTREAM</h2>
          <form onSubmit={handleUpload} className="space-y-3 text-xs">
            <div>
              <label className="block mb-1 opacity-60">Production File (.CSV / .XLSX):</label>
              <input
                id="batch-file-input"
                type="file"
                accept=".csv, .xls, .xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full bg-black border border-[var(--border-dim)] p-2 text-xs"
                style={{ color: "var(--phosphor)" }}
              />
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block mb-1 opacity-60">Chunk Size (Rows/Batch):</label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  required
                  className="w-full bg-black border border-[var(--border-dim)] p-2 text-xs"
                  style={{ color: "var(--phosphor)" }}
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="px-4 py-2 font-bold border border-[var(--phosphor)] glow-border hover:bg-[rgba(57,255,106,0.08)] disabled:opacity-30 transition"
                >
                  {uploading ? "CHUNK-SLICING..." : "⚡ QUEUE DATASTREAM"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Process Next Batch controller */}
        <div className="panel p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold mb-3 opacity-60 tracking-wider">▶ INGESTION CONTROLLER</h2>
            <div className="text-xs space-y-2 mb-4">
              <div className="flex justify-between border-b border-[var(--border-dim)] pb-1.5">
                <span className="opacity-60">Pending Batches:</span>
                <span className="font-bold">{pendingBatches.length} batches queued</span>
              </div>
              {pendingBatches.length > 0 && (
                <div className="flex justify-between">
                  <span className="opacity-60">Next Chunk:</span>
                  <span className="opacity-80 text-amber-400">
                    {pendingBatches[0].batch_name} ({pendingBatches[0].row_count} rows)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleProcessBatch}
              disabled={pendingBatches.length === 0 || processing || (isBlocked && !forceIngest)}
              className="flex-1 py-2.5 font-bold border glow-border text-sm disabled:opacity-30 hover:bg-[rgba(57,255,106,0.08)] transition"
              style={{ borderColor: "var(--phosphor-dim)" }}
            >
              {processing ? "CALCULATING DRIFT..." : pendingBatches.length > 0 ? `▶ RUN ${pendingBatches[0].batch_name.toUpperCase()}` : "QUEUE IS EMPTY"}
            </button>

            {isBlocked && (
              <label className="flex items-center gap-1.5 text-xs text-[var(--danger)] font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceIngest}
                  onChange={(e) => setForceIngest(e.target.checked)}
                  className="accent-red-600"
                />
                FORCE BYPASS
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="panel p-4">
            <h2 className="text-sm font-bold mb-3 opacity-80 tracking-wide">DRIFT TREND // PSI OVER TIME</h2>
            <DriftTrendChart runs={runs} thresholdSevere={model.threshold_severe} />
          </div>
          <div className="panel p-4">
            <h2 className="text-sm font-bold mb-3 opacity-80 tracking-wide">MODEL ACCURACY OVER TIME</h2>
            <AccuracyTrendChart runs={runs} />
          </div>
          <div className="panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold opacity-80 tracking-wide">FEATURE DISTRIBUTION // BASELINE VS CURRENT</h2>
              <select
                value={selectedFeature}
                onChange={(e) => setSelectedFeature(e.target.value)}
                className="bg-black border text-xs px-2 py-1"
                style={{ borderColor: "var(--border-dim)", color: "var(--phosphor)" }}
              >
                {model.feature_schema.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            {distribution ? (
              <DistributionChart baseline={distribution.baseline_values} current={distribution.current_values} />
            ) : (
              <div className="h-[220px] flex items-center justify-center text-xs opacity-40">No distribution values loaded</div>
            )}
            {selectedRun && (
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                {Object.entries(selectedRun.feature_drift)
                  .filter(([f]) => f === selectedFeature)
                  .map(([f, d]) => (
                    <div key={f} className="contents">
                      <div className="opacity-60">PSI: <span className="font-bold" style={{ color: "var(--phosphor-bright)" }}>{d.psi.toFixed(4)}</span></div>
                      <div className="opacity-60">JS Divergence: <span className="font-bold">{d.js_divergence.toFixed(4)}</span></div>
                      <div className="opacity-60">KS p-value: <span className="font-bold">{d.ks_p_value.toFixed(6)}</span></div>
                      <div className="opacity-60">Severity: <SeverityTag severity={d.severity} /></div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side panels */}
        <div className="space-y-6">
          {/* Historical list with PDF buttons */}
          <div className="panel p-4">
            <h2 className="text-sm font-bold mb-3 opacity-80 tracking-wide">DRIFT RUN LOGS</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto text-xs pr-1">
              {runs.length === 0 && <div className="opacity-40">No runs logged yet.</div>}
              {runs.slice().reverse().map((run) => (
                <div
                  key={run.id}
                  onClick={() => api.driftRunDetail(id, run.id).then(setSelectedRun)}
                  className="flex items-center justify-between p-2 border border-[var(--border-dim)] hover:bg-[rgba(57,255,106,0.06)] cursor-pointer transition"
                  style={{ background: run.id === selectedRun?.id ? "rgba(57,255,106,0.08)" : "transparent" }}
                >
                  <div>
                    <div className="font-bold text-white uppercase">{run.batch_name}</div>
                    <div className="opacity-50 text-[10px]">PSI: {run.overall_psi.toFixed(4)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityTag severity={run.overall_severity} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(api.getReportUrl(id, run.id));
                      }}
                      className="px-2 py-1 text-[10px] font-bold border border-green-700 hover:bg-[rgba(57,255,106,0.15)] transition"
                      style={{ color: "var(--phosphor-bright)" }}
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="text-sm font-bold mb-3 opacity-80 tracking-wide">ALERT FEED</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {alerts.length === 0 && <div className="text-xs opacity-40">No alerts yet.</div>}
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="border-l-2 pl-2 py-1 text-xs"
                  style={{ borderColor: a.acknowledged ? "var(--phosphor-dim)" : "var(--danger)", opacity: a.acknowledged ? 0.4 : 1 }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="opacity-60 font-bold">[{a.batch_name.toUpperCase()}]</span>
                    <SeverityTag severity={a.severity} />
                  </div>
                  <div className="mt-1">{a.message}</div>
                  {!a.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      className="text-xs underline opacity-60 hover:opacity-100 mt-1"
                    >
                      acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedRun && (
            <div className="panel p-4">
              <h2 className="text-sm font-bold mb-3 opacity-80 tracking-wide">FEATURE BREAKDOWN</h2>
              <div className="space-y-1 text-xs">
                {Object.entries(selectedRun.feature_drift)
                  .sort((a, b) => b[1].psi - a[1].psi)
                  .map(([f, d]) => (
                    <div
                      key={f}
                      onClick={() => setSelectedFeature(f)}
                      className="flex justify-between items-center py-1 px-1 cursor-pointer hover:bg-[rgba(57,255,106,0.06)]"
                      style={{ background: f === selectedFeature ? "rgba(57,255,106,0.08)" : "transparent" }}
                    >
                      <span>{f}</span>
                      <span className="flex items-center gap-2">
                        <span className="opacity-60">{d.psi.toFixed(4)}</span>
                        <SeverityTag severity={d.severity} />
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="panel p-4">
            <h2 className="text-sm font-bold mb-3 opacity-80 tracking-wide">MODEL VERSION HISTORY</h2>
            <div className="space-y-2 text-xs">
              {versions.map((v) => (
                <div key={v.id} className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border-dim)" }}>
                  <span>v{v.version} {v.is_active && <span style={{ color: "var(--phosphor-bright)" }}>● active</span>}</span>
                  <span className="opacity-60">acc {v.accuracy ? v.accuracy.toFixed(4) : "—"} / auc {v.auc ? v.auc.toFixed(4) : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
