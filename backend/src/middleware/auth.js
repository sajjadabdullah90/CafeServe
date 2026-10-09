const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "cafeserve-local-development-secret-change-before-deploy";

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ status: "error", message: "Please sign in to continue." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ status: "error", message: "Your session is invalid or has expired. Please sign in again." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ status: "error", message: "Admin access is required to perform this action." });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
