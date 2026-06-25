"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function LandingPage() {
  const tickerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="page-wrap">
      {/* NAV */}
      <nav className="nav">
        <Link className="nav-logo" href="/">
          <span className="dim">▓ </span>DRIFTWATCH<span className="dim">_</span>
        </Link>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#alerts">Alerts</a></li>
          <li><Link href="/docs">Docs</Link></li>
        </ul>
        <div className="nav-badge">
          SYS STATUS: <span className="green">NOMINAL</span>{" "}
          <span className="cursor">█</span>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">▓ PRODUCTION ML OBSERVABILITY // v2.4.1</div>
        <h1 className="hero-title">
          DETECT DRIFT<br />
          <span className="dim-title">BEFORE IT DRIFTS YOU.</span>
        </h1>
        <p className="hero-subtitle">
          Real-time model monitoring for production ML systems. Track performance
          degradation, feature drift, and data skew — across every endpoint,
          every deployment.
        </p>
        <div className="hero-actions">
          <Link href="/models" className="btn-primary">[+] START MONITORING</Link>
          <Link href="/models" className="btn-ghost">VIEW DEMO →</Link>
        </div>
      </div>

      {/* TICKER */}
      <div className="ticker-bar">
        <div className="ticker-inner" ref={tickerRef}>
          {[...Array(2)].map((_, pass) => (
            <span key={pass}>
              {[
                { label: "fraud-clf-v3 ▸ PSI:", val: "0.041", cls: "val-ok" },
                { label: "churn-model ▸ KS:", val: "0.183 ⚠", cls: "val-warn" },
                { label: "rec-engine ▸ NDCG:", val: "0.872", cls: "val-ok" },
                { label: "nlp-sentiment ▸ PSI:", val: "0.312 ✕", cls: "val-crit" },
                { label: "pricing-v2 ▸ MAE:", val: "1.24", cls: "val-ok" },
                { label: "cv-detector ▸ F1:", val: "0.791 ⚠", cls: "val-warn" },
              ].map((item, i) => (
                <span className="ticker-item" key={i}>
                  <span className="ticker-label">{item.label} </span>
                  <span className={item.cls}>{item.val}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        {[
          { num: "99.7", unit: "%", label: "Drift Detection Accuracy" },
          { num: "<2", unit: "min", label: "Alert Latency" },
          { num: "400", unit: "+", label: "Models Monitored" },
          { num: "12", unit: "B", label: "Predictions Tracked" },
        ].map((s, i) => (
          <div className="stat-cell" key={i}>
            <div className="stat-num">
              {s.num}<span className="stat-unit">{s.unit}</span>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" className="section">
        <div className="section-label">Core Capabilities</div>
        <h2 className="section-title">FULL-SPECTRUM MODEL SURVEILLANCE</h2>
        <p className="section-body">
          Every metric. Every feature. Every deployment. DriftWatch gives your ML
          team a unified command terminal to catch degradation the moment it
          surfaces.
        </p>
        <div className="features-grid">
          {[
            { icon: "◈", name: "Distribution Drift", desc: "PSI, KS-test, and Jensen-Shannon divergence computed per-feature across rolling windows. Pinpoint which inputs shifted — not just that drift occurred.", tag: "PSI · KS · JSD" },
            { icon: "◉", name: "Performance Degradation", desc: "Ground-truth-free performance estimation using CBPE and direct loss tracking. Know your model is degrading before labels arrive.", tag: "CBPE · AUC · F1 · MAE" },
            { icon: "⊟", name: "Data Quality Gates", desc: "Schema validation, missing value monitoring, and outlier detection run on every inference batch. Block bad data at the endpoint boundary.", tag: "SCHEMA · NULL · RANGE" },
            { icon: "⊞", name: "Multi-Model Registry", desc: "Tag and version every production artifact. Track champion vs challenger deployments with A/B drift comparisons across the same time window.", tag: "VERSIONING · A/B · TAGS" },
            { icon: "⊿", name: "Real-Time Alerting", desc: "Threshold-based and anomaly-based alerts fire within 2 minutes of breach. Route to PagerDuty, Slack, webhooks, or the on-call terminal.", tag: "SLACK · PAGERDUTY · WEBHOOK" },
            { icon: "◧", name: "Audit Log & Compliance", desc: "Immutable event log of every drift event, alert, and model change. Exportable for SOC 2, GDPR, and internal governance reviews.", tag: "SOC2 · GDPR · EXPORT" },
          ].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-name">{f.name}</div>
              <div className="feature-desc">{f.desc}</div>
              <div className="feature-tag">{f.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TERMINAL DEMO */}
      <div className="terminal-section">
        <div className="terminal-bar">
          <div className="t-dot r" /><div className="t-dot y" /><div className="t-dot g" />
          <div className="t-title">driftwatch-cli // fraud-clf-v3 // 2024-06-24 03:47:22 UTC</div>
        </div>
        <div className="terminal-body">
          <div className="t-comment"># scan production model — last 6h window</div>
          <div className="t-cmd">$ dw scan --model fraud-clf-v3 --window 6h --threshold moderate</div>
          <div className="t-out">Fetching inference logs... 847,203 samples</div>
          <div className="t-out">Running PSI analysis across 24 features...</div>
          <br />
          <div className="t-out">  ✓  account_age_days &nbsp;&nbsp;&nbsp;&nbsp;PSI=0.021  [STABLE]</div>
          <div className="t-out">  ✓  transaction_amount &nbsp;&nbsp;PSI=0.038  [STABLE]</div>
          <div className="t-warn">  ⚠  device_type_encoded &nbsp;PSI=0.141  [MODERATE DRIFT]</div>
          <div className="t-err">  ✕  ip_risk_score &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PSI=0.298  [SEVERE DRIFT]</div>
          <div className="t-out">  ✓  merchant_category &nbsp;&nbsp;PSI=0.019  [STABLE]</div>
          <br />
          <div className="t-warn">ALERT DISPATCHED → #ml-oncall (Slack) · PagerDuty P2</div>
          <div className="t-err">RECOMMENDATION: Retrain on last 30-day window. Rollback to v2.9 optional.</div>
          <br />
          <div className="t-dim">Scan complete in 4.2s. 2/24 features flagged. Run ID: dw-8a4f2c91<span className="cursor">█</span></div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="section">
        <div className="section-label">Setup</div>
        <h2 className="section-title">ONLINE IN UNDER 10 MINUTES</h2>
        <p className="section-body">
          One SDK. No infrastructure changes. DriftWatch wraps your existing
          inference pipeline and starts tracking immediately.
        </p>
        <div className="steps">
          {[
            { n: "01", title: "Instrument", desc: "Install the Python SDK. Wrap your predict() function with one decorator. Zero refactoring required.", last: false },
            { n: "02", title: "Register", desc: "Push your training distribution as a reference dataset. DriftWatch builds your baseline automatically.", last: false },
            { n: "03", title: "Configure", desc: "Set thresholds per-feature or inherit smart defaults from our drift severity model.", last: false },
            { n: "04", title: "Monitor", desc: "Live dashboard activates. Alerts route to your channels. Sleep at night.", last: true },
          ].map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num">{s.n} ——</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
              {!s.last && <div className="step-connector">▶</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ALERTS */}
      <section id="alerts" className="section">
        <div className="section-label">Alert Examples</div>
        <h2 className="section-title">EVERY ALERT TELLS YOU WHAT TO DO NEXT</h2>
        <p className="section-body">
          DriftWatch surfaces actionable diagnostics alongside every drift event
          — not just a metric and a red dot.
        </p>
        <div className="alert-grid">
          {[
            { cls: "ok", badge: "STABLE", model: "rec-engine-v5 · NDCG@10", metric: "0.872", label: "Δ +0.003 from baseline · 2.1M predictions / 24h" },
            { cls: "warn", badge: "⚠ MODERATE", model: "churn-model-v2 · KS Statistic", metric: "0.183", label: "tenure_months shifted · Investigate data pipeline" },
            { cls: "crit", badge: "✕ SEVERE", model: "nlp-sentiment-v1 · PSI", metric: "0.312", label: "Input vocabulary distribution collapsed · Retrain urgent" },
            { cls: "ok", badge: "STABLE", model: "pricing-engine-v4 · MAE", metric: "$1.24", label: "Δ −$0.07 vs last week · No action required" },
          ].map((a, i) => (
            <div className={`alert-card ${a.cls}`} key={i}>
              <div className="alert-badge">{a.badge}</div>
              <div className="alert-model">{a.model}</div>
              <div className="alert-metric">{a.metric}</div>
              <div className="alert-label">{a.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-tag">▓ Begin Monitoring</div>
        <h2 className="cta-h">YOUR MODELS ARE DRIFTING RIGHT NOW.</h2>
        <p className="cta-body">Most teams find out when users complain. Don&apos;t be most teams.</p>
        <div className="cta-actions">
          <Link href="/models/new" className="btn-primary">[+] REGISTER NEW MODEL</Link>
          <Link href="/docs" className="btn-ghost">READ THE DOCS →</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span className="green-dim-text">▓ DRIFTWATCH</span>
        <span className="muted">// ML OBSERVABILITY PLATFORM // v2.4.1 // SYSTEM NOMINAL</span>
        <span className="muted">© 2024</span>
      </footer>

      <style jsx>{`
        :root {
          --bg: #050805;
          --surface: #0a100a;
          --surface2: #0d160d;
          --green: #39ff6a;
          --green-dim: #1f8f3e;
          --green-bright: #7fffa0;
          --green-faint: #0e2b14;
          --amber: #ffb627;
          --red: #ff4136;
          --text-muted: #2a6e3f;
          --mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes flicker {
          0%,100%{opacity:1}48%{opacity:1}50%{opacity:.97}52%{opacity:1}75%{opacity:.98}77%{opacity:1}
        }
        @keyframes blink {
          0%,49%{opacity:1}50%,100%{opacity:0}
        }
        @keyframes sweep {
          0%{background-position:0 -100%}100%{background-position:0 200%}
        }
        @keyframes boot {
          0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}
        }
        @keyframes ticker {
          from{transform:translateX(0)}to{transform:translateX(-50%)}
        }
        @keyframes pulse-border {
          0%,100%{box-shadow:0 0 0 1px var(--green-dim),0 0 8px rgba(57,255,106,0.15)}
          50%{box-shadow:0 0 0 1px var(--green),0 0 16px rgba(57,255,106,0.3)}
        }

        .page-wrap {
          background: var(--bg);
          color: var(--green);
          font-family: var(--mono);
          font-size: 14px;
          line-height: 1.6;
          min-height: 100vh;
          position: relative;
          animation: flicker 6s infinite;
        }
        .page-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(57,255,106,0.03) 27px, rgba(57,255,106,0.03) 28px),
            repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(57,255,106,0.03) 27px, rgba(57,255,106,0.03) 28px);
          pointer-events: none;
          z-index: 0;
        }
        .page-wrap::after {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
          pointer-events: none;
          z-index: 999;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 48px;
          border-bottom: 1px solid var(--green-dim);
          background: rgba(5,8,5,0.95);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-logo {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: var(--green-bright);
          text-shadow: 0 0 12px rgba(127,255,160,0.6);
          text-decoration: none;
        }
        .dim { color: var(--green-dim); }
        .nav-links {
          display: flex;
          gap: 32px;
          list-style: none;
        }
        .nav-links a {
          color: var(--green-dim);
          text-decoration: none;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .nav-links a:hover { color: var(--green); }
        .nav-badge { font-size: 11px; color: var(--green-dim); letter-spacing: 0.05em; }
        .green { color: var(--green); }
        .cursor { display: inline-block; animation: blink 1s step-end infinite; color: var(--green); }

        .hero {
          min-height: 88vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 48px 60px;
          position: relative;
        }
        .hero-eyebrow {
          font-size: 11px;
          letter-spacing: 0.25em;
          color: var(--green-dim);
          margin-bottom: 24px;
          animation: boot 0.6s ease both;
        }
        .hero-title {
          font-size: clamp(32px, 5vw, 64px);
          font-weight: 700;
          line-height: 1.1;
          color: var(--green-bright);
          text-shadow: 0 0 40px rgba(57,255,106,0.4), 0 0 80px rgba(57,255,106,0.15);
          margin-bottom: 8px;
          animation: boot 0.6s 0.1s ease both;
        }
        .dim-title { color: var(--green-dim); }
        .hero-subtitle {
          font-size: clamp(13px, 1.8vw, 16px);
          color: var(--green-dim);
          max-width: 520px;
          margin-bottom: 40px;
          animation: boot 0.6s 0.2s ease both;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          animation: boot 0.6s 0.3s ease both;
        }

        .btn-primary {
          background: var(--green);
          color: #050805;
          border: none;
          padding: 11px 28px;
          font-family: var(--mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .btn-primary:hover { background: var(--green-bright); box-shadow: 0 0 20px rgba(57,255,106,0.4); }
        .btn-ghost {
          background: transparent;
          color: var(--green);
          border: 1px solid var(--green-dim);
          padding: 10px 28px;
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover { border-color: var(--green); color: var(--green-bright); }

        .ticker-bar {
          background: var(--surface);
          border-top: 1px solid var(--green-dim);
          border-bottom: 1px solid var(--green-dim);
          padding: 10px 0;
          overflow: hidden;
          white-space: nowrap;
          font-size: 11px;
          letter-spacing: 0.08em;
        }
        .ticker-inner { display: inline-block; animation: ticker 28s linear infinite; }
        .ticker-item { display: inline-block; margin-right: 48px; }
        .ticker-label { color: var(--text-muted); }
        .val-ok { color: var(--green); }
        .val-warn { color: var(--amber); }
        .val-crit { color: var(--red); }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--green-dim);
          border: 1px solid var(--green-dim);
          margin: 48px 48px 0;
        }
        .stat-cell {
          background: var(--surface);
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }
        .stat-cell::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 100%;
          background: linear-gradient(180deg, rgba(57,255,106,0.04) 0%, transparent 60%);
          animation: sweep 4s linear infinite;
        }
        .stat-num { font-size: 36px; font-weight: 700; color: var(--green-bright); text-shadow: 0 0 16px rgba(57,255,106,0.5); line-height: 1; }
        .stat-unit { font-size: 14px; color: var(--green-dim); margin-left: 4px; }
        .stat-label { font-size: 10px; letter-spacing: 0.18em; color: var(--text-muted); text-transform: uppercase; margin-top: 8px; }

        .section { padding: 72px 48px; }
        .section-label { font-size: 10px; letter-spacing: 0.25em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 16px; }
        .section-label::before { content: '▓ '; color: var(--green-dim); }
        .section-title { font-size: clamp(20px, 2.5vw, 30px); font-weight: 700; color: var(--green-bright); text-shadow: 0 0 20px rgba(57,255,106,0.25); margin-bottom: 12px; }
        .section-body { color: var(--green-dim); max-width: 540px; font-size: 13px; line-height: 1.75; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--green-faint);
          border: 1px solid var(--green-faint);
          margin-top: 48px;
        }
        .feature-card {
          background: var(--surface);
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }
        .feature-card:hover { background: var(--surface2); }
        .feature-icon { font-size: 22px; color: var(--green); margin-bottom: 16px; text-shadow: 0 0 10px rgba(57,255,106,0.5); }
        .feature-name { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; color: var(--green-bright); margin-bottom: 10px; text-transform: uppercase; }
        .feature-desc { font-size: 12px; color: var(--green-dim); line-height: 1.7; }
        .feature-tag { display: inline-block; margin-top: 14px; font-size: 10px; letter-spacing: 0.12em; color: var(--green-dim); border: 1px solid var(--green-faint); padding: 3px 8px; }

        .terminal-section {
          background: var(--surface);
          border: 1px solid var(--green-dim);
          margin: 0 48px;
          position: relative;
          overflow: hidden;
        }
        .terminal-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--green-faint);
          background: rgba(0,0,0,0.3);
        }
        .t-dot { width: 8px; height: 8px; border-radius: 50%; }
        .t-dot.r { background: var(--red); }
        .t-dot.y { background: var(--amber); }
        .t-dot.g { background: var(--green-dim); }
        .t-title { font-size: 11px; letter-spacing: 0.12em; color: var(--text-muted); margin-left: 8px; }
        .terminal-body { padding: 24px 28px; font-size: 12px; line-height: 1.9; }
        .t-cmd { color: var(--green-dim); }
        .t-out { color: var(--green); }
        .t-warn { color: var(--amber); }
        .t-err { color: var(--red); }
        .t-dim { color: var(--text-muted); }
        .t-comment { color: var(--text-muted); }

        .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-top: 48px; }
        .step { position: relative; }
        .step-num { font-size: 10px; letter-spacing: 0.2em; color: var(--text-muted); margin-bottom: 8px; }
        .step-title { font-size: 13px; font-weight: 700; color: var(--green); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .step-desc { font-size: 12px; color: var(--green-dim); line-height: 1.7; }
        .step-connector { position: absolute; top: 18px; right: -16px; color: var(--text-muted); font-size: 11px; }

        .alert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 40px; }
        .alert-card {
          border: 1px solid;
          padding: 20px 22px;
          font-size: 12px;
          position: relative;
          overflow: hidden;
        }
        .alert-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
        .alert-card.ok { border-color: var(--green-dim); }
        .alert-card.ok::before { background: var(--green); }
        .alert-card.warn { border-color: #5a3a00; }
        .alert-card.warn::before { background: var(--amber); }
        .alert-card.crit { border-color: #5a0800; }
        .alert-card.crit::before { background: var(--red); }
        .alert-model { font-size: 11px; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; }
        .alert-metric { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .alert-card.ok .alert-metric { color: var(--green); text-shadow: 0 0 8px rgba(57,255,106,0.4); }
        .alert-card.warn .alert-metric { color: var(--amber); }
        .alert-card.crit .alert-metric { color: var(--red); }
        .alert-label { font-size: 11px; color: var(--text-muted); }
        .alert-badge { position: absolute; top: 14px; right: 14px; font-size: 9px; letter-spacing: 0.15em; padding: 3px 7px; text-transform: uppercase; }
        .alert-card.ok .alert-badge { color: var(--green-dim); border: 1px solid var(--green-faint); }
        .alert-card.warn .alert-badge { color: var(--amber); border: 1px solid #5a3a00; }
        .alert-card.crit .alert-badge { color: var(--red); border: 1px solid #5a0800; }

        .cta-section {
          background: var(--surface);
          border: 1px solid var(--green-dim);
          margin: 0 48px 72px;
          padding: 60px 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
          animation: pulse-border 4s ease-in-out infinite;
        }
        .cta-tag { font-size: 10px; letter-spacing: 0.3em; color: var(--text-muted); margin-bottom: 20px; text-transform: uppercase; }
        .cta-h { font-size: clamp(22px,3vw,36px); font-weight: 700; color: var(--green-bright); text-shadow: 0 0 24px rgba(57,255,106,0.4); margin-bottom: 12px; }
        .cta-body { font-size: 13px; color: var(--green-dim); margin-bottom: 32px; }
        .cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

        .footer {
          border-top: 1px solid var(--green-faint);
          padding: 28px 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          letter-spacing: 0.08em;
        }
        .green-dim-text { color: var(--green-dim); }
        .muted { color: var(--text-muted); }

        @media (max-width: 768px) {
          .nav { padding: 14px 20px; }
          .nav-links { display: none; }
          .hero { padding: 60px 20px 40px; }
          .stats-row { grid-template-columns: repeat(2,1fr); margin: 32px 20px 0; }
          .section { padding: 48px 20px; }
          .features-grid { grid-template-columns: 1fr; }
          .steps { grid-template-columns: 1fr 1fr; }
          .alert-grid { grid-template-columns: 1fr; }
          .terminal-section, .cta-section { margin: 0 20px; }
          .cta-section { padding: 40px 24px; margin-bottom: 48px; }
          .footer { padding: 20px; flex-direction: column; gap: 10px; text-align: center; }
        }
      `}</style>
    </div>
  );
}
