import mysql from "mysql2/promise";
import { env } from "../config/env.js";

const baseConfig = {
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (env.db.socketPath) {
  baseConfig.socketPath = env.db.socketPath;
} else {
  baseConfig.host = env.db.host;
  baseConfig.port = env.db.port;
  baseConfig.ssl = env.db.ssl ? { rejectUnauthorized: true } : undefined;
}

export const pool = mysql.createPool(baseConfig);

export async function dbHealthcheck() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  return rows?.[0]?.ok === 1;
}
