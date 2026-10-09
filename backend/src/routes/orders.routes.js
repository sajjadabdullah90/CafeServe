const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createOrder, getOrders, getOrderById } = require("../controllers/orders.controller");

const router = express.Router();

router.post("/", requireAuth, createOrder);
router.get("/", requireAuth, getOrders);
router.get("/:id", requireAuth, getOrderById);

module.exports = router;
