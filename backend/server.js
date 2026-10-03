const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Make sure the uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded images as static files (so the browser can display them)
app.use("/uploads", express.static(uploadsDir));

// Configure multer: where to save files, and how to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Test route
app.get("/", (req, res) => {
  res.send("CloudGallery backend is running ✅");
});

// UPLOAD — POST /api/images
app.post("/api/images", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.status(201).json({
    message: "Image uploaded successfully",
    filename: req.file.filename,
    url: `http://localhost:${PORT}/uploads/${req.file.filename}`,
  });
});

// LIST — GET /api/images
app.get("/api/images", (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Could not list images" });
    }

    const images = files.map((filename) => ({
      filename,
      url: `http://localhost:${PORT}/uploads/${filename}`,
    }));

    res.status(200).json(images);
  });
});

// DELETE — DELETE /api/images/:filename
app.delete("/api/images/:filename", (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.status(200).json({ message: "Image deleted successfully" });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});