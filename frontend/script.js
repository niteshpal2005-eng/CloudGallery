const imageInput = document.getElementById("imageInput");
const API_URL = "http://18.209.55.167/api/images";
const uploadBtn = document.getElementById("uploadBtn");
const loadingText = document.getElementById("loadingText");
const errorMessage = document.getElementById("errorMessage");
const gallery = document.getElementById("gallery");
const emptyMessage = document.getElementById("emptyMessage");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const previewRow = document.getElementById("previewRow");
const previewThumbs = document.getElementById("previewThumbs");
const previewName = document.getElementById("previewName");
const imageCount = document.getElementById("imageCount");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

const DEFAULT_HINT = "PNG, JPG, GIF or WEBP · max 5 MB";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

let imageTotal = 0;
let selectedFiles = [];
let errorTimer = null;

// ===== Error banner =====
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  clearTimeout(errorTimer);
  errorTimer = setTimeout(hideError, 8000); // hides itself after 8 seconds
}

function hideError() {
  errorMessage.classList.add("hidden");
  errorMessage.textContent = "";
}

// Read the server's JSON error message, or fall back to a default
async function getServerError(response, fallback) {
  try {
    const data = await response.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

// ===== Lightbox =====
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  lightboxImg.src = "";
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox(); // only close if clicking the dark backdrop, not the image
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ===== Gallery =====
async function loadGallery() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(await getServerError(response, "Could not load images"));
    }
    const images = await response.json();

    gallery.innerHTML = "";
    imageTotal = 0;

    if (images.length === 0) {
      emptyMessage.classList.remove("hidden");
    } else {
      emptyMessage.classList.add("hidden");
      images.forEach((image) => {
        renderImageCard(image.url, image.filename);
      });
    }

    updateImageCount();
  } catch (error) {
    console.error("Failed to load images:", error);
    showError("Could not load your gallery. Check your connection and refresh.");
  }
}

// Load the gallery as soon as the page opens
loadGallery();

// ===== Choosing files =====
imageInput.addEventListener("change", () => {
  hideError();
  const chosen = Array.from(imageInput.files);
  if (chosen.length === 0) return;

  // Check type and size in the browser first (the server checks again)
  const problems = [];
  selectedFiles = chosen.filter((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      problems.push(`${file.name}: only PNG, JPG, GIF and WEBP are allowed`);
      return false;
    }
    if (file.size > MAX_SIZE) {
      problems.push(`${file.name}: larger than 5 MB`);
      return false;
    }
    return true;
  });

  if (problems.length > 0) {
    showError("Skipped: " + problems.join("; "));
  }

  if (selectedFiles.length === 0) {
    previewRow.classList.add("hidden");
    fileNameDisplay.textContent = DEFAULT_HINT;
    imageInput.value = "";
    return;
  }

  renderPreviewThumbs();
  previewRow.classList.remove("hidden");
  fileNameDisplay.textContent = "Selected — ready to upload";
});

function renderPreviewThumbs() {
  previewThumbs.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "preview-thumb-wrapper";

    const thumb = document.createElement("img");
    thumb.src = URL.createObjectURL(file);

    const removeBtn = document.createElement("button");
    removeBtn.className = "preview-thumb-remove";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      renderPreviewThumbs();

      if (selectedFiles.length === 0) {
        previewRow.classList.add("hidden");
        fileNameDisplay.textContent = DEFAULT_HINT;
        imageInput.value = "";
      }
    });

    wrapper.appendChild(thumb);
    wrapper.appendChild(removeBtn);
    previewThumbs.appendChild(wrapper);
  });

  previewName.textContent = `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} selected`;
}

// ===== Uploading =====
uploadBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) {
    showError("Please choose at least one image first.");
    return;
  }

  hideError();
  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading…";
  loadingText.classList.remove("hidden");

  const failures = [];

  for (const file of selectedFiles) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await getServerError(response, "Upload failed");
        failures.push(`${file.name}: ${message}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      failures.push(`${file.name}: could not reach the server`);
    }
  }

  await loadGallery(); // show the real, updated list from the server

  if (failures.length > 0) {
    showError(failures.join(" | ")); // shown after loadGallery so it isn't cleared
  }

  uploadBtn.disabled = false;
  uploadBtn.textContent = "Upload Images";
  loadingText.classList.add("hidden");
  previewRow.classList.add("hidden");
  previewThumbs.innerHTML = "";
  fileNameDisplay.textContent = DEFAULT_HINT;
  imageInput.value = "";
  selectedFiles = [];
});

// ===== Cards and delete =====
function renderImageCard(imageURL, filename) {
  const card = document.createElement("div");
  card.className = "image-card";

  const img = document.createElement("img");
  img.src = imageURL;
  card.addEventListener("click", () => openLightbox(img.src));

  const overlay = document.createElement("div");
  overlay.className = "image-overlay";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Remove";
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await deleteImage(filename, card);
  });

  overlay.appendChild(deleteBtn);
  card.appendChild(img);
  card.appendChild(overlay);
  gallery.appendChild(card);

  imageTotal++;
}

function updateImageCount() {
  imageCount.textContent = `${imageTotal} image${imageTotal === 1 ? "" : "s"}`;
}

async function deleteImage(filename, card) {
  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await getServerError(response, "Delete failed"));
    }

    card.remove();
    imageTotal--;
    updateImageCount();

    if (gallery.children.length === 0) {
      emptyMessage.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Failed to delete image:", error);
    showError("Could not delete the image. Please try again.");
  }
}