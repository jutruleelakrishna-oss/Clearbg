import { removeBackground } from "@imgly/background-removal";
import "./style.css";

const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const removeButton = document.querySelector("#removeButton");
const downloadButton = document.querySelector("#downloadButton");
const resetButton = document.querySelector("#resetButton");

const preview = document.querySelector("#preview");
const result = document.querySelector("#result");
const status = document.querySelector("#status");
const progressBar = document.querySelector("#progressBar");

let selectedFile = null;
let resultUrl = null;

function setStatus(message, percent = null) {
  status.textContent = message;

  if (percent === null) {
    progressBar.style.width = "0%";
  } else {
    const value = Math.max(0, Math.min(100, percent));
    progressBar.style.width = `${value}%`;
  }
}

function setFile(file) {
  if (!file) {
    setStatus("Please choose an image.");
    return;
  }

  if (!file.type.startsWith("image/")) {
    setStatus("Please choose a JPG or PNG image.");
    return;
  }

  selectedFile = file;

  const url = URL.createObjectURL(file);

  preview.onload = () => {
    URL.revokeObjectURL(url);
    setStatus(`${file.name} ready.`);
  };

  preview.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus("The selected image could not be displayed.");
  };

  preview.src = url;
  preview.hidden = false;

  result.hidden = true;
  downloadButton.hidden = true;
  removeButton.disabled = false;
}

function createProcessingBlob() {
  return new Promise((resolve, reject) => {
    if (!preview.complete || !preview.naturalWidth) {
      reject(new Error("Image has not finished loading."));
      return;
    }

    const maxSize = 2000;

    let width = preview.naturalWidth;
    let height = preview.naturalHeight;

    if (width > maxSize || height > maxSize) {
      const scale = Math.min(
        maxSize / width,
        maxSize / height
      );

      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      reject(new Error("Could not create image canvas."));
      return;
    }

    context.drawImage(
      preview,
      0,
      0,
      width,
      height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create processing image."));
          return;
        }

        resolve(blob);
      },
      "image/png"
    );
  });
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (file) {
    setFile(file);
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
});

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files?.[0];

  if (file) {
    setFile(file);
  }
});

dropZone.addEventListener("click", () => {
  fileInput.click();
});

removeButton.addEventListener("click", async () => {
  if (!selectedFile) return;

  removeButton.disabled = true;
  downloadButton.hidden = true;

  try {
    setStatus("Preparing image…", 5);

    const processingBlob = await createProcessingBlob();

    setStatus("Loading AI model…", 10);

    const resultBlob = await removeBackground(
      processingBlob,
      {
        debug: true,

        publicPath:
          "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",

        device: "cpu",

        model: "isnet_quint8",

        progress: (key, current, total) => {
          const percent = total
            ? Math.round((current / total) * 100)
            : 0;

          setStatus(
            `Processing… ${percent}%`,
            percent
          );

          console.log(
            "ClearBG:",
            key,
            current,
            total
          );
        }
      }
    );

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    resultUrl = URL.createObjectURL(resultBlob);

    result.src = resultUrl;
    result.hidden = false;

    downloadButton.hidden = false;

    setStatus(
      "Background removed successfully!",
      100
    );

  } catch (error) {
    console.error("ClearBG error:", error);

    const message =
      error?.message ||
      error?.toString() ||
      "Unknown error";

    setStatus(`Error: ${message}`);
  } finally {
    removeButton.disabled = false;
  }
});

downloadButton.addEventListener("click", () => {
  if (!resultUrl) return;

  const link = document.createElement("a");

  link.href = resultUrl;
  link.download = "clearbg-result.png";

  document.body.appendChild(link);
  link.click();
  link.remove();
});

resetButton.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";

  preview.hidden = true;
  result.hidden = true;
  downloadButton.hidden = true;
  removeButton.disabled = true;

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }

  setStatus("Choose an image to begin.");
});
