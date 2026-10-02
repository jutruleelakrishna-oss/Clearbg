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
let resultBlob = null;
let resultUrl = null;
let originalUrl = null;

const MODEL_PATH =
  "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";


function setStatus(message, progress = 0) {
  if (status) {
    status.textContent = message;
  }

  if (progressBar) {
    progressBar.style.width =
      `${Math.max(0, Math.min(100, progress))}%`;
  }
}


function isImage(file) {
  if (!file) return false;

  if (file.type?.startsWith("image/")) {
    return true;
  }

  const name = file.name?.toLowerCase() || "";

  return [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif"
  ].some(ext => name.endsWith(ext));
}


/*
 * Read the file into a fresh File object.
 *
 * This avoids browser permission/reference problems
 * that can happen with files selected on mobile.
 */
async function prepareFile(file) {

  const buffer = await file.arrayBuffer();

  return new File(
    [buffer],
    file.name || "image.png",
    {
      type: file.type || "image/png",
      lastModified: Date.now()
    }
  );
}


function displayImage(file) {

  if (originalUrl) {
    URL.revokeObjectURL(originalUrl);
  }

  originalUrl =
    URL.createObjectURL(file);

  preview.src = originalUrl;
  preview.alt = "Selected image";

  previewCard.classList.add("show");
  dropZone.classList.add("hidden");

  removeButton.disabled = false;

  downloadButton.style.display = "none";
  downloadButton.disabled = true;

  setStatus(
    "Image ready. Remove the background.",
    0
  );
}


async function handleFile(file) {

  if (!file) return;

  if (!isImage(file)) {

    setStatus(
      "Please select a JPG, PNG or WEBP image.",
      0
    );

    return;
  }

  try {

    console.log("Selected file:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    /*
     * Make an independent copy of the selected file.
     */
    selectedFile =
      await prepareFile(file);

    resultBlob = null;

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }

    displayImage(selectedFile);

  } catch (error) {

    console.error(
      "File preparation error:",
      error
    );

    selectedFile = null;

    setStatus(
      "The selected image could not be read.",
      0
    );
  }
}


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
    downloadButton.style.display = "none";

    setStatus(
      "Loading AI model...",
      5
    );

    console.log(
      "Starting IMG.LY background removal..."
    );

    console.log(
      "Input:",
      selectedFile.name,
      selectedFile.type,
      selectedFile.size
    );


    const output =
      await removeBackground(
        selectedFile,
        {
          debug: true,

          model: "isnet_fp16",

          device: "cpu",

          publicPath: MODEL_PATH,

          progress: (
            key,
            current,
            total
          ) => {

            console.log(
              "Progress:",
              key,
              current,
              total
            );

            let percent = 10;

            if (
              Number.isFinite(total) &&
              total > 0
            ) {

              percent =
                10 +
                Math.round(
                  (current / total) * 85
                );
            }

            percent =
              Math.min(
                95,
                Math.max(
                  10,
                  percent
                )
              );

            setStatus(
              `Removing background... ${percent}%`,
              percent
            );
          }
        }
      );


    if (!output) {
      throw new Error(
        "IMG.LY did not return a result."
      );
    }


    resultBlob = output;


    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }


    resultUrl =
      URL.createObjectURL(
        resultBlob
      );


    preview.src =
      resultUrl;

    preview.alt =
      "Background removed image";


    downloadButton.style.display =
      "block";

    downloadButton.disabled =
      false;

    removeButton.disabled =
      false;


    setStatus(
      "Background removed successfully!",
      100
    );


    console.log(
      "Background removal completed successfully."
    );

  } catch (error) {

    console.error(
      "IMG.LY ERROR:",
      error
    );

    removeButton.disabled =
      false;

    const message =
      error?.message ||
      "Background removal failed.";

    setStatus(
      `Error: ${message}`,
      0
    );
  }
}


function downloadResult() {

  if (!resultBlob || !resultUrl) {

    setStatus(
      "Remove the background first.",
      0
    );

    return;
  }

  const link =
    document.createElement("a");

  link.href =
    resultUrl;

  link.download =
    "krishna-ai-studio-result.png";

  document.body.appendChild(link);

  link.click();

  link.remove();
}


function resetApp() {

  selectedFile = null;
  resultBlob = null;

  if (originalUrl) {
    URL.revokeObjectURL(originalUrl);
    originalUrl = null;
  }

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }

  preview.removeAttribute("src");
  preview.alt = "";

  previewCard.classList.remove("show");
  dropZone.classList.remove("hidden");

  removeButton.disabled = true;

  downloadButton.disabled = true;
  downloadButton.style.display = "none";

  fileInput.value = "";

  setStatus(
    "Select an image to get started.",
    0
  );
}


/* File picker */

dropZone.addEventListener(
  "click",
  () => fileInput.click()
);


fileInput.addEventListener(
  "change",
  event => {

    const file =
      event.target.files?.[0];

    handleFile(file);
  }
);


/* Drag and drop */

dropZone.addEventListener(
  "dragover",
  event => {

    event.preventDefault();

    dropZone.classList.add("dragging");
  }
);


dropZone.addEventListener(
  "dragleave",
  () => {

    dropZone.classList.remove("dragging");
  }
);


dropZone.addEventListener(
  "drop",
  event => {

    event.preventDefault();

    dropZone.classList.remove("dragging");

    const file =
      event.dataTransfer?.files?.[0];

    handleFile(file);
  }
);


/* Buttons */

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


/* Cleanup */

window.addEventListener(
  "beforeunload",
  () => {

    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
  }
);


/* Initial state */

removeButton.disabled = true;
downloadButton.disabled = true;

setStatus(
  "Select an image to get started.",
  0
);

console.log(
  "Krishna AI Studio loaded."
);
