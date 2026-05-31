import crypto from "node:crypto";
import { Router } from "express";
import { env } from "../config/env.js";
import {
  buildAuthCookieValue,
  buildClearAuthCookieValue,
  createAdminSessionToken,
} from "../utils/adminSession.js";
import { badRequest, unauthorized } from "../utils/httpErrors.js";

const router = Router();

function safeEquals(left, right) {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

router.get("/session", (req, res) => {
  const role = req.auth?.role || "anonymous";
  return res.json({
    authenticated: role === "admin",
    role,
    actor: req.auth?.actor || null,
  });
});

router.post("/admin/login", (req, res, next) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "").trim();

    if (!password) {
      throw badRequest("Password is required");
    }

    const expectedUser = String(env.adminPortalUser || "admin").trim();
    const expectedPassword = String(env.adminPortalPassword || env.adminApiKey || "").trim();
    if (!expectedPassword) {
      throw badRequest("ADMIN_PORTAL_PASSWORD or ADMIN_API_KEY must be configured");
    }

    const userMatches = username ? safeEquals(username.toLowerCase(), expectedUser.toLowerCase()) : true;
    const passwordMatches = safeEquals(password, expectedPassword);

    if (!userMatches || !passwordMatches) {
      throw unauthorized("Credenciales invalidas");
    }

    const actor = username || expectedUser || "admin";
    const token = createAdminSessionToken({ actor: `admin:${actor}` });
    res.setHeader("Set-Cookie", buildAuthCookieValue(token));

    return res.json({ authenticated: true, role: "admin", actor: `admin:${actor}` });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/logout", (_req, res) => {
  res.setHeader("Set-Cookie", buildClearAuthCookieValue());
  return res.json({ authenticated: false });
});

export default router;
