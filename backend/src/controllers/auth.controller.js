const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "cafeserve-local-development-secret-change-before-deploy";

async function register(req, res) {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ status: "error", message: "Name must be between 2 and 80 characters." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ status: "error", message: "Enter a valid email address." });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ status: "error", message: "Password must be between 8 and 72 characters." });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ status: "error", message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, isActive: true, phone: true, deliveryAddress: true, createdAt: true },
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ status: "success", message: "Account created successfully.", token, data: user });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ status: "error", message: "An account with this email already exists." });
    }
    console.error("Registration failed:", error);
    return res.status(500).json({ status: "error", message: "Could not create your account right now." });
  }
}

async function login(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email and password are required." });
  }

  try {
    const userRecord = await prisma.user.findUnique({ where: { email } });
    if (!userRecord || !(await bcrypt.compare(password, userRecord.password))) {
      return res.status(401).json({ status: "error", message: "Email or password is incorrect." });
    }
    if (!userRecord.isActive) {
      return res.status(403).json({ status: "error", message: "This account has been disabled. Please contact CafeServe support." });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      isActive: userRecord.isActive,
      phone: userRecord.phone,
      deliveryAddress: userRecord.deliveryAddress,
    };
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ status: "success", message: "Welcome back.", token, data: user });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ status: "error", message: "Could not sign you in right now." });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true, phone: true, deliveryAddress: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ status: "error", message: "Account not found." });
    if (!user.isActive) return res.status(403).json({ status: "error", message: "This account has been disabled. Please contact CafeServe support." });

    // For existing customers, reuse details from their most recent order until a profile save exists.
    const latestOrder = (!user.phone || !user.deliveryAddress)
      ? await prisma.order.findFirst({
          where: { userId: req.user.userId },
          orderBy: { createdAt: "desc" },
          select: { phone: true, deliveryAddress: true },
        })
      : null;
    const account = {
      ...user,
      phone: user.phone || latestOrder?.phone || null,
      deliveryAddress: user.deliveryAddress || latestOrder?.deliveryAddress || null,
    };
    return res.json({ status: "success", data: account });
  } catch (error) {
    console.error("Failed to load account:", error);
    return res.status(500).json({ status: "error", message: "Could not load your account." });
  }
}

module.exports = { register, login, getCurrentUser };
