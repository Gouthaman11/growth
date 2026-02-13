import express from "express";
import pool from "../_config/db.js";
import { verifyToken } from "../_middleware/auth.js";

const router = express.Router();

// ─── Helper: parse JSON string fields safely ────────────────────
const parseJsonField = (val, fallback = {}) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val;
};

const parseUser = (user) => ({
  ...user,
  uid: user.id,
  codingProfiles: parseJsonField(user.codingProfiles, {}),
  academics: parseJsonField(user.academics, {}),
  bipCredentials: parseJsonField(user.bipCredentials, {}),
  assignedStudents: parseJsonField(user.assignedStudents, []),
});

// ─── GET / — all users (optional ?role= &department=) ───────────
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const { role, department } = req.query;
    let whereClause = "1=1";
    const params = [];
    let idx = 1;

    if (role) {
      whereClause += ` AND LOWER(role) = LOWER($${idx++})`;
      params.push(role);
    }
    if (department) {
      whereClause += ` AND department = $${idx++}`;
      params.push(department);
    }

    const result = await pool.query(
      `SELECT id, email, role, "fullName", "rollNumber", year, department,
              avatar, "employeeId", designation, specialization, "codingProfiles",
              academics, "growthScore", "assignedStudents", "mentorId",
              "isActive", "createdAt", "updatedAt"
       FROM "Users" WHERE ${whereClause}`,
      params
    );

    console.log("Fetched users:", {
      count: result.rows.length,
      role: role || "ALL",
    });

    res.json(result.rows.map(parseUser));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /mentor/:mentorId/students ─────────────────────────────
router.get("/mentor/:mentorId/students", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const { mentorId } = req.params;

    const result = await pool.query(
      `SELECT id, email, role, "fullName", "rollNumber", year, department,
              avatar, "codingProfiles", academics, "growthScore",
              "isActive", "createdAt", "updatedAt"
       FROM "Users"
       WHERE LOWER(role) = 'student' AND "mentorId" = $1`,
      [mentorId]
    );

    console.log("Mentor students:", result.rows.length);
    res.json(result.rows.map(parseUser));
  } catch (error) {
    console.error("Error fetching mentor students:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /:id/assigned-students ─────────────────────────────────
router.get("/:id/assigned-students", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const result = await pool.query(
      `SELECT id, email, role, "fullName", "rollNumber", year, department,
              avatar, "codingProfiles", academics, "growthScore",
              "isActive", "createdAt", "updatedAt"
       FROM "Users"
       WHERE LOWER(role) = 'student' AND "mentorId" = $1`,
      [req.params.id]
    );

    res.json(result.rows.map(parseUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /:id ───────────────────────────────────────────────────
router.get("/:id", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const result = await pool.query(
      `SELECT id, email, role, "fullName", "rollNumber", year, department,
              avatar, "employeeId", designation, specialization, "codingProfiles",
              academics, "bipCredentials", "growthScore", "assignedStudents", "isActive"
       FROM "Users" WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(parseUser(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /:id — update user fields ────────────────────────────
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const { id } = req.params;
    const {
      fullName, rollNumber, year, department, avatar,
      employeeId, designation, specialization, role,
      mentorId, isActive, growthScore,
    } = req.body;

    const fields = [];
    const vals = [];
    let p = 1;

    if (fullName !== undefined) { fields.push(`"fullName" = $${p++}`); vals.push(fullName); }
    if (rollNumber !== undefined) { fields.push(`"rollNumber" = $${p++}`); vals.push(rollNumber); }
    if (year !== undefined) { fields.push(`year = $${p++}`); vals.push(year); }
    if (department !== undefined) { fields.push(`department = $${p++}`); vals.push(department); }
    if (avatar !== undefined) { fields.push(`avatar = $${p++}`); vals.push(avatar); }
    if (employeeId !== undefined) { fields.push(`"employeeId" = $${p++}`); vals.push(employeeId); }
    if (designation !== undefined) { fields.push(`designation = $${p++}`); vals.push(designation); }
    if (specialization !== undefined) { fields.push(`specialization = $${p++}`); vals.push(specialization); }
    if (role !== undefined) { fields.push(`role = $${p++}`); vals.push(role); }
    if (mentorId !== undefined) { fields.push(`"mentorId" = $${p++}`); vals.push(mentorId); }
    if (isActive !== undefined) { fields.push(`"isActive" = $${p++}`); vals.push(isActive); }
    if (growthScore !== undefined) { fields.push(`"growthScore" = $${p++}`); vals.push(growthScore); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`"updatedAt" = NOW()`);
    vals.push(id);

    const result = await pool.query(
      `UPDATE "Users" SET ${fields.join(", ")} WHERE id = $${p} RETURNING *`,
      vals
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(parseUser(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /:id/coding-profiles ─────────────────────────────────
router.patch("/:id/coding-profiles", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    console.log("User ID:", req.user?.id);

    const currentResult = await pool.query(
      'SELECT "codingProfiles" FROM "Users" WHERE id = $1',
      [req.params.id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentProfiles = parseJsonField(
      currentResult.rows[0].codingProfiles,
      {}
    );
    const updatedProfiles = { ...currentProfiles, ...req.body };

    const updateResult = await pool.query(
      `UPDATE "Users"
       SET "codingProfiles" = $1, "updatedAt" = NOW()
       WHERE id = $2
       RETURNING id, email, role, "fullName", "codingProfiles"`,
      [JSON.stringify(updatedProfiles), req.params.id]
    );

    if (updateResult.rows.length > 0) {
      res.json(parseUser(updateResult.rows[0]));
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /:id/academics ───────────────────────────────────────
router.patch("/:id/academics", verifyToken, async (req, res) => {
  try {
    const currentResult = await pool.query(
      'SELECT academics FROM "Users" WHERE id = $1',
      [req.params.id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const current = parseJsonField(currentResult.rows[0].academics, {});
    const updated = { ...current, ...req.body, lastSynced: new Date().toISOString() };

    await pool.query(
      'UPDATE "Users" SET academics = $1, "updatedAt" = NOW() WHERE id = $2',
      [JSON.stringify(updated), req.params.id]
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /:id/assign-students ──────────────────────────────────
router.post("/:id/assign-students", verifyToken, async (req, res) => {
  try {
    const mentorId = req.params.id;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: "studentIds must be an array" });
    }

    // Update each student's mentorId
    for (const sid of studentIds) {
      await pool.query(
        'UPDATE "Users" SET "mentorId" = $1, "updatedAt" = NOW() WHERE id = $2',
        [mentorId, sid]
      );
    }

    // Also store in mentor's assignedStudents JSON
    await pool.query(
      'UPDATE "Users" SET "assignedStudents" = $1, "updatedAt" = NOW() WHERE id = $2',
      [JSON.stringify(studentIds), mentorId]
    );

    res.json({ success: true, message: "Students assigned", studentIds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE /:id ────────────────────────────────────────────────
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM "Users" WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
