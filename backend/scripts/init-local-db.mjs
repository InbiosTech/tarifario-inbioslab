import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

const rootEnvPath = path.join(workspaceRoot, ".env");
dotenv.config({ path: rootEnvPath });

const host = process.env.LOCAL_DB_HOST || "127.0.0.1";
const port = Number(process.env.LOCAL_DB_PORT || 3306);
const dbName = process.env.LOCAL_DB_NAME || "tarifario_inbioslab";
const rootUser = process.env.LOCAL_DB_ROOT_USER || "root";
const appUser = process.env.LOCAL_DB_USER || "inbioslab";
const appPassword = process.env.LOCAL_DB_PASSWORD || "inbioslab_dev_2026";
const rootPassword = process.env.LOCAL_DB_ROOT_PASSWORD || "root_dev_2026";

function esc(value) {
  return String(value).replace(/'/g, "''");
}

const schemaPath = path.join(workspaceRoot, "database", "schema.sql");
const seedPath = path.join(workspaceRoot, "database", "seed.from_data.sql");

const schemaSql = await fs.readFile(schemaPath, "utf8");
const seedSql = await fs.readFile(seedPath, "utf8");

async function createConnectionWithFallback() {
  const candidates = [
    { user: rootUser, password: rootPassword },
    { user: rootUser, password: "" },
    { user: appUser, password: appPassword },
  ];

  let lastError;
  for (const candidate of candidates) {
    try {
      const conn = await mysql.createConnection({
        host,
        port,
        user: candidate.user,
        password: candidate.password,
        multipleStatements: true,
      });

      return { conn, authUser: candidate.user };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

const { conn: connection, authUser } = await createConnectionWithFallback();

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  try {
    await connection.query(
      `CREATE USER IF NOT EXISTS '${esc(appUser)}'@'%' IDENTIFIED BY '${esc(appPassword)}'`
    );

    await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${esc(appUser)}'@'%'`);
    await connection.query("FLUSH PRIVILEGES");
  } catch (error) {
    console.warn(
      "Skipping CREATE USER/GRANT (insufficient privileges). Using existing MySQL users.",
      error.code || error.message
    );
  }

  await connection.changeUser({ database: dbName });
  await connection.query(schemaSql);
  await connection.query(seedSql);

  console.log(`Local DB ready on ${host}:${port} / ${dbName}`);
  console.log(`Application user: ${appUser}`);
  console.log(`Connected as: ${authUser}`);
} finally {
  await connection.end();
}
