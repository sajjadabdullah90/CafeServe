const express = require("express");
const { getMenuItems, getMenuItemById } = require("../controllers/menu.controller");

const router = express.Router();

// Public menu endpoints; request logic lives in the controller.
router.get("/", getMenuItems);
router.get("/:id", getMenuItemById);

module.exports = router;
