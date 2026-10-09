require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("./config/prisma");
const { requireAuth, requireAdmin } = require("./middleware/auth");

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
      select: { id: true, name: true, email: true, role: true, phone: true, deliveryAddress: true, createdAt: true },
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

    const user = { id: userRecord.id, name: userRecord.name, email: userRecord.email, role: userRecord.role, phone: userRecord.phone, deliveryAddress: userRecord.deliveryAddress };
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
      select: { id: true, name: true, email: true, role: true, phone: true, deliveryAddress: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ status: "error", message: "Account not found." });

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


function isValidOrderId(value) {
  return Number.isInteger(value) && value > 0;
}

// Place an order using prices fetched from the database, never client totals.
app.post("/api/orders", requireAuth, async (req, res) => {
  const deliveryAddress = typeof req.body.deliveryAddress === "string" ? req.body.deliveryAddress.trim() : "";
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];

  if (deliveryAddress.length < 8 || deliveryAddress.length > 500) {
    return res.status(400).json({ status: "error", message: "Enter a delivery address between 8 and 500 characters." });
  }
  if (!/^[+()0-9 .-]{7,25}$/.test(phone)) {
    return res.status(400).json({ status: "error", message: "Enter a valid contact phone number." });
  }
  if (requestedItems.length < 1 || requestedItems.length > 30) {
    return res.status(400).json({ status: "error", message: "Your cart must contain between 1 and 30 different items." });
  }

  const quantitiesById = new Map();
  for (const item of requestedItems) {
    const menuItemId = Number(item?.menuItemId);
    const quantity = Number(item?.quantity);
    if (!isValidOrderId(menuItemId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ status: "error", message: "Each item needs a valid menu item ID and quantity between 1 and 20." });
    }
    quantitiesById.set(menuItemId, (quantitiesById.get(menuItemId) || 0) + quantity);
    if (quantitiesById.get(menuItemId) > 20) {
      return res.status(400).json({ status: "error", message: "An item cannot have a quantity greater than 20." });
    }
  }

  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: [...quantitiesById.keys()] }, available: true },
    });
    if (menuItems.length !== quantitiesById.size) {
      return res.status(400).json({ status: "error", message: "One or more items are unavailable. Please refresh your cart." });
    }

    const menuById = new Map(menuItems.map((item) => [item.id, item]));
    const orderItems = [...quantitiesById.entries()].map(([menuItemId, quantity]) => {
      const menuItem = menuById.get(menuItemId);
      return { menuItemId, quantity, price: menuItem.price };
    });
    const totalCents = orderItems.reduce((sum, item) => {
      const priceCents = Math.round(Number(menuById.get(item.menuItemId).price) * 100);
      return sum + priceCents * item.quantity;
    }, 0);

    // Save the latest delivery details to the customer's profile and keep a snapshot on this order.
    const order = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user.userId },
        data: { phone, deliveryAddress },
      });

      return tx.order.create({
        data: {
          userId: req.user.userId,
          deliveryAddress,
          phone,
          total: (totalCents / 100).toFixed(2),
          items: { create: orderItems },
        },
        include: { items: { include: { menuItem: true } } },
      });
    });
    return res.status(201).json({ status: "success", message: "Your order has been placed.", data: order });
  } catch (error) {
    console.error("Failed to place order:", error);
    return res.status(500).json({ status: "error", message: "We could not place your order right now. Please try again." });
  }
});

// Customers can only see their own orders; admins can review all orders.
app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: req.user.role === "ADMIN" ? {} : { userId: req.user.userId },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ status: "success", count: orders.length, data: orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return res.status(500).json({ status: "error", message: "Could not load orders right now." });
  }
});

app.get("/api/orders/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidOrderId(id)) {
    return res.status(400).json({ status: "error", message: "Invalid order ID." });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } } },
    });
    if (!order) return res.status(404).json({ status: "error", message: "Order not found." });
    if (req.user.role !== "ADMIN" && order.userId !== req.user.userId) {
      return res.status(403).json({ status: "error", message: "You do not have permission to view this order." });
    }
    return res.json({ status: "success", data: order });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return res.status(500).json({ status: "error", message: "Could not load this order right now." });
  }
});

// Admin-only menu management. Items are archived rather than hard-deleted so past orders remain intact.
app.get("/api/admin/menu", requireAuth, requireAdmin, async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true, _count: { select: { orderItems: true } } },
      orderBy: [{ available: "desc" }, { name: "asc" }],
    });
    return res.json({ status: "success", count: items.length, data: items });
  } catch (error) {
    console.error("Failed to load admin menu:", error);
    return res.status(500).json({ status: "error", message: "Could not load menu items." });
  }
});

app.get("/api/admin/categories", requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return res.json({ status: "success", data: categories });
  } catch (error) {
    console.error("Failed to load categories:", error);
    return res.status(500).json({ status: "error", message: "Could not load categories." });
  }
});

app.post("/api/admin/categories", requireAuth, requireAdmin, async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ status: "error", message: "Category name must be between 2 and 60 characters." });
  }
  try {
    const category = await prisma.category.create({ data: { name } });
    return res.status(201).json({ status: "success", message: "Category created.", data: category });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ status: "error", message: "That category already exists." });
    }
    console.error("Failed to create category:", error);
    return res.status(500).json({ status: "error", message: "Could not create category." });
  }
});

