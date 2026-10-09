const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("./config/prisma");
const { requireAuth } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "cafeserve-local-development-secret-change-before-deploy";

app.use(express.json());

// Allow the local Vite frontend to call the API during development.
app.use((req, res, next) => {
  const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "success", message: "CafeServe backend is running" });
});

// Register a customer account. Public registration never accepts a role.
app.post("/api/auth/register", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

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
      select: { id: true, name: true, email: true, role: true, createdAt: true },
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
});

// Sign in with an existing customer or admin account.
app.post("/api/auth/login", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email and password are required." });
  }

  try {
    const userRecord = await prisma.user.findUnique({ where: { email } });
    if (!userRecord || !(await bcrypt.compare(password, userRecord.password))) {
      return res.status(401).json({ status: "error", message: "Email or password is incorrect." });
    }

    const user = { id: userRecord.id, name: userRecord.name, email: userRecord.email, role: userRecord.role };
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ status: "success", message: "Welcome back.", token, data: user });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ status: "error", message: "Could not sign you in right now." });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ status: "error", message: "Account not found." });
    return res.json({ status: "success", data: user });
  } catch (error) {
    console.error("Failed to load account:", error);
    return res.status(500).json({ status: "error", message: "Could not load your account." });
  }
});

// Get all available menu items.
app.get("/api/menu", async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { available: true },
      include: { category: true },
      orderBy: { name: "asc" },
    });
    res.json({ status: "success", count: menuItems.length, data: menuItems });
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch menu items" });
  }
});

app.get("/api/menu/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ status: "error", message: "Invalid menu item ID" });
  }

  try {
    const menuItem = await prisma.menuItem.findUnique({ where: { id }, include: { category: true } });
    if (!menuItem || !menuItem.available) {
      return res.status(404).json({ status: "error", message: "Menu item not found" });
    }
    res.json({ status: "success", data: menuItem });
  } catch (error) {
    console.error("Failed to fetch menu item:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch menu item" });
  }
});

app.listen(PORT, () => {
  console.log(`CafeServe backend running on http://localhost:${PORT}`);
});
