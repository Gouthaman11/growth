import pg from "pg";
const { Pool } = pg;

// ── Global connection cache for serverless ──────────────────────
let pool = null;
let isConnected = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 3,
    });
    console.log("[DB] Pool created");
  }
  return pool;
}

// Call once at startup (api/index.js). Authenticates only if not already connected.
export async function connectDB() {
  if (isConnected) {
    console.log("[DB] Already connected, skipping");
    return;
  }
  try {
    const p = getPool();
    await p.query("SELECT 1");
    isConnected = true;
    console.log("[DB] Connected to AWS RDS PostgreSQL");
  } catch (err) {
    console.error("[DB] Connection failed:", err.message);
    isConnected = false;
    throw err;
  }
}

export default getPool();