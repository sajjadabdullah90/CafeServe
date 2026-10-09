const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Admin-only overview metrics.
router.get("/dashboard", requireAuth, requireAdmin, async (req, res) => {
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
router.get("/orders", requireAuth, requireAdmin, async (req, res) => {
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
router.patch("/orders/:id/status", requireAuth, requireAdmin, async (req, res) => {
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

module.exports = router;
