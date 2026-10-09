const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function isValidOrderId(value) {
  return Number.isInteger(value) && value > 0;
}

// Admin-only menu management. Items are archived rather than hard-deleted so past orders remain intact.
router.get("/menu", requireAuth, requireAdmin, async (req, res) => {
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

router.get("/categories", requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return res.json({ status: "success", data: categories });
  } catch (error) {
    console.error("Failed to load categories:", error);
    return res.status(500).json({ status: "error", message: "Could not load categories." });
  }
});

router.post("/categories", requireAuth, requireAdmin, async (req, res) => {
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

router.post("/menu", requireAuth, requireAdmin, async (req, res) => {
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

router.put("/menu/:id", requireAuth, requireAdmin, async (req, res) => {
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
router.delete("/menu/:id", requireAuth, requireAdmin, async (req, res) => {
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

module.exports = router;
