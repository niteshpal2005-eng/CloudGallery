const imageInput = document.getElementById("imageInput");
const API_URL = "http://localhost:5000/api/images";
const uploadBtn = document.getElementById("uploadBtn");
const loadingText = document.getElementById("loadingText");
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


// Fetch and display all images from the backend
async function loadGallery() {
  try {
    const response = await fetch(API_URL);
    const images = await response.json();

    gallery.innerHTML = ""; // clear anything currently shown
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
  }
}

// Load the gallery as soon as the page opens
loadGallery();

let imageTotal = 0;
let selectedFiles = [];

// Show a preview as soon as a file is chosen — before uploading
imageInput.addEventListener("change", () => {
  selectedFiles = Array.from(imageInput.files);
  if (selectedFiles.length === 0) return;

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
      selectedFiles.splice(index, 1); // remove just this one file from the array
      renderPreviewThumbs(); // rebuild the thumbnail row

      if (selectedFiles.length === 0) {
        previewRow.classList.add("hidden");
        fileNameDisplay.textContent = "PNG or JPG";
        imageInput.value = "";
      } else {
        previewName.textContent = `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} selected`;
      }
    });

    wrapper.appendChild(thumb);
    wrapper.appendChild(removeBtn);
    previewThumbs.appendChild(wrapper);
  });

  previewName.textContent = `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} selected`;
}

uploadBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) {
    alert("Please choose at least one image first.");
    return;
  }

  loadingText.classList.remove("hidden");

  try {
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed for " + file.name);
      }
    }

    await loadGallery(); // refresh the gallery with the real, updated list from the server
  } catch (error) {
    console.error("Upload error:", error);
    alert("Something went wrong while uploading. Please try again.");
  } finally {
    loadingText.classList.add("hidden");
    previewRow.classList.add("hidden");
    previewThumbs.innerHTML = "";
    fileNameDisplay.textContent = "PNG or JPG";
    imageInput.value = "";
    selectedFiles = [];
  }
});

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
      throw new Error("Delete failed");
    }

    card.remove();
    imageTotal--;
    updateImageCount();

    if (gallery.children.length === 0) {
      emptyMessage.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Failed to delete image:", error);
    alert("Could not delete image. Please try again.");
  }
}