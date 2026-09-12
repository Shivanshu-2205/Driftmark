"use client";

import Link from "next/link";
import { AppNavbar } from "@/components/Navbar";

export default function DocsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNavbar />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
            <Link href="/" style={{ color: "var(--green)", textDecoration: "none" }}>
              ← Home
            </Link>{" "}
            / Documentation Central
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: 6 }}>
            DriftWatch Platform Documentation
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            System specifications, statistical testing methodologies, and architectural reference
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Section 1: Architecture */}
          <section className="card" style={{ padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              01. Architecture &amp; Data Pipeline
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Decoupled Observability Pipeline
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
              DriftWatch operates as an asynchronous, non-intrusive surveillance layer on top of your production ML stack. 
              The backend leverages FastAPI running optimized statistical operations over rolling inference windows, recording 
              multivariate stability scores inside a transactional metadata layer.
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 20px", marginBottom: 16, overflowX: "auto" }}>
              <pre style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--green)", margin: 0, lineHeight: 1.5 }}>
{`  [ Production Endpoint / Inference Stream ]
                      │
                      ▼ (CSV Batch Ingestion API)
            ┌───────────────────┐
            │  FastAPI Backend  │ ◄─── (REST Queries) ───┐
            └─────────┬─────────┘                         │
                      │                             ┌─────┴─────┐
           (Compute Drift Scores)                   │  Next.js  │
                      │                             │  Frontend │
                      ▼                             └───────────┘
            ┌───────────────────┐
            │   Drift Engine    │
            │ (PSI / KS / JSD)  │
            └───────────────────┘`}
              </pre>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
              Incoming feature arrays, predicted probability distributions, and ground-truth labels are continuously compared 
              against baseline reference artifacts to calculate divergence metrics with millisecond latency.
            </p>
          </section>

          {/* Section 2: Statistical Engines */}
          <section className="card" style={{ padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              02. Statistical Engines
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Multi-Metric Drift Detection
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
              To catch different dimensions of distribution shift, three independent statistical tests are calculated for each feature vector during batch processing:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* PSI */}
              <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    A. Population Stability Index (PSI)
                  </h3>
                  <span className="badge badge-green">Primary Indicator</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>
                  Quantifies divergence between reference and target population distributions across quantile buckets:
                </p>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)", marginBottom: 10 }}>
                  PSI = Σ [ (Actual% - Reference%) × ln(Actual% / Reference%) ]
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 11 }}>
                  <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", padding: 8, borderRadius: 4 }}>
                    <div style={{ color: "var(--green)", fontWeight: 600 }}>PSI &lt; 0.10</div>
                    <div style={{ color: "var(--text-muted)" }}>Stable distribution; normal operation.</div>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", padding: 8, borderRadius: 4 }}>
                    <div style={{ color: "var(--amber)", fontWeight: 600 }}>0.10 ≤ PSI &lt; 0.25</div>
                    <div style={{ color: "var(--text-muted)" }}>Moderate shift; warning state issued.</div>
                  </div>
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", padding: 8, borderRadius: 4 }}>
                    <div style={{ color: "var(--red)", fontWeight: 600 }}>PSI ≥ 0.25</div>
                    <div style={{ color: "var(--text-muted)" }}>Severe drift; gates lock pipeline.</div>
                  </div>
                </div>
              </div>

              {/* KS Test */}
              <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  B. Kolmogorov-Smirnov (KS) Test
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
                  A non-parametric hypothesis test that calculates the maximum vertical distance between empirical cumulative distribution functions (eCDFs) of production data and the reference baseline.
                </p>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  • <strong style={{ color: "var(--text-secondary)" }}>KS Statistic (D):</strong> Supremum distance between cumulative curves.<br />
                  • <strong style={{ color: "var(--text-secondary)" }}>p-value:</strong> Probability that both samples originate from the same continuous distribution (p &lt; 0.05 indicates statistically significant drift).
                </div>
              </div>

              {/* JS Divergence */}
              <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  C. Jensen-Shannon (JS) Divergence
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  A smoothed, symmetric relative entropy metric based on Kullback-Leibler divergence that bounds divergence scores between 0 (identical) and 1 (orthogonal/disjoint distributions).
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Database Schema */}
          <section className="card" style={{ padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              03. Metadata Database Schema
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Relational Storage Architecture
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 18 }}>
              DriftWatch persists telemetry and tracking events in SQLAlchemy entities for sub-second retrieval:
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Entity Table</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Fields</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Operational Role</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["models", "id, name, category, feature_schema, thresholds, status", "Primary registry metadata and health status flags"],
                    ["drift_runs", "id, model_id, batch_name, overall_psi, prediction_psi, metrics_json", "Historical audit log of processed inference batches"],
                    ["alerts", "id, model_id, drift_run_id, severity, drift_type, message, acknowledged", "Chronological feed of warning notifications"],
                    ["model_versions", "id, model_id, version, trained_at, trigger_reason, accuracy, is_active", "Model artifact lineage and evaluation registry"],
                  ].map(([table, fields, role]) => (
                    <tr key={table} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--green)" }}>{table}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>{fields}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Simulation Progression */}
          <section className="card" style={{ padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              04. Drift Simulation Lifecycle
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Production Lifecycle Progression
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
              The platform ships with a baseline reference dataset and 10 sequential production batches demonstrating drift lifecycle progression:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { stage: "Batches 01–04", status: "Stable State", badge: "badge-green", desc: "Normal baseline operation. Feature distributions align with reference limits. PSI remains ≤ 0.05. Model accuracy is stable at ~89%." },
                { stage: "Batches 05–07", status: "Moderate Shift", badge: "badge-amber", desc: "Covariate shift injected into continuous features (e.g. debt-to-income and revolving balances). Warning alerts trigger." },
                { stage: "Batches 08–10", status: "Severe Drift", badge: "badge-red", desc: "Severe feature divergence combined with concept drift. Model accuracy drops below 80%, triggering critical alerts and locking ingestion." },
              ].map((s) => (
                <div key={s.stage} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 16px", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6 }}>
                  <div style={{ minWidth: 110 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{s.stage}</div>
                    <span className={`badge ${s.badge}`} style={{ fontSize: 10, marginTop: 4 }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Control Operations */}
          <section className="card" style={{ padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              05. Operational Workflows
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
              Ingestion, Gating &amp; Retraining
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              <div style={{ padding: 16, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Batch Chunking
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  Upload raw inference CSVs. The system divides datasets into discrete evaluation slices (e.g. 200 rows/batch) queued for evaluation.
                </p>
              </div>

              <div style={{ padding: 16, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Gate Bypass Override
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  When critical drift triggers a pipeline lock, operators can enable the &quot;Force Bypass&quot; flag to process batches under human supervision.
                </p>
              </div>

              <div style={{ padding: 16, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Simulated Retraining
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  Triggering model retrain compiles the most recent production distribution into the training corpus, deploys a promoted model version (e.g. v2), and resets baseline gates.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
          <span>DriftWatch ML Observability · v2.4.1</span>
          <Link href="/models" style={{ color: "var(--green)", textDecoration: "none" }}>
            Open Model Registry →
          </Link>
        </div>
      </main>
    </div>
  );
}