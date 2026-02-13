import express from "express";
import pool from "../_config/db.js";
import { verifyToken } from "../_middleware/auth.js";

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────
const parseJsonField = (val, fallback = {}) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val;
};

const extractUsername = (input, platform) => {
  if (!input || input.trim() === "") return null;
  const clean = input.trim();
  try {
    if (platform === "github") {
      const m = clean.match(/github\.com\/([^\/\?]+)/i);
      return m ? m[1] : clean;
    }
    if (platform === "leetcode") {
      const mU = clean.match(/leetcode\.com\/u\/([^\/\?]+)/i);
      const mD = clean.match(/leetcode\.com\/([^\/\?]+)/i);
      if (mU) return mU[1];
      if (mD && !mD[1].includes("/")) return mD[1];
    }
    if (platform === "hackerrank") {
      const mP = clean.match(/hackerrank\.com\/profile\/([^\/\?]+)/i);
      const mD = clean.match(/hackerrank\.com\/([^\/\?]+)/i);
      if (mP) return mP[1];
      if (mD && !mD[1].includes("/")) return mD[1];
    }
  } catch (e) {
    console.error("Error parsing URL:", e);
  }
  return clean;
};

const fetchGitHubData = async (input) => {
  const username = extractUsername(input, "github");
  if (!username) return null;
  const resp = await fetch(`https://api.github.com/users/${username}`, {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "EduGrow-Plus-App" },
  });
  if (!resp.ok) throw new Error(`GitHub user not found: ${username}`);
  const d = await resp.json();
  return {
    username: d.login, name: d.name, avatar: d.avatar_url, bio: d.bio,
    publicRepos: d.public_repos, followers: d.followers, following: d.following,
    profileUrl: d.html_url, createdAt: d.created_at, lastFetched: new Date(),
  };
};

const fetchLeetCodeData = async (input) => {
  const username = extractUsername(input, "leetcode");
  if (!username) return null;
  const resp = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
  if (resp.ok) {
    const d = await resp.json();
    if (d.status === "success" || d.totalSolved !== undefined) {
      return {
        username, ranking: d.ranking || 0, totalSolved: d.totalSolved || 0,
        easySolved: d.easySolved || 0, mediumSolved: d.mediumSolved || 0,
        hardSolved: d.hardSolved || 0, acceptanceRate: d.acceptanceRate || 0,
        profileUrl: `https://leetcode.com/u/${username}`, lastFetched: new Date(),
      };
    }
  }
  throw new Error(`LeetCode data not found for: ${username}`);
};

