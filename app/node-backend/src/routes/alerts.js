import { Router } from "express";
import { getDb } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

export const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const db = getDb();
  const alerts = await db.collection("alerts").find({}).sort({ timestamp: -1 }).toArray();
  alerts.forEach((a) => {
    a.id = a._id;
    delete a._id;
  });
  res.json(alerts);
});

router.post("/:alertId/acknowledge", async (req, res) => {
  const db = getDb();
  const alertId = parseInt(req.params.alertId, 10);
  const result = await db
    .collection("alerts")
    .findOneAndUpdate({ _id: alertId }, { $set: { acknowledged: true, acknowledged_at: new Date() } });
  if (!result) return res.status(404).json({ detail: "Alert not found" });
  res.json({ status: "acknowledged", alert_id: alertId });
});
