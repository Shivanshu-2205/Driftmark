"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, Model } from "@/lib/api";

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
    } catch (e) {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  if (apiOnline === false) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="panel p-8 max-w-md text-center">
          <div className="text-2xl mb-2 glow-text">▓ CONNECTION LOST</div>
          <p className="text-sm opacity-70">
            Cannot reach DriftWatch API. Make sure the backend is running at{" "}
            <code className="text-amber-400">http://localhost:8000</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: "var(--border-dim)" }}>
        <div>
          <h1 className="text-2xl font-extrabold glow-text tracking-tight">
            DRIFTWATCH // REGISTRY<span className="blink">_</span>
          </h1>
          <p className="text-xs opacity-50 mt-1">ENTERPRISE MULTI-MODEL DRIFT &amp; RELIABILITY REGISTRY</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: apiOnline ? "var(--phosphor)" : "var(--danger)", boxShadow: "0 0 8px currentColor" }} />
            <span className="opacity-70">{apiOnline ? "REGISTRY ONLINE" : "OFFLINE"}</span>
          </div>
          <Link
            href="/models/new"
            className="px-3 py-1.5 text-xs font-bold border border-[var(--phosphor)] glow-border hover:bg-[rgba(57,255,106,0.08)] transition"
          >
            [+] REGISTER NEW MODEL
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-sm blink">LOADING MODEL REGISTRY...</div>
      ) : models.length === 0 ? (
        <div className="panel p-8 text-center py-20">
          <div className="text-xl mb-2 opacity-80">▓ NO MODELS REGISTERED</div>
          <p className="text-xs opacity-50 mb-6">Create a model to start monitoring production data drift.</p>
          <Link
            href="/models/new"
            className="px-4 py-2 text-sm font-bold border border-[var(--phosphor)] glow-border hover:bg-[rgba(57,255,106,0.08)] transition"
          >
            + REGISTER FIRST MODEL
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => {
            const hasAlerts = model.active_alerts_count > 0;
            const isBlocked = model.status === "blocked_pending_retrain";
            const severityColor = isBlocked ? "var(--danger)" : "var(--phosphor)";

            return (
              <div key={model.id} className="panel p-5 flex flex-col justify-between scanner-sweep relative">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono opacity-40">ID: #{model.id}</span>
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold uppercase border"
                      style={{
                        color: severityColor,
                        borderColor: severityColor,
                        textShadow: `0 0 6px ${severityColor}`,
                      }}
                    >
                      {isBlocked ? "▓ BLOCKED" : "ACTIVE"}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold mb-1 truncate glow-text text-white">
                    {model.name}
                  </h2>
                  <p className="text-xs opacity-50 mb-4">{model.category}</p>

                  <div className="border-t border-b border-[var(--border-dim)] py-3 my-4 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="opacity-50">Last Health Check:</span>
                      <span className="font-bold">
                        {model.last_run ? model.last_run.batch_name.toUpperCase() : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-50">Overall PSI:</span>
                      <span
                        className="font-bold"
                        style={{
                          color: model.last_run?.overall_severity === "severe"
                            ? "var(--danger)"
                            : model.last_run?.overall_severity === "moderate"
                            ? "var(--amber)"
                            : "var(--phosphor)",
                        }}
                      >
                        {model.last_run ? model.last_run.overall_psi.toFixed(4) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-50">Thresholds (Mod/Sev):</span>
                      <span className="opacity-70">
                        {model.threshold_moderate} / {model.threshold_severe}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    {hasAlerts ? (
                      <span className="flex items-center gap-1 text-xs text-[var(--danger)] font-bold animate-pulse">
                        <span className="inline-block w-2.5 h-2.5 bg-[var(--danger)] rounded-full" />
                        {model.active_alerts_count} ALERT(S)
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-40">0 ALERTS</span>
                    )}
                  </div>

                  <Link
                    href={`/models/${model.id}`}
                    className="px-4 py-1.5 text-xs font-bold border hover:bg-[rgba(57,255,106,0.08)] transition"
                    style={{ borderColor: "var(--phosphor-dim)" }}
                  >
                    DASHBOARD →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
