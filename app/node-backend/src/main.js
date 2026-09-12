import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { initDb } from "./db/index.js";

import { router as authRouter } from "./routes/auth.js";
import { router as modelsRouter } from "./routes/models.js";
import { router as driftRouter } from "./routes/drift.js";
import { router as alertsRouter } from "./routes/alerts.js";
import { router as inferenceRouter } from "./routes/inference.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({ status: "healthy", database: "mongodb", version: "2.0.0" });
});

// Auth is public; everything else requires a bearer token (enforced per-router).
app.use("/auth", authRouter);
app.use("/models", modelsRouter);
app.use("/models", driftRouter); // drift-run + report sub-routes, same /models prefix
app.use("/alerts", alertsRouter);
app.use("/", inferenceRouter); // /predict, /ground-truth

app.use((req, res) => res.status(404).json({ detail: "Not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  if (err.code === 11000) {
    return res.status(409).json({ detail: "A record with this unique value already exists." });
  }
  res.status(err.status || 500).json({ detail: err.message || "Internal Server Error" });
});

async function start() {
  await initDb();
  app.listen(config.port, () => {
    console.log(`[DriftWatch] Node control-layer backend started on port ${config.port}`);
    console.log(`[DriftWatch] Python ML layer expected at ${config.mlServiceUrl}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
