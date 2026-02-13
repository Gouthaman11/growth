import express from "express";
import pool from "../_config/db.js";
import { verifyToken } from "../_middleware/auth.js";

const router = express.Router();

const parseJsonField = (val, fallback = {}) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val;
};

// ─── GET /test-connection ───────────────────────────────────────
router.get("/test-connection", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      portalUrl: "https://bip.bitsathy.ac.in",
      usesGoogleSSO: true,
      message: "BIP uses Google SSO. Please login to portal and enter your data manually.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /:userId/bip-status ────────────────────────────────────
router.get("/:userId/bip-status", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT academics FROM "Users" WHERE id = $1',
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const academics = parseJsonField(result.rows[0].academics, {});

    res.json({
      success: true,
      portalUrl: "https://bip.bitsathy.ac.in",
      usesGoogleSSO: true,
      lastSynced: academics.lastSynced || null,
      hasData: !!(academics.cgpa || academics.sgpa || academics.attendance),
      message: "BIP uses Google SSO. Please login to portal and enter your data manually.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /:userId/data ──────────────────────────────────────────
router.get("/:userId/data", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT academics FROM "Users" WHERE id = $1',
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const academics = parseJsonField(result.rows[0].academics, {});
    const defaults = {
      cgpa: 0, sgpa: 0, attendance: 0, totalCredits: 0,
      earnedCredits: 0, currentSemester: 1, semesters: [], lastSynced: null,
    };

    res.json({
      success: true,
      data: { ...defaults, ...academics },
      lastSynced: academics.lastSynced || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── PUT /:userId/data ──────────────────────────────────────────
router.put("/:userId/data", verifyToken, async (req, res) => {
  try {
    const {
      cgpa, sgpa, attendance, currentSemester,
      semesters, totalCredits, earnedCredits,
    } = req.body;

    const currentResult = await pool.query(
      'SELECT academics FROM "Users" WHERE id = $1',
      [req.params.userId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const currentAcademics = parseJsonField(currentResult.rows[0].academics, {});

    const updatedAcademics = {
      ...currentAcademics,
      cgpa: cgpa !== undefined ? parseFloat(cgpa) : currentAcademics.cgpa || 0,
      sgpa: sgpa !== undefined ? parseFloat(sgpa) : currentAcademics.sgpa || 0,
      attendance: attendance !== undefined ? parseFloat(attendance) : currentAcademics.attendance || 0,
      currentSemester: currentSemester || currentAcademics.currentSemester || 1,
      totalCredits: totalCredits || currentAcademics.totalCredits || 0,
      earnedCredits: earnedCredits || currentAcademics.earnedCredits || 0,
      semesters: semesters || currentAcademics.semesters || [],
      lastSynced: new Date().toISOString(),
    };

    await pool.query(
      'UPDATE "Users" SET academics = $1, "updatedAt" = NOW() WHERE id = $2',
      [JSON.stringify(updatedAcademics), req.params.userId]
    );

    res.json({
      success: true,
      message: "Academic data updated successfully",
      data: updatedAcademics,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── PATCH /:userId/quick-update ────────────────────────────────
router.patch("/:userId/quick-update", verifyToken, async (req, res) => {
  try {
    const { cgpa, sgpa, attendance } = req.body;

    const currentResult = await pool.query(
      'SELECT academics FROM "Users" WHERE id = $1',
      [req.params.userId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const current = parseJsonField(currentResult.rows[0].academics, {});
    const updated = {
      ...current,
      cgpa: cgpa !== undefined ? parseFloat(cgpa) : current.cgpa || 0,
      sgpa: sgpa !== undefined ? parseFloat(sgpa) : current.sgpa || 0,
      attendance: attendance !== undefined ? parseFloat(attendance) : current.attendance || 0,
      lastSynced: new Date().toISOString(),
    };

    await pool.query(
      'UPDATE "Users" SET academics = $1, "updatedAt" = NOW() WHERE id = $2',
      [JSON.stringify(updated), req.params.userId]
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /:userId/semesters ────────────────────────────────────
router.post("/:userId/semesters", verifyToken, async (req, res) => {
  try {
    const currentResult = await pool.query(
      'SELECT academics FROM "Users" WHERE id = $1',
      [req.params.userId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const current = parseJsonField(currentResult.rows[0].academics, {});
    const semesters = current.semesters || [];
    semesters.push(req.body);

    const updated = { ...current, semesters, lastSynced: new Date().toISOString() };

    await pool.query(
      'UPDATE "Users" SET academics = $1, "updatedAt" = NOW() WHERE id = $2',
      [JSON.stringify(updated), req.params.userId]
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
