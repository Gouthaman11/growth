import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  // Serverless-optimized settings: prevent hanging on cold starts
  connectionTimeoutMillis: 5000,   // fail fast if RDS is unreachable
  idleTimeoutMillis: 10000,        // release idle connections quickly
  max: 3,                          // keep pool small for serverless
});

// One-time connectivity check (runs at module load / cold start)
pool.query("SELECT 1")
  .then(() => console.log("[DB] Connected to AWS RDS PostgreSQL"))
  .catch((err) => console.error("[DB] Connection check failed:", err.message));

export default pool;