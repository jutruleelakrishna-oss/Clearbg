import { removeBackground } from "@imgly/background-removal";

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const previewCard = document.getElementById("previewCard");
const preview = document.getElementById("preview");
const removeButton = document.getElementById("removeButton");
const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");

let selectedFile = null;
let resultBlob = null;
let originalPreviewUrl = null;
let resultUrl = null;

const IMG_LY_PATH =
  "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";

function status(message) {
  const existing = document.getElementById("status");
  if (existing) {
    existing.textContent = message;
  } else {
    console.log(message);
  }
}

function showError(message) {
  console.error(message);
  status("Error: " + message);
  alert("Error: " + message);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The image could not be decoded by this browser."));
    };

    img.src = url;
  });
}

async function convertToPNG(file) {
  const type = (file.type || "").toLowerCase();

  if (!type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  const img = await loadImage(file);

  if (!img.naturalWidth || !img.naturalHeight) {
    throw new Error("The selected image has invalid dimensions.");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false
  });

  if (!ctx) {
    throw new Error("Your browser could not create an image canvas.");
  }

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) {
          resolve(value);
        } else {
          reject(new Error("The image could not be converted to PNG."));
        }
      },
      "image/png"
    );
  });

  return new File(
    [blob],
    "krishna-ai-studio-input.png",
    {
      type: "image/png",
      lastModified: Date.now()
    }
  );
}

function displayPreview(file) {
  if (originalPreviewUrl) {
    URL.revokeObjectURL(originalPreviewUrl);
  }

  originalPreviewUrl = URL.createObjectURL(file);

  preview.src = originalPreviewUrl;
  preview.alt = "Selected image";

  previewCard.classList.add("visible");
  previewCard.classList.add("show");

  downloadButton.style.display = "none";
  downloadButton.disabled = true;

  resultBlob = null;

  status("Image selected.");
}

async function handleFile(file) {
  if (!file) return;

  if (!file.type || !file.type.startsWith("image/")) {
    showError("Please select a valid image.");
    return;
  }

  try {
    selectedFile = file;
    displayPreview(file);

    removeButton.disabled = false;
    resetButton.disabled = false;
  } catch (error) {
    showError(error.message || "The selected file could not be read.");
  }
}

async function processImage() {
  if (!selectedFile) {
    showError("Please select an image first.");
    return;
  }

  try {
    removeButton.disabled = true;
    downloadButton.style.display = "none";
    downloadButton.disabled = true;

    status("Preparing image...");

    const inputFile = await convertToPNG(selectedFile);

    status("Starting AI background removal...");

    const outputBlob = await removeBackground(inputFile, {
      debug: false,
      model: "isnet_quint8",
      device: "cpu",
      publicPath: IMG_LY_PATH,

      progress: (key, current, total) => {
        if (total > 0) {
          const percent = Math.round((current / total) * 100);
          status("Removing background... " + percent + "%");
        } else {
          status("Removing background...");
        }
      }
    });

    if (!outputBlob) {
      throw new Error("Background removal returned no image.");
    }

    resultBlob = outputBlob;

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    resultUrl = URL.createObjectURL(resultBlob);

    preview.src = resultUrl;
    preview.alt = "Background removed image";

    downloadButton.style.display = "block";
    downloadButton.disabled = false;

    status("Background removed successfully.");
  } catch (error) {
    console.error("Background removal error:", error);

    const message =
      error && error.message
        ? error.message
        : "The image could not be processed.";

    showError(message);
  } finally {
    removeButton.disabled = false;
  }
}

function downloadResult() {
  if (!resultBlob) {
    showError("Please remove the background first.");
    return;
  }

  const url = URL.createObjectURL(resultBlob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "krishna-ai-studio-result.png";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function resetApp() {
  selectedFile = null;
  resultBlob = null;

  if (originalPreviewUrl) {
    URL.revokeObjectURL(originalPreviewUrl);
    originalPreviewUrl = null;
  }

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }

  preview.removeAttribute("src");
  preview.alt = "";

  previewCard.classList.remove("visible");
  previewCard.classList.remove("show");

  downloadButton.style.display = "none";
  downloadButton.disabled = true;

  removeButton.disabled = false;
  fileInput.value = "";

  status("Ready.");
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files && fileInput.files[0];

  if (file) {
    handleFile(file);
  }
});

dropZone.addEventListener("click", () => {
  fileInput.click();
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();

  dropZone.classList.remove("dragover");

  const file =
    event.dataTransfer &&
    event.dataTransfer.files &&
    event.dataTransfer.files[0];

  if (file) {
    handleFile(file);
  }
});

removeButton.addEventListener("click", processImage);

downloadButton.addEventListener("click", downloadResult);

resetButton.addEventListener("click", resetApp);

window.addEventListener("beforeunload", () => {
  if (originalPreviewUrl) {
    URL.revokeObjectURL(originalPreviewUrl);
  }

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
  }
});

status("Ready.");
