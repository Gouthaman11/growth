import express from "express";
import pool from "../_config/db.js";
import { verifyToken } from "../_middleware/auth.js";

const router = express.Router();

// ─── GET /:studentId — progress history ─────────────────────────
router.get("/:studentId", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const result = await pool.query(
      `SELECT * FROM "ProgressHistory"
       WHERE "studentId" = $1 AND "recordDate" >= $2
       ORDER BY "recordDate" ASC`,
      [req.params.studentId, startDate.toISOString()]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /:studentId/weekly-comparison ──────────────────────────
router.get("/:studentId/weekly-comparison", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const currentResult = await pool.query(
      `SELECT * FROM "ProgressHistory"
       WHERE "studentId" = $1
       ORDER BY "recordDate" DESC LIMIT 1`,
      [req.params.studentId]
    );

    const previousResult = await pool.query(
      `SELECT * FROM "ProgressHistory"
       WHERE "studentId" = $1 AND "recordDate" <= $2
       ORDER BY "recordDate" DESC LIMIT 1`,
      [req.params.studentId, lastWeek.toISOString()]
    );

    const current = currentResult.rows[0] || {};
    const previous = previousResult.rows[0] || {};
    const changes = {};

    if (current && previous) {
      changes.leetcodeTotal =
        (current.leetcodeTotal || 0) - (previous.leetcodeTotal || 0);
      changes.githubCommits =
        (current.githubCommits || 0) - (previous.githubCommits || 0);
      changes.githubRepos =
        (current.githubRepos || 0) - (previous.githubRepos || 0);
      changes.growthScore =
        (current.growthScore || 0) - (previous.growthScore || 0);
    }

    res.json({ current, previous, changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /:studentId/monthly-summary ────────────────────────────
router.get("/:studentId/monthly-summary", verifyToken, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await pool.query(
      `SELECT * FROM "ProgressHistory"
       WHERE "studentId" = $1 AND "recordDate" >= $2
       ORDER BY "recordDate" ASC`,
      [req.params.studentId, thirtyDaysAgo.toISOString()]
    );

    res.json({ records: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /:studentId/record — record a progress snapshot ──────
router.post("/:studentId/record", verifyToken, async (req, res) => {
  try {
    // Gather latest data from Users + CodingData to create a snapshot
    const userResult = await pool.query(
      'SELECT "growthScore", academics FROM "Users" WHERE id = $1',
      [req.params.studentId]
    );

    const codingResult = await pool.query(
      'SELECT * FROM "CodingData" WHERE "studentId" = $1',
      [req.params.studentId]
    );

    const user = userResult.rows[0] || {};
    const coding = codingResult.rows[0] || {};
    const github =
      typeof coding.github === "string"
        ? JSON.parse(coding.github || "{}")
        : coding.github || {};
    const leetcode =
      typeof coding.leetcode === "string"
        ? JSON.parse(coding.leetcode || "{}")
        : coding.leetcode || {};

    const result = await pool.query(
      `INSERT INTO "ProgressHistory"
       ("studentId", "growthScore", "githubCommits", "githubRepos",
        "leetcodeTotal", "recordDate", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW(),NOW())
       RETURNING *`,
      [
        req.params.studentId,
        user.growthScore || 0,
        github.publicRepos || 0,
        github.publicRepos || 0,
        leetcode.totalSolved || 0,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
