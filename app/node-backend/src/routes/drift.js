import { Router } from "express";
import { getDb } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

export const router = Router();
router.use(requireAuth);

router.get("/:modelId/drift-runs/:runId", async (req, res) => {
  const db = getDb();
  const modelId = parseInt(req.params.modelId, 10);
  const runId = parseInt(req.params.runId, 10);
  const run = await db.collection("drift_runs").findOne({ _id: runId, model_id: modelId });
  if (!run) return res.status(404).json({ detail: "Drift run not found" });
  run.id = run._id;
  delete run._id;
  res.json(run);
});

router.get("/:modelId/drift-runs/:runId/report", async (req, res) => {
  const db = getDb();
  const modelId = parseInt(req.params.modelId, 10);
  const runId = parseInt(req.params.runId, 10);
  const run = await db.collection("drift_runs").findOne({ _id: runId, model_id: modelId });
  if (!run) return res.status(404).json({ detail: "Drift run not found" });
  const model = await db.collection("models").findOne({ _id: modelId });

  const modelName = model ? model.name : `Model #${modelId}`;
  const ts = run.timestamp || new Date();
  const colorMap = { none: "#39ff6a", moderate: "#ffb627", severe: "#ff4136" };
  const severityColor = colorMap[run.overall_severity] || colorMap.none;

  let featureRows = "";
  for (const [feat, stats] of Object.entries(run.feature_drift || {})) {
    const sev = stats.severity || "none";
    const sevColor = colorMap[sev] || colorMap.none;
    featureRows += `
        <tr>
          <td>${feat}</td>
          <td>${(stats.psi ?? 0).toFixed(4)}</td>
          <td>${(stats.ks_statistic ?? 0).toFixed(4)}</td>
          <td>${(stats.ks_p_value ?? 0).toFixed(4)}</td>
          <td>${(stats.js_divergence ?? 0).toFixed(4)}</td>
          <td>${(stats.ref_mean ?? 0).toFixed(4)}</td>
          <td>${(stats.cur_mean ?? 0).toFixed(4)}</td>
          <td style="color:${sevColor};font-weight:700">${sev.toUpperCase()}</td>
        </tr>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DriftWatch – Drift Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    body {
      background: #050805; color: #39ff6a;
      font-family: 'JetBrains Mono', monospace;
      margin: 0; padding: 2rem;
    }
    h1 { font-size: 1.4rem; letter-spacing: .12em; margin-bottom: .3rem; }
    .subtitle { color: #1f8f3e; font-size: .75rem; letter-spacing: .14em; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card {
      background: #0a100a; border: 1px solid rgba(57,255,106,.18);
      padding: 1rem; border-radius: 2px;
    }
    .card label { font-size: .65rem; color: #1f8f3e; letter-spacing: .12em; display: block; margin-bottom: .3rem; }
    .card value { font-size: 1.1rem; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: .78rem; }
    th { color: #1f8f3e; text-align: left; padding: .5rem .8rem; border-bottom: 1px solid rgba(57,255,106,.18); font-size: .65rem; letter-spacing: .12em; }
    td { padding: .5rem .8rem; border-bottom: 1px solid rgba(57,255,106,.06); }
    tr:hover td { background: rgba(57,255,106,.04); }
    .severity { color: ${severityColor}; font-weight: 700; }
    @media print { body { background: #fff; color: #000; } .card { border-color: #ccc; background: #f9f9f9; } }
  </style>
</head>
<body>
  <h1>◈ DRIFTWATCH — DRIFT ANALYSIS REPORT</h1>
  <div class="subtitle">AUTONOMOUS ML LIFECYCLE SYSTEM · GENERATED ${ts}</div>

  <div class="grid">
    <div class="card"><label>MODEL</label><value>${modelName}</value></div>
    <div class="card"><label>BATCH</label><value>${run.batch_name || "N/A"}</value></div>
    <div class="card"><label>RUN ID</label><value>#${runId}</value></div>
    <div class="card"><label>OVERALL PSI</label><value>${(run.overall_psi ?? 0).toFixed(4)}</value></div>
    <div class="card"><label>SEVERITY</label><value class="severity">${(run.overall_severity || "none").toUpperCase()}</value></div>
    <div class="card"><label>TOP DRIFTED FEATURE</label><value>${run.top_drifted_feature || "N/A"}</value></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>FEATURE</th><th>PSI</th><th>KS STAT</th><th>KS p-VALUE</th>
        <th>JS DIV</th><th>REF MEAN</th><th>CUR MEAN</th><th>SEVERITY</th>
      </tr>
    </thead>
    <tbody>${featureRows}</tbody>
  </table>

  <div style="margin-top:2rem;font-size:.65rem;color:#1f8f3e;letter-spacing:.1em;">
    DRIFTWATCH v2.0 · NODE + PYTHON EDITION · REPORT GENERATED ON ${new Date().toISOString()}
  </div>
</body>
</html>`;

  res.set("Content-Type", "text/html").send(html);
});
