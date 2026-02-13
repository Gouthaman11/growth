import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import { connectDB } from "../routes/_config/db.js";

import authRoutes from "../routes/auth/index.js";
import userRoutes from "../routes/users/index.js";
import progressRoutes from "../routes/progress/index.js";
import academicRoutes from "../routes/academics/index.js";
import goalRoutes from "../routes/goals/index.js";
import codingRoutes from "../routes/coding-data/index.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Debug: log every request with timestamp
app.use((req, res, next) => {
  console.log(`[API] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  return res.json({ status: "healthy", timestamp: new Date().toISOString(), service: "EduGrow+ API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/academics", academicRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/coding-data", codingRoutes);

// Catch-all 404 for unmatched /api routes
app.all("/api/*", (req, res) => {
  console.log("[API] 404 — no route matched:", req.method, req.originalUrl);
  return res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

// ── Serverless handler with one-time DB connection ──────────────
const handler = serverless(app);

export default async function (req, res) {
  // Connect once per cold start — cached, won't re-authenticate if already connected
  await connectDB();
  return handler(req, res);
}