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

module.exports = { requireAuth };