function validateMenuPayload(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const price = Number(body.price);
  const categoryId = Number(body.categoryId);
  if (name.length < 2 || name.length > 100) return { error: "Food name must be between 2 and 100 characters." };
  if (description.length > 1000) return { error: "Description must be 1,000 characters or fewer." };
  if (!Number.isFinite(price) || price <= 0 || price > 9999999.99) return { error: "Enter a valid price greater than zero." };
  if (!Number.isInteger(categoryId) || categoryId < 1) return { error: "Choose a valid category." };
  if (image && (image.length > 2000 || !/^https?:\/\//i.test(image))) return { error: "Image must be a valid HTTP or HTTPS URL." };
  if (body.available !== undefined && typeof body.available !== "boolean") return { error: "Availability must be true or false." };
  return { data: { name, description: description || null, price: price.toFixed(2), image: image || null, categoryId, ...(body.available === undefined ? {} : { available: body.available }) } };
}

app.post("/api/admin/menu", requireAuth, requireAdmin, async (req, res) => {
  const validation = validateMenuPayload(req.body || {});
  if (validation.error) return res.status(400).json({ status: "error", message: validation.error });
  try {
    const category = await prisma.category.findUnique({ where: { id: validation.data.categoryId } });
    if (!category) return res.status(400).json({ status: "error", message: "Choose an existing category." });
    const item = await prisma.menuItem.create({ data: validation.data, include: { category: true } });
    return res.status(201).json({ status: "success", message: "Menu item created.", data: item });
  } catch (error) {
    console.error("Failed to create menu item:", error);
    return res.status(500).json({ status: "error", message: "Could not create this menu item." });
  }
});

app.put("/api/admin/menu/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidOrderId(id)) return res.status(400).json({ status: "error", message: "Invalid menu item ID." });
  const validation = validateMenuPayload(req.body || {});
  if (validation.error) return res.status(400).json({ status: "error", message: validation.error });
  try {
    const [existing, category] = await Promise.all([
      prisma.menuItem.findUnique({ where: { id }, select: { id: true } }),
      prisma.category.findUnique({ where: { id: validation.data.categoryId }, select: { id: true } }),
    ]);
    if (!existing) return res.status(404).json({ status: "error", message: "Menu item not found." });
    if (!category) return res.status(400).json({ status: "error", message: "Choose an existing category." });
    const item = await prisma.menuItem.update({ where: { id }, data: validation.data, include: { category: true } });
    return res.json({ status: "success", message: "Menu item updated.", data: item });
  } catch (error) {
    console.error("Failed to update menu item:", error);
    return res.status(500).json({ status: "error", message: "Could not update this menu item." });
  }
});

// Archive instead of deleting: order history must keep its referenced menu item.
app.delete("/api/admin/menu/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidOrderId(id)) return res.status(400).json({ status: "error", message: "Invalid menu item ID." });
  try {
    const existing = await prisma.menuItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ status: "error", message: "Menu item not found." });
    const item = await prisma.menuItem.update({
      where: { id },
      data: { available: false },
      include: { category: true },
    });
    return res.json({ status: "success", message: "Menu item archived and hidden from customers.", data: item });
  } catch (error) {
    console.error("Failed to archive menu item:", error);
    return res.status(500).json({ status: "error", message: "Could not archive this menu item." });
  }
});

// Admin-only overview metrics.
app.get("/api/admin/dashboard", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [totalOrders, pendingOrders, completedOrders, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] } } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { total: true } }),
    ]);

    return res.json({
      status: "success",
      data: {
        totalOrders,
        activeOrders: pendingOrders,
        completedOrders,
        completedRevenue: Number(revenue._sum.total || 0),
      },
    });
  } catch (error) {
    console.error("Failed to load admin dashboard:", error);
    return res.status(500).json({ status: "error", message: "Could not load dashboard metrics." });
  }
});

// Admin-only order queue, including customer contact information.
app.get("/api/admin/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ status: "success", count: orders.length, data: orders });
  } catch (error) {
    console.error("Failed to load admin orders:", error);
    return res.status(500).json({ status: "error", message: "Could not load orders." });
  }
});

// Update an order's lifecycle status. The server validates allowed states.
app.patch("/api/admin/orders/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const allowedStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
  const nextStatus = typeof req.body.status === "string" ? req.body.status.toUpperCase() : "";

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ status: "error", message: "Invalid order ID." });
  }
  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({ status: "error", message: "Choose a valid order status." });
  }

  try {
    const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ status: "error", message: "Order not found." });

    const order = await prisma.order.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { menuItem: true } },
      },
    });
    return res.json({ status: "success", message: "Order status updated.", data: order });
  } catch (error) {
    console.error("Failed to update order status:", error);
    return res.status(500).json({ status: "error", message: "Could not update this order." });
  }
});

app.listen(PORT, () => {
  console.log(`CafeServe backend running on http://localhost:${PORT}`);
});
