import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import examsRoutes from "./routes/examsRoutes.js";
import promotionsRoutes from "./routes/promotionsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { env } from "./config/env.js";
import { dbHealthcheck } from "./db/pool.js";
import { HttpError } from "./utils/httpErrors.js";
import { attachAuthContext } from "./middleware/requireWriteAuth.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "..", "uploads");

function normalizeOrigin(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    return new URL(raw).origin;
  } catch (_error) {
    return raw.replace(/\/+$/, "");
  }
}

const allowedOrigins = String(env.corsOrigin || "")
  .split(",")
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

function isLocalLikeOrigin(origin) {
  const raw = String(origin || "").trim();
  if (!raw) return false;

  // Browsers send Origin: null when opening frontend from file://
  if (raw === "null" || raw.startsWith("file://")) {
    return true;
  }

  try {
    const parsed = new URL(raw);
    const host = String(parsed.hostname || "").toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch (_error) {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      // Non-browser requests may not send Origin (curl/server-to-server).
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (!env.isProduction) {
      // In non-production, allow dynamic local testing origins.
      callback(null, normalizedOrigin);
      return;
    }

    if (
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(normalizedOrigin) ||
      isLocalLikeOrigin(origin)
    ) {
      // Reflect explicit request origin to support credentialed requests.
      callback(null, normalizedOrigin);
      return;
    }

    callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(attachAuthContext);
app.use("/uploads", express.static(uploadsDir));

app.get("/health", async (_req, res) => {
  try {
    const dbOk = await dbHealthcheck();
    res.json({ ok: true, db: dbOk, env: env.nodeEnv });
  } catch (_error) {
    res.status(500).json({ ok: false, db: false, env: env.nodeEnv });
  }
});

app.use("/api/exams", examsRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details || undefined,
    });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
