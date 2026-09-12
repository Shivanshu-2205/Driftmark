"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const FEATURES = [
  { icon: "⬡", name: "Distribution Drift", desc: "PSI, KS-test, and Jensen-Shannon divergence computed per-feature across rolling windows. Pinpoint which inputs shifted — not just that drift occurred.", tags: ["PSI", "KS-Test", "JSD"] },
  { icon: "◎", name: "Performance Degradation", desc: "Ground-truth-free performance estimation using CBPE and direct loss tracking. Know your model is degrading before labels arrive.", tags: ["CBPE", "AUC", "F1", "MAE"] },
  { icon: "⊞", name: "Data Quality Gates", desc: "Schema validation, missing value monitoring, and outlier detection run on every inference batch. Block bad data at the endpoint boundary.", tags: ["Schema", "Nulls", "Range"] },
  { icon: "⊟", name: "Multi-Model Registry", desc: "Tag and version every production artifact. Track champion vs challenger deployments with A/B drift comparisons.", tags: ["Versioning", "A/B", "Tags"] },
  { icon: "◈", name: "Real-Time Alerting", desc: "Threshold-based and anomaly-based alerts fire within 2 minutes. Route to PagerDuty, Slack, webhooks, or the on-call terminal.", tags: ["Slack", "PagerDuty", "Webhook"] },
  { icon: "▣", name: "Audit Log & Compliance", desc: "Immutable event log of every drift event, alert, and model change. Exportable for SOC 2, GDPR, and internal governance reviews.", tags: ["SOC2", "GDPR", "Export"] },
];

const STEPS = [
  { n: "01", title: "Instrument", desc: "Install the Python SDK. Wrap your predict() function with one decorator. Zero refactoring required." },
  { n: "02", title: "Register", desc: "Push your training distribution as a reference dataset. DriftWatch builds your baseline automatically." },
  { n: "03", title: "Configure", desc: "Set thresholds per-feature or inherit smart defaults from our drift severity model." },
  { n: "04", title: "Monitor", desc: "Live dashboard activates. Alerts route to your channels. Sleep at night." },
];

const ALERTS = [
  { cls: "green", badge: "Stable", model: "rec-engine-v5 · NDCG@10", metric: "0.872", desc: "Δ +0.003 from baseline · 2.1M predictions / 24h" },
  { cls: "amber", badge: "Moderate Drift", model: "churn-model-v2 · KS Statistic", metric: "0.183", desc: "tenure_months shifted · Investigate data pipeline" },
  { cls: "red", badge: "Severe Drift", model: "nlp-sentiment-v1 · PSI", metric: "0.312", desc: "Input vocabulary distribution collapsed · Retrain urgent" },
  { cls: "green", badge: "Stable", model: "pricing-engine-v4 · MAE", metric: "$1.24", desc: "Δ −$0.07 vs last week · No action required" },
];

const STATS = [
  { num: "99.7%", label: "Drift Detection Accuracy" },
  { num: "<2 min", label: "Alert Latency" },
  { num: "400+", label: "Models Monitored" },
  { num: "12B", label: "Predictions Tracked" },
];

