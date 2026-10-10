const prisma = require("../config/prisma");

function isValidOrderId(value) {
  return Number.isInteger(value) && value > 0;
}

// Place an order using prices fetched from the database, never client totals.
async function createOrder(req, res) {
  const deliveryAddress = typeof req.body?.deliveryAddress === "string" ? req.body.deliveryAddress.trim() : "";
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const requestedItems = Array.isArray(req.body?.items) ? req.body.items : [];

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
}

// Customers can only see their own orders; admins can review all orders.
async function getOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: req.user.role === "ADMIN" ? {} : { userId: req.user.userId },
      include: { user: { select: { name: true, email: true } }, items: { include: { menuItem: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ status: "success", count: orders.length, data: orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return res.status(500).json({ status: "error", message: "Could not load orders right now." });
  }
}

async function getOrderById(req, res) {
  const id = Number(req.params.id);
  if (!isValidOrderId(id)) {
    return res.status(400).json({ status: "error", message: "Invalid order ID." });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } }, items: { include: { menuItem: true } } },
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
}

module.exports = { createOrder, getOrders, getOrderById };
