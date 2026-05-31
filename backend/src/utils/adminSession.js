import crypto from "node:crypto";
import { env } from "../config/env.js";

const TOKEN_VERSION = "v1";

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadEncoded) {
  return crypto
    .createHmac("sha256", String(env.authSessionSecret || ""))
    .update(payloadEncoded)
    .digest("base64url");
}

export function createAdminSessionToken({ actor = "admin" } = {}) {
  const ttlHours = Number.isFinite(env.authSessionTtlHours) && env.authSessionTtlHours > 0
    ? env.authSessionTtlHours
    : 12;

  const now = Date.now();
  const exp = now + ttlHours * 60 * 60 * 1000;
  const payload = {
    v: TOKEN_VERSION,
    role: "admin",
    actor,
    iat: now,
    exp,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  const raw = String(token || "").trim();
  if (!raw || !raw.includes(".")) {
    return { ok: false, reason: "missing" };
  }

  const [payloadEncoded, signature] = raw.split(".");
  if (!payloadEncoded || !signature) {
    return { ok: false, reason: "invalid_format" };
  }

  const expected = signPayload(payloadEncoded);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return { ok: false, reason: "bad_signature" };
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payloadEncoded));
    const now = Date.now();
    if (decoded?.v !== TOKEN_VERSION || decoded?.role !== "admin") {
      return { ok: false, reason: "invalid_payload" };
    }

    if (!Number.isFinite(decoded?.exp) || decoded.exp <= now) {
      return { ok: false, reason: "expired" };
    }

    return {
      ok: true,
      role: "admin",
      actor: String(decoded?.actor || "admin"),
      exp: decoded.exp,
      iat: decoded.iat,
    };
  } catch (_error) {
    return { ok: false, reason: "invalid_json" };
  }
}

export function parseCookieHeader(cookieHeader) {
  const raw = String(cookieHeader || "").trim();
  if (!raw) return {};

  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const separator = pair.indexOf("=");
      if (separator <= 0) return acc;
      const key = decodeURIComponent(pair.slice(0, separator).trim());
      const value = decodeURIComponent(pair.slice(separator + 1).trim());
      if (!key) return acc;
      acc[key] = value;
      return acc;
    }, {});
}

export function buildAuthCookieValue(token) {
  const maxAge = Math.max(60, Math.floor((Number(env.authSessionTtlHours || 12) * 60 * 60)));
  const sameSiteValue = env.isProduction ? "None" : "Lax";
  const parts = [
    `${env.authSessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSiteValue}`,
    `Max-Age=${maxAge}`,
  ];

  if (env.isProduction) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function buildClearAuthCookieValue() {
  const sameSiteValue = env.isProduction ? "None" : "Lax";
  const parts = [
    `${env.authSessionCookieName}=`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSiteValue}`,
    "Max-Age=0",
  ];

  if (env.isProduction) {
    parts.push("Secure");
  }

  return parts.join("; ");
}
