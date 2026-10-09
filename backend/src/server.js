require("dotenv").config();
const express = require("express");

const authRoutes = require("./routes/auth.routes");
const menuRoutes = require("./routes/menu.routes");
const orderRoutes = require("./routes/orders.routes");
const uploadRoutes = require("./routes/uploads.routes");
const adminMenuRoutes = require("./routes/admin-menu.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
const PORT = process.env.PORT || 5000;

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

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", uploadRoutes);
app.use("/api/admin", adminMenuRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`CafeServe backend running on http://localhost:${PORT}`);
});
