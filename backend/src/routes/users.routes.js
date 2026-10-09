const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { listUsers, createUser, updateUserRole, updateUserStatus, deleteUser } = require("../controllers/users.controller");

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

module.exports = router;
