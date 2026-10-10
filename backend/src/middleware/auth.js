const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ status: "error", message: "Please sign in to continue." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ status: "error", message: "Your session is invalid or has expired. Please sign in again." });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, isActive: true },
    });
    if (!currentUser) {
      return res.status(401).json({ status: "error", message: "Account not found. Please sign in again." });
    }
    if (!currentUser.isActive) {
      return res.status(403).json({ status: "error", message: "This account has been disabled. Contact CafeServe support." });
    }
    return next();
  } catch (error) {
    console.error("Failed to verify account status:", error);
    return res.status(500).json({ status: "error", message: "Could not verify your account status. Please try again." });
  }
}

// Verify the current database role instead of trusting a role claim that may be stale.
async function requireAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user) {
      return res.status(401).json({ status: "error", message: "Account not found. Please sign in again." });
    }
    if (!user.isActive) {
      return res.status(403).json({ status: "error", message: "This account has been disabled." });
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
