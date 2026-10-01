import { removeBackground } from "@imgly/background-removal";
import "./style.css";

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const previewCard = document.getElementById("previewCard");
const preview = document.getElementById("preview");

const removeButton = document.getElementById("removeButton");
const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");

const status = document.getElementById("status");
const progressBar = document.getElementById("progressBar");

let selectedFile = null;
let resultUrl = null;

const MAX_IMAGE_SIZE = 4096;

/* -----------------------------
   STATUS
----------------------------- */

function setStatus(message, progress = 0) {
  if (status) {
    status.textContent = message;
  }

  if (progressBar) {
    progressBar.value = progress;
  }
}

/* -----------------------------
   SUPPORTED FORMATS
----------------------------- */

function isSupportedImage(file) {
  if (!file) return false;

  const supportedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/avif"
  ];

  const supportedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif"
  ];

  const fileName = file.name.toLowerCase();

  return (
    supportedTypes.includes(file.type) ||
    supportedExtensions.some((extension) =>
      fileName.endsWith(extension)
    )
  );
}

/* -----------------------------
   LOAD IMAGE
----------------------------- */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (
        !image.naturalWidth ||
        !image.naturalHeight
      ) {
        reject(
          new Error(
            "The image has invalid dimensions."
          )
        );
        return;
      }

      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error(
          "The image could not be decoded. Please try a JPG or PNG image."
        )
      );
    };

    image.src = objectUrl;
  });
}

/* -----------------------------
   CONVERT IMAGE TO PNG
----------------------------- */

async function convertToPNG(file) {
  setStatus("Preparing image…", 5);

  const image = await loadImage(file);

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  /* Prevent extremely large images
     from crashing mobile browsers */

  if (
    width > MAX_IMAGE_SIZE ||
    height > MAX_IMAGE_SIZE
  ) {
    const scale = Math.min(
      MAX_IMAGE_SIZE / width,
      MAX_IMAGE_SIZE / height
    );

    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Your browser does not support image processing."
    );
  }

  context.clearRect(
    0,
    0,
    width,
    height
  );

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "The image could not be converted."
            )
          );
          return;
        }

        resolve(blob);
      },
      "image/png",
      1
    );
  });
}

/* -----------------------------
   SHOW SELECTED IMAGE
----------------------------- */

function showSelectedImage(file) {
  if (!preview) return;

  const imageUrl =
    URL.createObjectURL(file);

  preview.onload = () => {
    URL.revokeObjectURL(imageUrl);

    previewCard.classList.add("show");
    dropZone.classList.add("hidden");

    removeButton.disabled = false;
    downloadButton.disabled = true;

    setStatus(
      "Image ready. Remove the background.",
      0
    );
  };

  preview.onerror = () => {
    URL.revokeObjectURL(imageUrl);

    setStatus(
      "The image could not be displayed. Try JPG or PNG.",
      0
    );

    removeButton.disabled = true;
  };

  preview.src = imageUrl;
}

/* -----------------------------
   HANDLE FILE
----------------------------- */

async function handleFile(file) {
  if (!file) return;

  if (!isSupportedImage(file)) {
    setStatus(
      "Unsupported image format.",
      0
    );

    return;
  }

  selectedFile = file;

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }

  downloadButton.disabled = true;

  try {
    setStatus(
      "Loading image…",
      5
    );

    showSelectedImage(file);
  } catch (error) {
    console.error(
      "Krishna AI Studio:",
      error
    );

    setStatus(
      error.message ||
        "Unable to load image.",
      0
    );
  }
}

/* -----------------------------
   REMOVE BACKGROUND
----------------------------- */

