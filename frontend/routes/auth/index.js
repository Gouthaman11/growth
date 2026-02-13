import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import pool from "../_config/db.js";
import { verifyToken, generateToken } from "../_middleware/auth.js";

const router = express.Router();

// ─── POST /login ────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    console.log("[AUTH] POST /login hit");
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("[AUTH] Login rejected: missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("[AUTH] Querying user by email:", email);
    const result = await pool.query(
      'SELECT * FROM "Users" WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    console.log("[AUTH] Query complete, rows found:", result.rows.length);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    console.log("[AUTH] Comparing password...");
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("[AUTH] Password match:", passwordMatch);

    if (passwordMatch) {
      return res.json({
        uid: user.id,
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName || user.full_name,
        token: generateToken(user.id),
      });
    } else {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("[AUTH] Login Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── POST /register ─────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    console.log("[AUTH] POST /register hit");
    const {
      email,
      password,
      role,
      fullName,
      rollNumber,
      year,
      department,
      avatar,
      employeeId,
      designation,
      specialization,
      github,
      leetcode,
      hackerrank,
      linkedin,
      portfolio,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    console.log("[AUTH] Checking if user exists:", email);
    const userCheck = await pool.query(
      'SELECT id FROM "Users" WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    console.log("[AUTH] Existing user check complete, found:", userCheck.rows.length);

    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Email is already in use. Please use a different email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const codingProfiles = {
      github: github || "",
      leetcode: leetcode || "",
      hackerrank: hackerrank || "",
      linkedin: linkedin || "",
      portfolio: portfolio || "",
    };

    const academics = {
      cgpa: 0,
      sgpa: 0,
      attendance: 0,
      totalCredits: 0,
      earnedCredits: 0,
      currentSemester: 1,
      semesters: [],
      lastSynced: null,
    };

    const bipCredentials = {
      email: "",
      password: "",
      lastSync: null,
      syncStatus: "never",
    };

    const userId = uuidv4();
    console.log("[AUTH] Inserting new user:", userId);
    const result = await pool.query(
      `INSERT INTO "Users" (
        id, email, password, role, "fullName", "rollNumber", year, department,
        avatar, "employeeId", designation, specialization, "codingProfiles",
        academics, "bipCredentials", "growthScore", "assignedStudents", "isActive",
        "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())
      RETURNING *`,
      [
        userId,
        email,
        hashedPassword,
        role || "student",
        fullName || "",
        rollNumber || null,
        year || null,
        department || null,
        avatar || null,
        employeeId || null,
        designation || null,
        specialization || null,
        JSON.stringify(codingProfiles),
        JSON.stringify(academics),
        JSON.stringify(bipCredentials),
        0,
        JSON.stringify([]),
        true,
      ]
    );
    console.log("[AUTH] Insert complete, rows:", result.rows.length);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return res.status(201).json({
        uid: user.id,
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName || user.full_name,
        rollNumber: user.rollNumber,
        year: user.year,
        department: user.department,
        codingProfiles:
          typeof user.codingProfiles === "string"
            ? JSON.parse(user.codingProfiles)
            : user.codingProfiles,
        token: generateToken(user.id),
      });
    } else {
      return res.status(400).json({ error: "Failed to create user" });
    }
  } catch (error) {
    console.error("[AUTH] Register Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET /profile ───────────────────────────────────────────────
router.get("/profile", verifyToken, async (req, res) => {
  try {
    console.log("[AUTH] GET /profile hit, userId:", req.user?.id);

    const result = await pool.query(
      `SELECT
        id, email, role, "fullName", "rollNumber", year, department,
        avatar, "employeeId", designation, specialization, "codingProfiles",
        academics, "bipCredentials", "growthScore", "assignedStudents", "isActive"
      FROM "Users" WHERE id = $1`,
      [req.user.id]
    );
    console.log("[AUTH] Profile query complete, rows:", result.rows.length);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const parsedUser = {
      ...user,
      uid: user.id,
      codingProfiles:
        typeof user.codingProfiles === "string"
          ? JSON.parse(user.codingProfiles || "{}")
          : user.codingProfiles,
      academics:
        typeof user.academics === "string"
          ? JSON.parse(user.academics || "{}")
          : user.academics,
      bipCredentials:
        typeof user.bipCredentials === "string"
          ? JSON.parse(user.bipCredentials || "{}")
          : user.bipCredentials,
      assignedStudents:
        typeof user.assignedStudents === "string"
          ? JSON.parse(user.assignedStudents || "[]")
          : user.assignedStudents,
    };

    return res.json(parsedUser);
  } catch (error) {
    console.error("[AUTH] Profile Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── PUT /update-profile ────────────────────────────────────────
router.put("/update-profile", verifyToken, async (req, res) => {
  try {
    console.log("[AUTH] PUT /update-profile hit, userId:", req.user?.id);

    const userId = req.user.id; // Always from JWT

    const {
      fullName,
      rollNumber,
      year,
      department,
      avatar,
      employeeId,
      designation,
      specialization,
      github,
      leetcode,
      hackerrank,
      linkedin,
      portfolio,
    } = req.body;

    // Get current coding profiles
    console.log("[AUTH] Fetching current user profiles...");
    const currentUser = await pool.query(
      'SELECT "codingProfiles" FROM "Users" WHERE id = $1',
      [userId]
    );
    console.log("[AUTH] Current user query complete, rows:", currentUser.rows.length);

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingProfiles =
      typeof currentUser.rows[0].codingProfiles === "string"
        ? JSON.parse(currentUser.rows[0].codingProfiles || "{}")
        : currentUser.rows[0].codingProfiles || {};

    const updatedCodingProfiles = {
      github: github !== undefined ? github : existingProfiles.github || "",
      leetcode:
        leetcode !== undefined ? leetcode : existingProfiles.leetcode || "",
      hackerrank:
        hackerrank !== undefined
          ? hackerrank
          : existingProfiles.hackerrank || "",
      linkedin:
        linkedin !== undefined ? linkedin : existingProfiles.linkedin || "",
      portfolio:
        portfolio !== undefined ? portfolio : existingProfiles.portfolio || "",
    };

    // Build dynamic update
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updateFields.push(`"fullName" = $${paramCount++}`);
      updateValues.push(fullName);
    }
    if (rollNumber !== undefined) {
      updateFields.push(`"rollNumber" = $${paramCount++}`);
      updateValues.push(rollNumber);
    }
    if (year !== undefined) {
      updateFields.push(`year = $${paramCount++}`);
      updateValues.push(year);
    }
    if (department !== undefined) {
      updateFields.push(`department = $${paramCount++}`);
      updateValues.push(department);
    }
    if (avatar !== undefined) {
      updateFields.push(`avatar = $${paramCount++}`);
      updateValues.push(avatar);
    }
    if (employeeId !== undefined) {
      updateFields.push(`"employeeId" = $${paramCount++}`);
      updateValues.push(employeeId);
    }
    if (designation !== undefined) {
      updateFields.push(`designation = $${paramCount++}`);
      updateValues.push(designation);
    }
    if (specialization !== undefined) {
      updateFields.push(`specialization = $${paramCount++}`);
      updateValues.push(specialization);
    }

    // Always update coding profiles if any profile field provided
    if (
      github !== undefined ||
      leetcode !== undefined ||
      hackerrank !== undefined ||
      linkedin !== undefined ||
      portfolio !== undefined
    ) {
      updateFields.push(`"codingProfiles" = $${paramCount++}`);
      updateValues.push(JSON.stringify(updatedCodingProfiles));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(userId);

    const updateQuery = `
      UPDATE "Users"
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, email, role, "fullName", "rollNumber", year, department,
                avatar, "employeeId", designation, specialization, "codingProfiles",
                academics, "bipCredentials", "growthScore", "assignedStudents", "isActive"
    `;

    console.log("[AUTH] Running update query...");
    const result = await pool.query(updateQuery, updateValues);
    console.log("[AUTH] Update complete, rows:", result.rows.length);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const responseUser = {
        ...user,
        uid: user.id,
        codingProfiles:
          typeof user.codingProfiles === "string"
            ? JSON.parse(user.codingProfiles || "{}")
            : user.codingProfiles,
        academics:
          typeof user.academics === "string"
            ? JSON.parse(user.academics || "{}")
            : user.academics,
        bipCredentials:
          typeof user.bipCredentials === "string"
            ? JSON.parse(user.bipCredentials || "{}")
            : user.bipCredentials,
        assignedStudents:
          typeof user.assignedStudents === "string"
            ? JSON.parse(user.assignedStudents || "[]")
            : user.assignedStudents,
      };

      return res.json({ message: "Profile updated successfully", user: responseUser });
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("[AUTH] Update Profile Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /update-profile-links ────────────────────────────────
router.patch("/update-profile-links", verifyToken, async (req, res) => {
  try {
    console.log("[AUTH] PATCH /update-profile-links hit");
    const userId = req.user.id; // ← from JWT middleware
    console.log("[AUTH] User ID:", userId);

    const { github, leetcode, hackerrank, linkedin, portfolio } = req.body;

    console.log("[AUTH] Fetching current coding profiles...");
    const currentResult = await pool.query(
      'SELECT "codingProfiles" FROM "Users" WHERE id = $1',
      [userId]
    );
    console.log("[AUTH] Query complete, rows:", currentResult.rows.length);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentProfiles =
      typeof currentResult.rows[0].codingProfiles === "string"
        ? JSON.parse(currentResult.rows[0].codingProfiles || "{}")
        : currentResult.rows[0].codingProfiles || {};

    const updatedProfiles = {
      github: github !== undefined ? github : currentProfiles.github || "",
      leetcode:
        leetcode !== undefined ? leetcode : currentProfiles.leetcode || "",
      hackerrank:
        hackerrank !== undefined
          ? hackerrank
          : currentProfiles.hackerrank || "",
      linkedin:
        linkedin !== undefined ? linkedin : currentProfiles.linkedin || "",
      portfolio:
        portfolio !== undefined ? portfolio : currentProfiles.portfolio || "",
    };

    console.log("[AUTH] Updating coding profiles...");
    const updateResult = await pool.query(
      `UPDATE "Users"
       SET "codingProfiles" = $1, "updatedAt" = NOW()
       WHERE id = $2
       RETURNING id, email, role, "fullName", "codingProfiles"`,
      [JSON.stringify(updatedProfiles), userId]
    );
    console.log("[AUTH] Update complete, rows:", updateResult.rows.length);

    if (updateResult.rows.length > 0) {
      const user = updateResult.rows[0];
      const parsedUser = {
        ...user,
        codingProfiles:
          typeof user.codingProfiles === "string"
            ? JSON.parse(user.codingProfiles || "{}")
            : user.codingProfiles,
      };

      return res.json({
        success: true,
        message: "Coding profiles updated successfully",
        user: parsedUser,
      });
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("[AUTH] Update Profile Links Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
