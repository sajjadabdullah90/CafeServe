require("dotenv").config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes("REPLACE_WITH")) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters before starting CafeServe.");
}

const express = require("express");

const authRoutes = require("./routes/auth.routes");
const menuRoutes = require("./routes/menu.routes");
const orderRoutes = require("./routes/orders.routes");
const uploadRoutes = require("./routes/uploads.routes");
const adminMenuRoutes = require("./routes/admin-menu.routes");
const adminRoutes = require("./routes/admin.routes");
const usersRoutes = require("./routes/users.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Vercel terminates TLS and forwards requests through its proxy.
app.set("trust proxy", 1);

// Baseline API security headers. HSTS is only sent in production over HTTPS.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(express.json({ limit: "1mb" }));

// Best-effort per-instance limiter for sign-in and account creation.
// For multi-instance/serverless production, use a shared store (e.g. Redis/WAF).
const authAttempts = new Map();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 10;
app.use("/api/auth", (req, res, next) => {
  if (req.method !== "POST" || !["/login", "/register"].includes(req.path)) return next();

  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  let record = authAttempts.get(key);
  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: now + AUTH_WINDOW_MS };
  }
  record.count += 1;
  authAttempts.set(key, record);

  // Keep the in-memory map bounded against unbounded unique IPs.
  if (authAttempts.size > 5000) {
    for (const [ip, entry] of authAttempts) {
      if (now >= entry.resetAt) authAttempts.delete(ip);
    }
  }

  res.setHeader("RateLimit-Limit", String(AUTH_MAX_ATTEMPTS));
  res.setHeader("RateLimit-Remaining", String(Math.max(0, AUTH_MAX_ATTEMPTS - record.count)));
  if (record.count > AUTH_MAX_ATTEMPTS) {
    res.setHeader("Retry-After", String(Math.ceil((record.resetAt - now) / 1000)));
    return res.status(429).json({ status: "error", message: "Too many sign-in or registration attempts. Please try again later." });
  }
  next();
});

// Allow local development origins and the deployed frontend origin(s).
// FRONTEND_URL may contain one origin or a comma-separated list of origins.
app.use((req, res, next) => {
  const configuredOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...configuredOrigins,
  ];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "success", message: "CafeServe backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", uploadRoutes);
app.use("/api/admin", adminMenuRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", usersRoutes);

// Vercel imports the Express app as a serverless function; local development
// still starts the regular HTTP server.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CafeServe backend running on http://localhost:${PORT}`);
  });
}

// Keep parser and unexpected middleware errors in a consistent JSON shape.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ status: "error", message: "Request body is too large." });
  }
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ status: "error", message: "Request body must contain valid JSON." });
  }
  console.error("Unhandled request error:", error);
  return res.status(500).json({ status: "error", message: "An unexpected server error occurred." });
});

module.exports = app;
