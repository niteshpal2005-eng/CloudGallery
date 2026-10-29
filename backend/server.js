require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure the S3 client. Credentials come from the default chain:
// .env keys on a laptop, or the IAM Role when running on EC2
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Multer: store the file in memory temporarily, instead of on disk
// Only these image types are allowed
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

// Multer: keep the file in memory, limit size to 5 MB, accept images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, GIF and WEBP images are allowed"));
    }
  },
});

// Test route
app.get("/", (req, res) => {
  res.send("CloudGallery backend is running ✅ (connected to S3)");
});

// UPLOAD — POST /api/images
app.post("/api/images", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const key = `${Date.now()}-${req.file.originalname}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    res.status(201).json({
      message: "Image uploaded successfully",
      filename: key,
      url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// LIST — GET /api/images
app.get("/api/images", async (req, res) => {
  try {
    const data = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET_NAME })
    );

    const images = (data.Contents || []).map((item) => ({
      filename: item.Key,
      url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
    }));

    res.status(200).json(images);
  } catch (error) {
    console.error("S3 list error:", error);
    res.status(500).json({ error: "Could not list images" });
  }
});

// DELETE — DELETE /api/images/:filename
app.delete("/api/images/:filename", async (req, res) => {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: req.params.filename,
      })
    );

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("S3 delete error:", error);
    res.status(404).json({ error: "Image not found" });
  }
});


// Error handler: turns upload rejections into clean JSON messages
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum size is 5 MB" });
  }
  if (err.message && err.message.startsWith("Only PNG")) {
    return res.status(400).json({ error: err.message });
  }
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});