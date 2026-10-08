const express = require("express");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "CafeServe backend is running",
  });
});

app.listen(PORT, () => {
  console.log(`CafeServe backend running on http://localhost:${PORT}`);
});