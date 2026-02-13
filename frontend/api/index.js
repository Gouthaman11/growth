import express from "express";
import serverless from "serverless-http";
import cors from "cors";

import { connectDB } from "./_config/db.js";

import authRoutes from "../routes/auth/index.js";
import userRoutes from "../routes/users/index.js";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ connect DB INSIDE middleware (lazy connect)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

export default serverless(app);