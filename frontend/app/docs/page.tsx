"use client";

import Link from "next/link";

export default function DocsPage() {
  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: "var(--border-dim)" }}>
        <div>
          <div className="text-xs opacity-50 flex items-center gap-2 mb-1">
            <Link href="/" className="hover:underline text-[var(--phosphor)]">← BACK TO HOME</Link>
            <span>//</span>
            <span>DOCUMENTATION CENTRAL</span>
          </div>
          <h1 className="text-2xl font-extrabold glow-text tracking-tight uppercase">
            DRIFTWATCH // MANUAL<span className="blink">_</span>
          </h1>
          <p className="text-xs opacity-50">SYSTEM SPECIFICATIONS &amp; STATISTICAL OPERATIONS</p>
        </div>
      </header>

      {/* Docs Body */}
      <div className="space-y-8 text-xs font-mono">
        {/* SECTION 1 */}
        <section className="panel p-6 scanner-sweep">
          <h2 className="text-sm font-bold border-b border-[var(--border-dim)] pb-2 mb-4 text-[var(--phosphor-bright)] glow-text">
            ▓ 01. ARCHITECTURE &amp; PIPELINE
          </h2>
          <p className="leading-relaxed mb-4">
            DriftWatch runs as a decoupled full-stack observatory. The backend operates on an asynchronous 
            FastAPI loop running standard statistical tests over inference streams, storing operations logs 
            in a structured metadata layer.
          </p>
          <div className="bg-black/40 border border-[var(--border-dim)] p-4 rounded mb-4 overflow-x-auto">
            <pre className="text-[10px] text-[var(--phosphor-bright)] leading-tight">
{`   [ Production Endpoint / Inference Stream ]
                       │
                       ▼  (CSV Batch Upload / Ingestion API)
             ┌───────────────────┐
             │  FastAPI Backend  │ ◄─── (REST Queries) ───┐
             └─────────┬─────────┘                         │
                       │                             ┌─────┴─────┐
            (Compute Drift Scores)                   │  Next.js  │
                       │                             │  Frontend │
                       ▼                             └───────────┘
             ┌───────────────────┐
             │   Drift Engine    │
             │ (PSI/KS/JS tests) │
             └───────────────────┘`}
            </pre>
          </div>
          <p className="leading-relaxed">
            Data, prediction probabilities, and ground-truth targets are parsed dynamically through parallel 
            calculators and stored inside the database, enabling instantaneous validation feedback on the user console.
          </p>
        </section>

        {/* SECTION 2 */}
        <section className="panel p-6">
          <h2 className="text-sm font-bold border-b border-[var(--border-dim)] pb-2 mb-4 text-[var(--phosphor-bright)] glow-text">
            ▓ 02. STATISTICAL ENGINES
          </h2>
          <p className="leading-relaxed mb-4">
            To detect distribution shift, three independent statistical tests are executed during batch processing:
          </p>

          <div className="space-y-4">
            <div className="border border-[var(--border-dim)] p-4 bg-black/20">
              <h3 className="font-bold text-[var(--phosphor)] mb-1">A. POPULATION STABILITY INDEX (PSI)</h3>
              <p className="mb-2">Measures shifting population behavior over a defined interval compared to baseline reference data.</p>
              <code className="block bg-black p-2 mb-2 text-[var(--amber)]">
                PSI = SUM( (Actual% - Reference%) * ln(Actual% / Reference%) )
              </code>
              <p className="text-[10px] opacity-70">
                • PSI &lt; 0.10: Stable distribution.<br />
                • 0.10 &le; PSI &lt; 0.25: Moderate shift (Warning state).<br />
                • PSI &ge; 0.25: Severe shift (Lock pipeline / Alert state).
              </p>
            </div>

            <div className="border border-[var(--border-dim)] p-4 bg-black/20">
              <h3 className="font-bold text-[var(--phosphor)] mb-1">B. KOLMOGOROV-SMIRNOV (KS) TEST</h3>
              <p className="mb-2">A non-parametric test comparing the cumulative distribution functions of the production data and baseline. Returns:</p>
              <p className="text-[10px] opacity-70">
                • <strong>KS Statistic (D):</strong> The maximum vertical distance between cumulative probability graphs.<br />
                • <strong>p-value:</strong> Probability that both datasets come from the same distribution. p &lt; 0.05 indicates high likelihood of shift.
              </p>
            </div>

            <div className="border border-[var(--border-dim)] p-4 bg-black/20">
              <h3 className="font-bold text-[var(--phosphor)] mb-1">C. JENSEN-SHANNON (JS) DIVERGENCE</h3>
              <p>
                A symmetric distance metric based on Shannon entropy measuring probability divergence. Values range from 0 (identical) to 1 (disjoint).
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="panel p-6">
          <h2 className="text-sm font-bold border-b border-[var(--border-dim)] pb-2 mb-4 text-[var(--phosphor-bright)] glow-text">
            ▓ 03. METADATA DATABASE SCHEMAS
          </h2>
          <p className="leading-relaxed mb-4">
            The database structure uses SQLAlchemy models. It maintains tracking records, drift run metrics, alerts, model versions, and pending batch cues:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-dim)] text-[var(--phosphor)] uppercase">
                  <th className="py-2 pr-4 font-bold">Model Table</th>
                  <th className="py-2 pr-4 font-bold">Schema Definition</th>
                  <th className="py-2 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-dim)]/40">
                <tr>
                  <td className="py-2 pr-4 font-bold text-white">models</td>
                  <td className="py-2 pr-4">id, name, category, feature_schema, thresholds, status</td>
                  <td className="py-2 opacity-80">Primary registry metadata and active health status flags.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-white">drift_runs</td>
                  <td className="py-2 pr-4">id, model_id, batch_name, overall_psi, prediction_psi, metrics_json</td>
                  <td className="py-2 opacity-80">Historical log of processed inference batches and drift scores.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-white">alerts</td>
                  <td className="py-2 pr-4">id, model_id, drift_run_id, severity, drift_type, message, acknowledged</td>
                  <td className="py-2 opacity-80">Chronological feed of warning notifications generated during runs.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-white">model_versions</td>
                  <td className="py-2 pr-4">id, model_id, version, trained_at, trigger_reason, accuracy, is_active</td>
                  <td className="py-2 opacity-80">Model versioning and historical evaluation registry.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4 */}
        <section className="panel p-6">
          <h2 className="text-sm font-bold border-b border-[var(--border-dim)] pb-2 mb-4 text-[var(--phosphor-bright)] glow-text">
            ▓ 04. DRIFT SIMULATION TIMELINE
          </h2>
          <p className="leading-relaxed mb-4">
            The platform generates a baseline dataset and 10 sequential production batches with injected noise. 
            The flow simulates drift progression over time:
          </p>
          <div className="space-y-3">
            <div className="flex border border-[var(--border-dim)] p-2">
              <div className="w-24 text-[var(--phosphor)] font-bold">BATCH 01-04</div>
              <div className="flex-1">Normal baseline operating logs. Features match reference limits. PSI remains &le; 0.05. Accuracy remains stable at ~89%.</div>
            </div>
            <div className="flex border border-[var(--border-dim)] p-2">
              <div className="w-24 text-[var(--amber)] font-bold">BATCH 05-07</div>
              <div className="flex-1">Gradual feature drift injected (e.g. shifts in debt-to-income and income). PSI warning triggers.</div>
            </div>
            <div className="flex border border-[var(--border-dim)] p-2">
              <div className="w-24 text-[var(--danger)] font-bold">BATCH 08-10</div>
              <div className="flex-1">Severe data drift combined with concept drift. Model accuracy drops under 80%, triggering critical alerts and locking ingestion.</div>
            </div>
          </div>
        </section>

        {/* SECTION 5 */}
        <section className="panel p-6">
          <h2 className="text-sm font-bold border-b border-[var(--border-dim)] pb-2 mb-4 text-[var(--phosphor-bright)] glow-text">
            ▓ 05. OPERATIONAL CONTROL FLOW
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-white uppercase mb-1">Batch Ingestion</h3>
              <p className="leading-relaxed">
                New production logs can be submitted as a CSV or Excel format. Once queued, they represent 
                production slices that wait to be evaluated against the reference baseline rules.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white uppercase mb-1">Bypass Override</h3>
              <p className="leading-relaxed">
                When a severe drift alert locks the ingestion queue, operators can flag the "Force Bypass" check 
                to continue processing incoming slices, overriding safety barriers manually when necessary.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white uppercase mb-1">Simulated Retraining</h3>
              <p className="leading-relaxed">
                Clicking the "Retrain Model" button compiles new training runs, registers a promoted version 
                (e.g., v2), unlocks the pipeline, and resets the baseline metrics.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer mt-12">
        <span className="green-dim-text">▓ DRIFTWATCH MANUAL</span>
        <span className="muted">// SECURE SHELL ENGINE // SYSTEM NOMINAL</span>
      </footer>
    </main>
  );
}
