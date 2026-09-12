import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getDb } from "../db/index.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token && req.query && typeof req.query.token === "string") {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const email = payload.sub;
    if (!email) {
      return res.status(401).json({ detail: "Invalid token payload" });
    }
    const user = await getDb().collection("users").findOne({ email });
    if (!user) {
      return res.status(401).json({ detail: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Could not validate token" });
  }
}
