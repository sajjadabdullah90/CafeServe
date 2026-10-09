const express = require("express");
const prisma = require("./config/prisma");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "CafeServe backend is running",
  });
});

// Get all available menu items
app.get("/api/menu", async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { available: true },
      include: { category: true },
      orderBy: { name: "asc" },
    });

    res.json({
      status: "success",
      count: menuItems.length,
      data: menuItems,
    });
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch menu items",
    });
  }
});

// Get a single available menu item
app.get("/api/menu/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      status: "error",
      message: "Invalid menu item ID",
    });
  }

  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!menuItem || !menuItem.available) {
      return res.status(404).json({
        status: "error",
        message: "Menu item not found",
      });
    }

    res.json({
      status: "success",
      data: menuItem,
    });
  } catch (error) {
    console.error("Failed to fetch menu item:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch menu item",
    });
  }
});

app.listen(PORT, () => {
  console.log(`CafeServe backend running on http://localhost:${PORT}`);
});
