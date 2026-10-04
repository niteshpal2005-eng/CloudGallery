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

// Configure the S3 client using credentials from .env
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Multer: store the file in memory temporarily, instead of on disk
const upload = multer({ storage: multer.memoryStorage() });

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});