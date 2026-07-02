import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// safe wrapper used everywhere
export const query = (text, params) => pool.query(text, params);

// export pool ONLY if needed elsewhere
export { pool };

export default pool;
