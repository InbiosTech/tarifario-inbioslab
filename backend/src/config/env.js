import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: backendEnvPath });

const isProduction = process.env.NODE_ENV === "production";

function getDbVar(localKey, prodKey, defaultValue = "") {
  if (isProduction) {
    return process.env[prodKey] || process.env[localKey] || defaultValue;
  }
  return process.env[localKey] || defaultValue;
}

function getRuntimeVar(localKey, prodKey, defaultValue = "") {
  if (isProduction) {
    return process.env[prodKey] || process.env[localKey] || defaultValue;
  }
  return process.env[localKey] || defaultValue;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  apiHost: process.env.API_HOST || "0.0.0.0",
  apiPort: Number(process.env.PORT || process.env.API_PORT || 8081),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173,https://inbiostech.github.io",
  writeApiKey: getRuntimeVar("WRITE_API_KEY", "WRITE_API_KEY_PROD", "41950361"),
  adminApiKey: getRuntimeVar("ADMIN_API_KEY", "ADMIN_API_KEY_PROD", "41950361"),
  adminPortalUser: getRuntimeVar("ADMIN_PORTAL_USER", "ADMIN_PORTAL_USER_PROD", "admin"),
  adminPortalPassword: getRuntimeVar("ADMIN_PORTAL_PASSWORD", "ADMIN_PORTAL_PASSWORD_PROD", ""),
  authSessionSecret: getRuntimeVar("AUTH_SESSION_SECRET", "AUTH_SESSION_SECRET_PROD", "change-me-session-secret"),
  authSessionCookieName: process.env.AUTH_SESSION_COOKIE_NAME || "inbioslab_admin_session",
  authSessionTtlHours: Number(process.env.AUTH_SESSION_TTL_HOURS || 12),
  db: {
    host: getDbVar("DB_HOST", "DB_HOST_PROD", "127.0.0.1"),
    port: Number(getDbVar("DB_PORT", "DB_PORT_PROD", "3306")),
    socketPath: getDbVar("DB_SOCKET_PATH", "DB_SOCKET_PATH_PROD", ""),
    name: getDbVar("DB_NAME", "DB_NAME_PROD", "tarifario_inbioslab"),
    user: getDbVar("DB_USER", "DB_USER_PROD", "inbioslab"),
    password: getDbVar("DB_PASSWORD", "DB_PASSWORD_PROD", ""),
    ssl: String(getDbVar("DB_SSL", "DB_SSL_PROD", "false")).toLowerCase() === "true",
  },
};
