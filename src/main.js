import { removeBackground } from "@imgly/background-removal";

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


/* ---------------------------------------
   STATUS
--------------------------------------- */

function setStatus(message, progress = 0) {
  if (status) {
    status.textContent = message;
  }

  if (progressBar) {
    const value = Math.max(0, Math.min(100, progress));
    progressBar.style.width = `${value}%`;
  }
}


/* ---------------------------------------
   IMAGE VALIDATION
--------------------------------------- */

function isImage(file) {
  if (!file) return false;

  if (file.type && file.type.startsWith("image/")) {
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


/* ---------------------------------------
   HANDLE FILE
--------------------------------------- */

function handleFile(file) {
  if (!file) return;

  console.log("Selected file:", file.name);
  console.log("File type:", file.type);
  console.log("File size:", file.size);

  if (!isImage(file)) {
    setStatus(
      "Please select a valid JPG, PNG or WEBP image.",
      0
    );
    return;
  }

  selectedFile = file;
  resultBlob = null;

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }

  if (originalUrl) {
    URL.revokeObjectURL(originalUrl);
    originalUrl = null;
  }

  try {
    /*
     * Only create a preview here.
     * We DO NOT decode/convert the image.
     */

    originalUrl = URL.createObjectURL(file);

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

  } catch (error) {
    console.error("Preview error:", error);

    selectedFile = null;

    setStatus(
      "The selected image could not be previewed.",
      0
    );
  }
}


/* ---------------------------------------
   BACKGROUND REMOVAL
--------------------------------------- */

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
      "Starting AI background removal...",
      5
    );

    console.log("=================================");
    console.log("Krishna AI Studio");
    console.log("Starting background removal");
    console.log("File:", selectedFile.name);
    console.log("Type:", selectedFile.type);
    console.log("Size:", selectedFile.size);
    console.log("=================================");


    /*
     * IMPORTANT:
     *
     * Send the ORIGINAL FILE directly
     * to IMG.LY.
     *
     * No Image()
     * No createImageBitmap()
     * No canvas
     * No PNG conversion
     */

    const output = await removeBackground(
      selectedFile,
      {
        debug: true,

        model: "isnet_quint8",

        device: "cpu",

        publicPath: MODEL_PATH,

        progress: (
          key,
          current,
          total
        ) => {

          console.log(
            "AI progress:",
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

          percent = Math.max(
            10,
            Math.min(95, percent)
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
        "AI processing did not return an image."
      );
    }


    console.log(
      "Background removal completed.",
      output
    );


    resultBlob = output;


    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }


    resultUrl =
      URL.createObjectURL(resultBlob);


    /*
     * Show transparent result.
     */

    preview.src = resultUrl;

    preview.alt =
      "Background removed image";


    previewCard.classList.add("show");
    dropZone.classList.add("hidden");


    downloadButton.style.display = "block";
    downloadButton.disabled = false;

    removeButton.disabled = false;


    setStatus(
      "Background removed successfully!",
      100
    );


  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "BACKGROUND REMOVAL ERROR"
    );

    console.error(error);

    console.error(
      "================================="
    );


    removeButton.disabled = false;


    let message =
      error?.message ||
      "Background removal failed.";


    /*
     * Make the error easier to understand.
     */

    if (
      message.toLowerCase().includes("decode")
    ) {
      message =
        "The AI model could not decode this image. Please try another PNG or JPG.";
    }


    setStatus(
      `Error: ${message}`,
      0
    );
  }
}


/* ---------------------------------------
   DOWNLOAD
--------------------------------------- */

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

  link.href = resultUrl;

  link.download =
    "krishna-ai-studio-result.png";

  document.body.appendChild(link);

  link.click();

  link.remove();
}


/* ---------------------------------------
   RESET
--------------------------------------- */

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


/* ---------------------------------------
   FILE PICKER
--------------------------------------- */

dropZone.addEventListener(
  "click",
  () => {
    fileInput.click();
  }
);


fileInput.addEventListener(
  "change",
  event => {

    const file =
      event.target.files?.[0];

    handleFile(file);
  }
);


/* ---------------------------------------
   DRAG & DROP
--------------------------------------- */

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


/* ---------------------------------------
   BUTTONS
--------------------------------------- */

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


/* ---------------------------------------
   CLEANUP
--------------------------------------- */

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


/* ---------------------------------------
   INITIAL STATE
--------------------------------------- */

removeButton.disabled = true;

downloadButton.disabled = true;

setStatus(
  "Select an image to get started.",
  0
);

console.log(
  "Krishna AI Studio loaded successfully."
);
