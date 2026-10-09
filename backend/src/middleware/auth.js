const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

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

// Verify the current database role instead of trusting a role claim that may be stale.
async function requireAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { id: true, role: true },
    });
    if (!user) {
      return res.status(401).json({ status: "error", message: "Account not found. Please sign in again." });
    }
    req.user.role = user.role;
    if (user.role !== "ADMIN") {
      return res.status(403).json({ status: "error", message: "Admin access is required to perform this action." });
    }
    return next();
  } catch (error) {
    console.error("Failed to verify administrator role:", error);
    return res.status(500).json({ status: "error", message: "Could not verify administrator access." });
  }
}

module.exports = { requireAuth, requireAdmin };