function clsColor(cls: string) {
  if (cls === "red") return "var(--red)";
  if (cls === "amber") return "var(--amber)";
  return "var(--green)";
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar
        rightContent={
          <Link href="/models" className="btn btn-primary" style={{ fontSize: 12 }}>
            Start Monitoring
          </Link>
        }
      />

      {/* ── Hero ── */}
      <section className="hero-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 60px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 560, flex: "1 1 320px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: "var(--green)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 100, padding: "3px 10px", marginBottom: 24, background: "rgba(34,197,94,0.06)" }}>
            <span className="dot dot-green" style={{ width: 5, height: 5 }} />
            ML Observability Platform · v2.4.1
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.1, color: "var(--text-primary)", marginBottom: 20, letterSpacing: "-0.02em" }}>
            Detect drift<br />
            <span style={{ color: "var(--green)" }}>before it hurts.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            Real-time model monitoring for production ML systems. Track performance degradation, feature drift, and data skew — across every endpoint, every deployment.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/models" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>
              Start Monitoring
            </Link>
            <Link href="/docs" className="btn btn-outline" style={{ padding: "10px 20px", fontSize: 14 }}>
              View Docs →
            </Link>
          </div>
        </div>

        {/* Hero widget */}
        <div className="card" style={{ flex: "1 1 300px", maxWidth: 420, padding: 20, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>fraud-detection-v3</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>Production · /v1/predict/fraud</div>
            </div>
            <span className="badge badge-green"><span className="dot dot-green" style={{ width: 5, height: 5 }} />Healthy</span>
          </div>
          <div style={{ background: "var(--bg)", borderRadius: 4, padding: "10px 12px", marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["PSI", "0.024"], ["KS p-value", "0.481"], ["Latency", "14ms"], ["Inferences", "1.42M/hr"]].map(([k, v]) => (
              <div key={k}>
                <div style={{ color: "var(--text-muted)", fontSize: 10 }}>{k}</div>
                <div style={{ color: "var(--green)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <span style={{ color: "var(--green)" }}>✓</span> [14:22:01] 256 feature vectors evaluated. No significant distribution shifts detected.
          </div>

          {/* Ticker */}
          <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10, overflow: "hidden", whiteSpace: "nowrap" }}>
            {[
              { label: "fraud-clf-v3 PSI:", val: "0.041", cls: "green" },
              { label: "churn-model KS:", val: "0.183 ⚠", cls: "amber" },
              { label: "nlp-sentiment PSI:", val: "0.312 ✕", cls: "red" },
              { label: "pricing-v2 MAE:", val: "1.24", cls: "green" },
            ].map((item, i) => (
              <span key={i} style={{ display: "inline-block", marginRight: 24, fontSize: 11 }}>
                <span style={{ color: "var(--text-muted)" }}>{item.label} </span>
                <span style={{ color: clsColor(item.cls), fontFamily: "var(--font-mono)" }}>{item.val}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto 72px", padding: "0 24px" }}>
        <div className="grid-4" style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: "var(--surface)", padding: "28px 24px" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--green)", fontFamily: "var(--font-mono)", lineHeight: 1, marginBottom: 6 }}>{s.num}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" style={{ maxWidth: 1200, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Core Capabilities</div>
        <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.01em" }}>Full-spectrum model surveillance</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          Every metric. Every feature. Every deployment. DriftWatch gives your ML team a unified platform to catch degradation the moment it surfaces.
        </p>
        <div className="grid-3" style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: "var(--surface)", padding: "28px 24px", transition: "background 0.15s", cursor: "default" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-raised)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}>
              <div style={{ fontSize: 22, color: "var(--green)", marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 12 }}>{f.desc}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {f.tags.map(t => (
                  <span key={t} className="badge badge-muted" style={{ fontSize: 10 }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" style={{ maxWidth: 1200, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Setup</div>
        <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.01em" }}>Online in under 10 minutes</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 480, lineHeight: 1.7, marginBottom: 40 }}>
          One SDK. No infrastructure changes. DriftWatch wraps your existing inference pipeline and starts tracking immediately.
        </p>
        <div className="grid-4" style={{ gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={i} className="card" style={{ padding: "20px 20px 24px", position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 12 }}>{s.n}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Alerts ── */}
      <section id="alerts" style={{ maxWidth: 1200, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Alert Examples</div>
        <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.01em" }}>Every alert tells you what to do next</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          DriftWatch surfaces actionable diagnostics alongside every drift event — not just a metric and a red dot.
        </p>
        <div className="grid-2" style={{ gap: 16 }}>
          {ALERTS.map((a, i) => (
            <div key={i} className="card" style={{ padding: "20px 22px", borderLeft: `3px solid ${clsColor(a.cls)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{a.model}</div>
                <span className={`badge badge-${a.cls}`}>
                  <span className="dot" style={{ background: clsColor(a.cls), width: 5, height: 5 }} />
                  {a.badge}
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: clsColor(a.cls), marginBottom: 4 }}>{a.metric}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto 80px", padding: "0 24px" }}>
        <div className="card" style={{ padding: "56px 48px", textAlign: "center", borderColor: "rgba(34,197,94,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Begin Monitoring</div>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, letterSpacing: "-0.01em" }}>
            Your models are drifting right now.
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
            Most teams find out when users complain. Don&apos;t be most teams.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            <Link href="/models/new" className="btn btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>
              Register New Model
            </Link>
            <Link href="/docs" className="btn btn-outline" style={{ padding: "10px 24px", fontSize: 14 }}>
              Read the Docs →
            </Link>
          </div>
          <div style={{ background: "var(--bg)", borderRadius: 6, padding: "12px 20px", display: "inline-flex", gap: 8, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-muted)" }}>$</span>
            <span>pip install driftwatch && driftwatch init</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 24px", maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>DriftWatch</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>© 2024 DriftWatch · ML Observability Platform · v2.4.1</div>
        <div style={{ display: "flex", gap: 16 }}>
          {["Docs", "Changelog", "Privacy", "Terms"].map(l => (
            <Link key={l} href="/docs" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}