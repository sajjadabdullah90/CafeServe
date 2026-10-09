const prisma = require("../config/prisma");

async function getMenuItems(req, res) {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { available: true },
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return res.json({ status: "success", count: menuItems.length, data: menuItems });
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    return res.status(500).json({ status: "error", message: "Failed to fetch menu items" });
  }
}

async function getMenuItemById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ status: "error", message: "Invalid menu item ID" });
  }

  try {
    const menuItem = await prisma.menuItem.findUnique({ where: { id }, include: { category: true } });
    if (!menuItem || !menuItem.available) {
      return res.status(404).json({ status: "error", message: "Menu item not found" });
    }
    return res.json({ status: "success", data: menuItem });
  } catch (error) {
    console.error("Failed to fetch menu item:", error);
    return res.status(500).json({ status: "error", message: "Failed to fetch menu item" });
  }
}

module.exports = { getMenuItems, getMenuItemById };
