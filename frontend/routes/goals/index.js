import express from "express";
import pool from "../_config/db.js";
import { verifyToken } from "../_middleware/auth.js";

const router = express.Router();

// ─── GET / — all goals (optional ?studentId= &status= &category=)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { studentId, status, category } = req.query;
    let where = "1=1";
    const params = [];
    let idx = 1;

    if (studentId) { where += ` AND "studentId" = $${idx++}`; params.push(studentId); }
    if (status) { where += ` AND status = $${idx++}`; params.push(status); }
    if (category) { where += ` AND category = $${idx++}`; params.push(category); }

    const result = await pool.query(
      `SELECT * FROM "Goals" WHERE ${where} ORDER BY deadline ASC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /student/:studentId ────────────────────────────────────
router.get("/student/:studentId", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "Goals" WHERE "studentId" = $1 ORDER BY deadline ASC',
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /student/:studentId/active ─────────────────────────────
router.get("/student/:studentId/active", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM "Goals"
       WHERE "studentId" = $1 AND status IN ('not-started','in-progress','on-track')
       ORDER BY deadline ASC`,
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /:id ───────────────────────────────────────────────────
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "Goals" WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST / — create goal ───────────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
  try {
    const { studentId, title, description, category, deadline, status } = req.body;
    const result = await pool.query(
      `INSERT INTO "Goals" ("studentId", title, description, category, deadline, status, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
      [studentId, title, description, category, deadline, status || "not-started"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── PATCH /:id — update goal ───────────────────────────────────
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { title, description, category, deadline, status, progress } = req.body;
    const fields = [];
    const vals = [];
    let p = 1;

    if (title !== undefined) { fields.push(`title = $${p++}`); vals.push(title); }
    if (description !== undefined) { fields.push(`description = $${p++}`); vals.push(description); }
    if (category !== undefined) { fields.push(`category = $${p++}`); vals.push(category); }
    if (deadline !== undefined) { fields.push(`deadline = $${p++}`); vals.push(deadline); }
    if (status !== undefined) { fields.push(`status = $${p++}`); vals.push(status); }
    if (progress !== undefined) { fields.push(`progress = $${p++}`); vals.push(progress); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`"updatedAt" = NOW()`);
    vals.push(req.params.id);

    const result = await pool.query(
      `UPDATE "Goals" SET ${fields.join(", ")} WHERE id = $${p} RETURNING *`,
      vals
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── PATCH /:id/progress — update progress only ────────────────
router.patch("/:id/progress", verifyToken, async (req, res) => {
  try {
    const { progress } = req.body;
    const result = await pool.query(
      `UPDATE "Goals" SET progress = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [progress, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── PATCH /:id/complete — mark goal complete ───────────────────
router.patch("/:id/complete", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE "Goals" SET status = 'completed', progress = 100, "updatedAt" = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
