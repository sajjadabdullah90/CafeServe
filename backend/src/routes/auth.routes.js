const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { register, login, getCurrentUser } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
