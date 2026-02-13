import express from "express";
import serverless from "serverless-http";
import cors from "cors";

import authRoutes from "../routes/auth/index.js";
import userRoutes from "../routes/users/index.js";
import progressRoutes from "../routes/progress/index.js";
import academicRoutes from "../routes/academics/index.js";
import goalRoutes from "../routes/goals/index.js";
import codingRoutes from "../routes/coding-data/index.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Debug: log every request
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check (replaces old api/health.js)
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), service: "EduGrow+ API" });
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
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

// No app.listen() — Vercel handles that
export default serverless(app);