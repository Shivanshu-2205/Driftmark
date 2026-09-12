import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db/index.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";

export const router = Router();

function createAccessToken(email) {
  return jwt.sign({ sub: email }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: config.jwtExpirationSeconds,
  });
}

router.post("/login", async (req, res) => {
  const { username, password, email } = req.body; // support OAuth2-form-style "username" or plain "email"
  const loginEmail = email || username;
  if (!loginEmail || !password) {
    return res.status(422).json({ detail: "email/username and password are required" });
  }
  const user = await getDb().collection("users").findOne({ email: loginEmail });
  if (!user || !(await bcrypt.compare(password, user.hashed_password))) {
    return res.status(401).json({ detail: "Incorrect email or password" });
  }
  const access_token = createAccessToken(user.email);
  res.json({ access_token, token_type: "bearer" });
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ detail: "email and password are required" });
  }
  const db = getDb();
  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    return res.status(400).json({ detail: "User already exists" });
  }
  const hashed_password = await bcrypt.hash(password, 10);
  await db.collection("users").insertOne({
    email,
    hashed_password,
    is_active: true,
    created_at: new Date(),
  });
  res.status(201).json({ msg: "User created successfully" });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ email: req.user.email, is_active: req.user.is_active });
});
