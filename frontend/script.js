const imageInput = document.getElementById("imageInput");
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

// Upload button (still simulated locally — real backend connects on Day 4)
uploadBtn.addEventListener("click", () => {
  if (selectedFiles.length === 0) {
    alert("Please choose at least one image first.");
    return;
  }

  loadingText.classList.remove("hidden");

  setTimeout(() => {
    selectedFiles.forEach((file) => {
      addImageToGallery(URL.createObjectURL(file));
    });

    loadingText.classList.add("hidden");
    previewRow.classList.add("hidden");
    previewThumbs.innerHTML = "";
    fileNameDisplay.textContent = "PNG or JPG";
    imageInput.value = "";
    selectedFiles = [];
  }, 600);
});

function addImageToGallery(imageURL) {
  emptyMessage.classList.add("hidden");

  const card = document.createElement("div");
  card.className = "image-card";
  card.addEventListener("click", () => openLightbox(img.src));

  const img = document.createElement("img");
  img.src = imageURL;

  const overlay = document.createElement("div");
  overlay.className = "image-overlay";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Remove";
    deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    card.remove();
    imageTotal--;
    updateImageCount();
    if (gallery.children.length === 0) {
      emptyMessage.classList.remove("hidden");
    }
  });

  overlay.appendChild(deleteBtn);
  card.appendChild(img);
  card.appendChild(overlay);
  gallery.appendChild(card);

  imageTotal++;
  updateImageCount();
}

function updateImageCount() {
  imageCount.textContent = `${imageTotal} image${imageTotal === 1 ? "" : "s"}`;
}