async function processImage() {
  if (!selectedFile) {
    setStatus(
      "Please select an image first.",
      0
    );

    return;
  }

  try {
    removeButton.disabled = true;
    downloadButton.disabled = true;

    setStatus(
      "Preparing image for AI…",
      10
    );

    /* Convert ANY supported browser-readable
       image into PNG before AI processing */

    const processingBlob =
      await convertToPNG(selectedFile);

    setStatus(
      "Starting AI background removal…",
      15
    );

    console.log(
      "Krishna AI Studio: AI processing started"
    );

    const resultBlob =
      await removeBackground(
        processingBlob,
        {
          debug: true,

          publicPath:
            "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",

          device: "cpu",

          model: "isnet_quint8",

          progress: (
            key,
            current,
            total
          ) => {
            let percent = 15;

            if (total) {
              percent =
                15 +
                Math.round(
                  (current / total) * 80
                );
            }

            percent = Math.min(
              percent,
              95
            );

            setStatus(
              `Removing background… ${percent}%`,
              percent
            );

            console.log(
              "Krishna AI Studio:",
              key,
              current,
              total
            );
          }
        }
      );

    if (!resultBlob) {
      throw new Error(
        "AI processing did not return an image."
      );
    }

    /* Remove old result URL */

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    /* Create new result */

    resultUrl =
      URL.createObjectURL(resultBlob);

    /* IMPORTANT:
       Result replaces original image
       in the SAME preview section */

    preview.src = resultUrl;

    previewCard.classList.add("show");
    dropZone.classList.add("hidden");

    downloadButton.disabled = false;
    removeButton.disabled = false;

    setStatus(
      "Background removed successfully!",
      100
    );

    console.log(
      "Krishna AI Studio: Processing complete"
    );
  } catch (error) {
    console.error(
      "Krishna AI Studio processing error:",
      error
    );

    removeButton.disabled = false;

    let errorMessage =
      "Background removal failed.";

    if (error?.message) {
      errorMessage =
        error.message;
    }

    setStatus(
      `Error: ${errorMessage}`,
      0
    );
  }
}

/* -----------------------------
   DOWNLOAD
----------------------------- */

function downloadResult() {
  if (!resultUrl) {
    setStatus(
      "Remove the background first.",
      0
    );

    return;
  }

  const link =
    document.createElement("a");

  link.href = resultUrl;

  link.download =
    "krishna-ai-studio-result.png";

  document.body.appendChild(link);

  link.click();

  link.remove();
}

/* -----------------------------
   RESET
----------------------------- */

function resetApp() {
  selectedFile = null;

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }

  preview.removeAttribute("src");

  previewCard.classList.remove("show");

  dropZone.classList.remove("hidden");

  removeButton.disabled = true;
  downloadButton.disabled = true;

  fileInput.value = "";

  setStatus(
    "Select an image to begin.",
    0
  );
}

/* -----------------------------
   FILE PICKER
----------------------------- */

dropZone.addEventListener(
  "click",
  () => {
    fileInput.click();
  }
);

fileInput.addEventListener(
  "change",
  (event) => {
    const file =
      event.target.files?.[0];

    handleFile(file);
  }
);

/* -----------------------------
   DRAG & DROP
----------------------------- */

dropZone.addEventListener(
  "dragover",
  (event) => {
    event.preventDefault();

    dropZone.classList.add(
      "dragging"
    );
  }
);

dropZone.addEventListener(
  "dragleave",
  () => {
    dropZone.classList.remove(
      "dragging"
    );
  }
);

dropZone.addEventListener(
  "drop",
  (event) => {
    event.preventDefault();

    dropZone.classList.remove(
      "dragging"
    );

    const file =
      event.dataTransfer.files?.[0];

    handleFile(file);
  }
);

/* -----------------------------
   BUTTONS
----------------------------- */

removeButton.addEventListener(
  "click",
  processImage
);

downloadButton.addEventListener(
  "click",
  downloadResult
);

resetButton.addEventListener(
  "click",
  resetApp
);

/* -----------------------------
   INITIAL STATE
----------------------------- */

removeButton.disabled = true;
downloadButton.disabled = true;

setStatus(
  "Select an image to begin.",
  0
);

console.log(
  "Krishna AI Studio loaded."
);
