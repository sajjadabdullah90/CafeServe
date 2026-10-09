const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("node:stream");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Admin-only, size-limited menu-image uploads stored in Cloudinary.
const menuImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return callback(new Error("Choose a JPG, PNG, or WebP image."));
    callback(null, true);
  },
});

function parseMenuImage(req, res, next) {
  menuImageUpload.single("image")(req, res, (error) => {
    if (!error) return next();
    const message = error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller." : error.message || "Could not read the uploaded image.";
    return res.status(400).json({ status: "error", message });
  });
}

function hasValidImageSignature(buffer, mimeType) {
  if (!buffer || buffer.length < 12) return false;
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
}

router.post("/uploads/menu-image", requireAuth, requireAdmin, parseMenuImage, async (req, res) => {
  if (!req.file) return res.status(400).json({ status: "error", message: "Choose an image to upload." });
  if (!hasValidImageSignature(req.file.buffer, req.file.mimetype)) return res.status(400).json({ status: "error", message: "The file contents do not match a supported image type." });
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return res.status(503).json({ status: "error", message: "Image uploads are not configured yet. Add the Cloudinary credentials to backend/.env and restart the server." });
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  try {
    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "cafeserve/menu", resource_type: "image", allowed_formats: ["jpg", "jpeg", "png", "webp"] }, (error, result) => error ? reject(error) : resolve(result));
      Readable.from(req.file.buffer).pipe(stream);
    });
    return res.status(201).json({ status: "success", message: "Menu image uploaded.", data: { url: uploaded.secure_url, publicId: uploaded.public_id } });
  } catch (error) {
    console.error("Cloudinary menu image upload failed:", error.message);
    return res.status(502).json({ status: "error", message: "Cloudinary could not upload this image. Please try again." });
  }
});

module.exports = router;
