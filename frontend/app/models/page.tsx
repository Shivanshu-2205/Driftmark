"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, Model } from "@/lib/api";
import { AppNavbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/ui";

function StatusBadge({ status }: { status: string }) {
  const isBlocked = status === "blocked_pending_retrain";
  if (isBlocked) {
    return (
      <span className="badge badge-red">
        <span className="dot dot-red" style={{ width: 5, height: 5 }} />
        Blocked
      </span>
    );
  }
  return (
    <span className="badge badge-green">
      <span className="dot dot-green" style={{ width: 5, height: 5 }} />
      Active
    </span>
  );
}

function AlertBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>0 alerts</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--red)", fontWeight: 600 }}>
      <span className="dot dot-red pulse" style={{ width: 6, height: 6 }} />
      {count} alert{count > 1 ? "s" : ""}
    </span>
  );
}

function PSIValue({ psi, severity }: { psi: number | null; severity?: string }) {
  if (psi === null) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const color = severity === "severe" ? "var(--red)" : severity === "moderate" ? "var(--amber)" : "var(--green)";
  return <span style={{ color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{psi.toFixed(4)}</span>;
}

function ModelCard({ model }: { model: Model }) {
  const isBlocked = model.status === "blocked_pending_retrain";

  return (
    <div
      className="card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        transition: "border-color 0.15s",
        borderColor: isBlocked ? "rgba(239,68,68,0.3)" : undefined,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isBlocked ? "rgba(239,68,68,0.5)" : "rgba(66,74,65,0.8)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isBlocked ? "rgba(239,68,68,0.3)" : "var(--border)"; }}
    >
      {/* Card header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>#{model.id}</span>
        <StatusBadge status={model.status} />
      </div>

      {/* Model name */}
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {model.name}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>{model.category}</div>

      {/* Metrics */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "12px 0", marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: "var(--text-muted)" }}>Last check</span>
          <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {model.last_run ? model.last_run.batch_name : "—"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: "var(--text-muted)" }}>Overall PSI</span>
          <PSIValue psi={model.last_run?.overall_psi ?? null} severity={model.last_run?.overall_severity} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: "var(--text-muted)" }}>Thresholds</span>
          <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {model.threshold_moderate} / {model.threshold_severe}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <AlertBadge count={model.active_alerts_count} />
        <Link href={`/models/${model.id}`} className="btn btn-outline" style={{ fontSize: 12, padding: "5px 12px" }}>
          Dashboard →
        </Link>
      </div>
    </div>
  );
}

function EmptyCard() {
  return (
    <div style={{
      border: "1px dashed var(--border)",
      borderRadius: 6,
      padding: 32,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      textAlign: "center",
      minHeight: 240,
    }}>
      <div style={{ fontSize: 28, color: "var(--text-muted)" }}>+</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Register New Model</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 200 }}>
        Connect a pre-trained model to start drift monitoring
      </div>
      <Link href="/models/new" className="btn btn-outline" style={{ fontSize: 12, marginTop: 4 }}>
        + Register Model
      </Link>
    </div>
  );
}

export default function ModelRegistry() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const loadModels = useCallback(async () => {
    try {
      await api.health();
      setApiOnline(true);
      const data = await api.models();
      setModels(data);
    } catch {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadModels(); }, [loadModels]);

  if (apiOnline === false) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <AppNavbar />
        <div style={{ maxWidth: 480, margin: "120px auto", padding: 24 }}>
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--red)", marginBottom: 10 }}>Connection Failed</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
              Cannot reach the DriftWatch API. Make sure the backend is running at:
            </p>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--amber)" }}>http://localhost:8000</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNavbar />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: 4 }}>
              Model Registry
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Monitor and manage your production ML models
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
              <span className={`dot dot-${apiOnline ? "green" : "red"} ${apiOnline ? "pulse" : ""}`} style={{ width: 6, height: 6 }} />
              {apiOnline ? "Registry Online" : "Offline"}
            </div>
            <Link href="/models/new" className="btn btn-primary" style={{ fontSize: 13 }}>
              + Register New Model
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && models.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Total Models", value: models.length },
              { label: "Active", value: models.filter(m => m.status === "active").length },
              { label: "Blocked", value: models.filter(m => m.status === "blocked_pending_retrain").length },
              { label: "With Alerts", value: models.filter(m => m.active_alerts_count > 0).length },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "10px 16px", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{s.value}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner text="Loading model registry..." />
        ) : models.length === 0 ? (
          <div className="card" style={{ padding: "80px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 28, color: "var(--text-muted)", marginBottom: 16 }}>◈</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>No models registered</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
              Register your first model to start monitoring production data drift.
            </div>
            <Link href="/models/new" className="btn btn-primary">
              + Register First Model
            </Link>
          </div>
        ) : (
          <div className="grid-3" style={{ gap: 16 }}>
            {models.map(model => <ModelCard key={model.id} model={model} />)}
            <EmptyCard />
          </div>
        )}
      </main>
    </div>
  );
}