// ─── GET /:studentId ────────────────────────────────────────────
router.get("/:studentId", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const result = await pool.query(
      'SELECT * FROM "CodingData" WHERE "studentId" = $1',
      [req.params.studentId]
    );
    if (result.rows.length === 0) {
      return res.json({
        studentId: req.params.studentId,
        github: {},
        leetcode: {},
        hackerrank: {},
      });
    }
    const row = result.rows[0];
    res.json({
      ...row,
      github: parseJsonField(row.github, {}),
      leetcode: parseJsonField(row.leetcode, {}),
      hackerrank: parseJsonField(row.hackerrank, {}),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /:studentId/sync — sync all platforms ─────────────────
router.post("/:studentId/sync", verifyToken, async (req, res) => {
  try {
    console.log("Route hit:", req.originalUrl);
    const sid = req.params.studentId;
    // Get user's coding profiles
    const userResult = await pool.query(
      'SELECT "codingProfiles" FROM "Users" WHERE id = $1',
      [sid]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const profiles = parseJsonField(userResult.rows[0].codingProfiles, {});

    let githubData = null;
    let leetcodeData = null;

    try { if (profiles.github) githubData = await fetchGitHubData(profiles.github); } catch (e) { console.error("GitHub sync error:", e.message); }
    try { if (profiles.leetcode) leetcodeData = await fetchLeetCodeData(profiles.leetcode); } catch (e) { console.error("LeetCode sync error:", e.message); }

    // Upsert CodingData
    const exists = await pool.query(
      'SELECT id FROM "CodingData" WHERE "studentId" = $1',
      [sid]
    );
    if (exists.rows.length > 0) {
      const sets = [];
      const vals = [];
      let p = 1;
      if (githubData) { sets.push(`github = $${p++}`); vals.push(JSON.stringify(githubData)); }
      if (leetcodeData) { sets.push(`leetcode = $${p++}`); vals.push(JSON.stringify(leetcodeData)); }
      if (sets.length > 0) {
        sets.push(`"updatedAt" = NOW()`);
        vals.push(sid);
        await pool.query(
          `UPDATE "CodingData" SET ${sets.join(", ")} WHERE "studentId" = $${p}`,
          vals
        );
      }
    } else {
      await pool.query(
        `INSERT INTO "CodingData" ("studentId", github, leetcode, hackerrank, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,NOW(),NOW())`,
        [sid, JSON.stringify(githubData || {}), JSON.stringify(leetcodeData || {}), JSON.stringify({})]
      );
    }

    res.json({ success: true, github: githubData, leetcode: leetcodeData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /:studentId/fetch/github ──────────────────────────────
router.post("/:studentId/fetch/github", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "GitHub username is required" });

    const githubData = await fetchGitHubData(username);
    const sid = req.params.studentId;

    const existing = await pool.query('SELECT id FROM "CodingData" WHERE "studentId" = $1', [sid]);
    if (existing.rows.length > 0) {
      await pool.query('UPDATE "CodingData" SET github = $1, "updatedAt" = NOW() WHERE "studentId" = $2', [JSON.stringify(githubData), sid]);
    } else {
      await pool.query(
        'INSERT INTO "CodingData" ("studentId", github, leetcode, hackerrank, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())',
        [sid, JSON.stringify(githubData), JSON.stringify({}), JSON.stringify({})]
      );
    }

    res.json({ success: true, message: "GitHub data fetched and saved successfully", data: githubData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /:studentId/fetch/leetcode ────────────────────────────
router.post("/:studentId/fetch/leetcode", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "LeetCode username is required" });

    const leetcodeData = await fetchLeetCodeData(username);
    const sid = req.params.studentId;

    const existing = await pool.query('SELECT id FROM "CodingData" WHERE "studentId" = $1', [sid]);
    if (existing.rows.length > 0) {
      await pool.query('UPDATE "CodingData" SET leetcode = $1, "updatedAt" = NOW() WHERE "studentId" = $2', [JSON.stringify(leetcodeData), sid]);
    } else {
      await pool.query(
        'INSERT INTO "CodingData" ("studentId", github, leetcode, hackerrank, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())',
        [sid, JSON.stringify({}), JSON.stringify(leetcodeData), JSON.stringify({})]
      );
    }

    res.json({ success: true, message: "LeetCode data fetched and saved successfully", data: leetcodeData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /:studentId/fetch/hackerrank ──────────────────────────
router.post("/:studentId/fetch/hackerrank", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "HackerRank username is required" });

    // HackerRank has no public API — store the username
    const hackerData = {
      username: extractUsername(username, "hackerrank"),
      profileUrl: `https://www.hackerrank.com/${extractUsername(username, "hackerrank")}`,
      lastFetched: new Date(),
    };
    const sid = req.params.studentId;

    const existing = await pool.query('SELECT id FROM "CodingData" WHERE "studentId" = $1', [sid]);
    if (existing.rows.length > 0) {
      await pool.query('UPDATE "CodingData" SET hackerrank = $1, "updatedAt" = NOW() WHERE "studentId" = $2', [JSON.stringify(hackerData), sid]);
    } else {
      await pool.query(
        'INSERT INTO "CodingData" ("studentId", github, leetcode, hackerrank, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())',
        [sid, JSON.stringify({}), JSON.stringify({}), JSON.stringify(hackerData)]
      );
    }

    res.json({ success: true, message: "HackerRank data saved successfully", data: hackerData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /:studentId/github ───────────────────────────────────
router.patch("/:studentId/github", verifyToken, async (req, res) => {
  try {
    const sid = req.params.studentId;
    const existing = await pool.query('SELECT github FROM "CodingData" WHERE "studentId" = $1', [sid]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Coding data not found" });
    }
    const current = parseJsonField(existing.rows[0].github, {});
    const updated = { ...current, ...req.body };
    await pool.query('UPDATE "CodingData" SET github = $1, "updatedAt" = NOW() WHERE "studentId" = $2', [JSON.stringify(updated), sid]);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /:studentId/leetcode ─────────────────────────────────
router.patch("/:studentId/leetcode", verifyToken, async (req, res) => {
  try {
    const sid = req.params.studentId;
    const existing = await pool.query('SELECT leetcode FROM "CodingData" WHERE "studentId" = $1', [sid]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Coding data not found" });
    }
    const current = parseJsonField(existing.rows[0].leetcode, {});
    const updated = { ...current, ...req.body };
    await pool.query('UPDATE "CodingData" SET leetcode = $1, "updatedAt" = NOW() WHERE "studentId" = $2', [JSON.stringify(updated), sid]);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /:studentId/hackerrank ───────────────────────────────
router.patch("/:studentId/hackerrank", verifyToken, async (req, res) => {
  try {
    const sid = req.params.studentId;
    const existing = await pool.query('SELECT hackerrank FROM "CodingData" WHERE "studentId" = $1', [sid]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Coding data not found" });
    }
    const current = parseJsonField(existing.rows[0].hackerrank, {});
    const updated = { ...current, ...req.body };
    await pool.query('UPDATE "CodingData" SET hackerrank = $1, "updatedAt" = NOW() WHERE "studentId" = $2', [JSON.stringify(updated), sid]);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
