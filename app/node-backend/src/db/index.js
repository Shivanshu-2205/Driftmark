import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { config } from "../config.js";

let client;
let db;

export function getDb() {
  if (!db) throw new Error("MongoDB not initialized. Call initDb() first.");
  return db;
}

export async function initDb() {
  client = new MongoClient(config.mongoUri);
  await client.connect();
  db = client.db(config.mongoDb);

  const existing = await db.listCollections().toArray();
  const names = existing.map((c) => c.name);

  if (!names.includes("prediction_logs")) {
    await db.createCollection("prediction_logs", {
      timeseries: { timeField: "served_at", metaField: "meta", granularity: "seconds" },
      expireAfterSeconds: 7776000,
    });
  }

  await db.collection("models").createIndex({ name: 1 }, { unique: true });
  await db.collection("model_versions").createIndex({ model_id: 1, version: 1 }, { unique: true });
  await db.collection("model_versions").createIndex({ model_id: 1, is_active: 1 });
  await db.collection("prediction_logs").createIndex({ prediction_id: 1 });
  await db.collection("prediction_logs").createIndex({ "meta.model_id": 1, served_at: -1 });
  await db.collection("drift_runs").createIndex({ model_id: 1, timestamp: -1 });
  await db.collection("alerts").createIndex({ model_id: 1, acknowledged: 1, timestamp: -1 });
  await db.collection("pending_batches").createIndex({ model_id: 1, status: 1 });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  await seedAdmin();
  return db;
}

async function seedAdmin() {
  const existingAdmin = await db.collection("users").findOne({ email: "admin@example.com" });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await db.collection("users").insertOne({
      email: "admin@example.com",
      hashed_password: hashed,
      is_active: true,
      created_at: new Date(),
    });
    console.log("[DriftWatch] Default admin user created: admin@example.com / admin123");
  }
}

export async function nextId(collectionName) {
  const last = await db.collection(collectionName).find({}).sort({ _id: -1 }).limit(1).toArray();
  return last.length ? last[0]._id + 1 : 1;
}
