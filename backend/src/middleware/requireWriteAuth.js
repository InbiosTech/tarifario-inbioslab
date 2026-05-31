import { env } from "../config/env.js";
import { badRequest, forbidden, unauthorized } from "../utils/httpErrors.js";
import { parseCookieHeader, verifyAdminSessionToken } from "../utils/adminSession.js";

function resolveRoleFromKey(key) {
  const provided = String(key || "").trim();
  if (!provided) {
    return "anonymous";
  }

  const adminKey = String(env.adminApiKey || "").trim();
  const writeKey = String(env.writeApiKey || "").trim();

  if (adminKey && provided === adminKey) {
    return "admin";
  }

  if (writeKey && provided === writeKey) {
    return "write";
  }

  return "unknown";
}

export function attachAuthContext(req, _res, next) {
  const cookies = parseCookieHeader(req.header("cookie") || "");
  const sessionToken = String(cookies?.[env.authSessionCookieName] || "").trim();
  const session = verifyAdminSessionToken(sessionToken);
  if (session.ok && session.role === "admin") {
    req.auth = {
      role: "admin",
      actor: session.actor || "admin:session",
    };
    return next();
  }

  const key = String(req.header("x-admin-key") || "").trim();
  const role = resolveRoleFromKey(key);
  const actorHeader = String(req.header("x-actor") || "").trim();

  req.auth = {
    role,
    actor: actorHeader || `role:${role}`,
  };

  return next();
}

export function requireRole(allowedRoles = []) {
  return (req, _res, next) => {
    const role = req.auth?.role || "anonymous";
    if (role === "unknown" || role === "anonymous") {
      return next(unauthorized("Unauthorized write operation"));
    }

    if (!allowedRoles.includes(role)) {
      return next(forbidden("Insufficient role permissions"));
    }

    return next();
  };
}

export function validateAuthConfig(_req, _res, next) {
  const hasWrite = Boolean(String(env.writeApiKey || "").trim());
  const hasAdmin = Boolean(String(env.adminApiKey || "").trim());
  if (!hasWrite || !hasAdmin) {
    return next(badRequest("WRITE_API_KEY and ADMIN_API_KEY must be configured"));
  }
  return next();
}
