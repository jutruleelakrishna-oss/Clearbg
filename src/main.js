import { removeBackground } from "@imgly/background-removal";
import { decode as decodePNG } from "fast-png";

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

function setStatus(message) {
  const element = document.getElementById("status");

  if (element) {
    element.textContent = message;
  } else {
    console.log(message);
  }
}

function showError(message) {
  console.error(message);
  setStatus("Error: " + message);
  alert("Error: " + message);
}

function isPNG(file) {
  const name = file.name.toLowerCase();

  return (
    file.type === "image/png" ||
    name.endsWith(".png")
  );
}

async function decodePNGToFile(file) {
  const buffer = await file.arrayBuffer();

  let decoded;

  try {
    decoded = decodePNG(new Uint8Array(buffer));
  } catch (error) {
    throw new Error(
      "This PNG file is damaged or uses a PNG format that could not be decoded."
    );
  }

  if (
    !decoded ||
    !decoded.width ||
    !decoded.height ||
    !decoded.data
  ) {
    throw new Error("The PNG could not be decoded.");
  }

  const canvas = document.createElement("canvas");

  canvas.width = decoded.width;
  canvas.height = decoded.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not create the image canvas.");
  }

  const pixels = new Uint8ClampedArray(decoded.data);

  const imageData = new ImageData(
    pixels,
    decoded.width,
    decoded.height
  );

  context.putImageData(imageData, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) {
          resolve(value);
        } else {
          reject(
            new Error("The PNG could not be converted.")
          );
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

function loadNormalImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "This image format could not be decoded by your browser."
        )
      );
    };

    image.src = url;
  });
}

async function convertNormalImageToPNG(file) {
  const image = await loadNormalImage(file);

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("The selected image has invalid dimensions.");
  }

  const canvas = document.createElement("canvas");

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not create the image canvas.");
  }

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.drawImage(image, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) {
          resolve(value);
        } else {
          reject(
            new Error("The image could not be converted to PNG.")
          );
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

async function convertToPNG(file) {
  if (!file) {
    throw new Error("No image was selected.");
  }

  if (isPNG(file)) {
    setStatus("Reading PNG...");
    return await decodePNGToFile(file);
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image.");
  }

  setStatus("Preparing image...");

  return await convertNormalImageToPNG(file);
}

function displayPreview(file) {
  if (originalPreviewUrl) {
    URL.revokeObjectURL(originalPreviewUrl);
  }

  originalPreviewUrl = URL.createObjectURL(file);

  preview.src = originalPreviewUrl;
  preview.alt = "Selected image";

  previewCard.classList.add("visible");

  downloadButton.style.display = "none";
  downloadButton.disabled = true;

  resultBlob = null;

  setStatus("Image selected.");
}

async function handleFile(file) {
  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("image/") &&
    !file.name.toLowerCase().match(
      /\.(png|jpg|jpeg|webp|gif|bmp|avif|svg)$/i
    )
  ) {
    showError("Please select a valid image.");
    return;
  }

  selectedFile = file;

  displayPreview(file);

  removeButton.disabled = false;
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

    setStatus("Preparing image...");

    const inputFile =
      await convertToPNG(selectedFile);

    setStatus("Starting AI background removal...");

    const outputBlob =
      await removeBackground(inputFile, {
        debug: false,

        model: "isnet_quint8",

        device: "cpu",

        publicPath: IMG_LY_PATH,

        progress: (key, current, total) => {
          if (total > 0) {
            const percent = Math.round(
              (current / total) * 100
            );

            setStatus(
              "Removing background... " +
              percent +
              "%"
            );
          } else {
            setStatus(
              "Removing background..."
            );
          }
        }
      });

    if (!outputBlob) {
      throw new Error(
        "Background removal returned no image."
      );
    }

    resultBlob = outputBlob;

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    resultUrl =
      URL.createObjectURL(resultBlob);

    preview.src = resultUrl;
    preview.alt =
      "Background removed image";

    downloadButton.style.display = "block";
    downloadButton.disabled = false;

    setStatus(
      "Background removed successfully."
    );
  } catch (error) {
    console.error(error);

    showError(
      error?.message ||
      "The image could not be processed."
    );
  } finally {
    removeButton.disabled = false;
  }
}

function downloadResult() {
  if (!resultBlob) {
    showError(
      "Please remove the background first."
    );
    return;
  }

  const url =
    URL.createObjectURL(resultBlob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download =
    "krishna-ai-studio-result.png";

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
    URL.revokeObjectURL(
      originalPreviewUrl
    );

    originalPreviewUrl = null;
  }

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);

    resultUrl = null;
  }

  preview.removeAttribute("src");

  preview.alt = "";

  previewCard.classList.remove(
    "visible"
  );

  previewCard.classList.remove(
    "show"
  );

  downloadButton.style.display = "none";

  downloadButton.disabled = true;

  removeButton.disabled = false;

  fileInput.value = "";

  setStatus("Ready.");
}

fileInput.addEventListener(
  "change",
  () => {
    const file =
      fileInput.files?.[0];

    if (file) {
      handleFile(file);
    }
  }
);

dropZone.addEventListener(
  "click",
  () => {
    fileInput.click();
  }
);

dropZone.addEventListener(
  "dragover",
  (event) => {
    event.preventDefault();

    dropZone.classList.add(
      "dragover"
    );
  }
);

dropZone.addEventListener(
  "dragleave",
  () => {
    dropZone.classList.remove(
      "dragover"
    );
  }
);

dropZone.addEventListener(
  "drop",
  (event) => {
    event.preventDefault();

    dropZone.classList.remove(
      "dragover"
    );

    const file =
      event.dataTransfer?.files?.[0];

    if (file) {
      handleFile(file);
    }
  }
);

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

window.addEventListener(
  "beforeunload",
  () => {
    if (originalPreviewUrl) {
      URL.revokeObjectURL(
        originalPreviewUrl
      );
    }

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
  }
);

setStatus("Ready.");
