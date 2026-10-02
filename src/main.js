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


/* =========================================
   STATUS
========================================= */

function setStatus(message, progress = 0) {
  if (status) {
    status.textContent = message;
  }

  if (progressBar) {
    const safeProgress = Math.max(
      0,
      Math.min(100, progress)
    );

    progressBar.style.width =
      `${safeProgress}%`;
  }
}


/* =========================================
   IMAGE VALIDATION
========================================= */

function isImage(file) {
  if (!file) {
    return false;
  }

  if (
    file.type &&
    file.type.startsWith("image/")
  ) {
    return true;
  }

  const fileName =
    file.name?.toLowerCase() || "";

  const supportedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif"
  ];

  return supportedExtensions.some(
    extension =>
      fileName.endsWith(extension)
  );
}


/* =========================================
   PREPARE FILE
========================================= */

async function prepareFile(file) {
  /*
   * Create an independent copy of the
   * selected file.
   *
   * This helps avoid temporary-file and
   * mobile browser permission problems.
   */

  const buffer =
    await file.arrayBuffer();

  return new File(
    [buffer],
    file.name || "image.png",
    {
      type:
        file.type ||
        "image/png",

      lastModified:
        Date.now()
    }
  );
}


/* =========================================
   DISPLAY IMAGE
========================================= */

function displayImage(file) {
  if (originalUrl) {
    URL.revokeObjectURL(
      originalUrl
    );

    originalUrl = null;
  }

  originalUrl =
    URL.createObjectURL(file);

  preview.src =
    originalUrl;

  preview.alt =
    "Selected image";

  previewCard.classList.add(
    "show"
  );

  dropZone.classList.add(
    "hidden"
  );

  removeButton.disabled =
    false;

  downloadButton.style.display =
    "none";

  downloadButton.disabled =
    true;

  setStatus(
    "Image ready. Remove the background.",
    0
  );
}


/* =========================================
   HANDLE FILE
========================================= */

async function handleFile(file) {
  if (!file) {
    return;
  }

  if (!isImage(file)) {
    setStatus(
      "Please select a JPG, PNG or WEBP image.",
      0
    );

    return;
  }

  try {
    console.log(
      "Selected image:",
      file.name
    );

    console.log(
      "Image type:",
      file.type
    );

    console.log(
      "Image size:",
      file.size
    );

    /*
     * Create an independent copy.
     */

    selectedFile =
      await prepareFile(file);

    resultBlob = null;

    if (resultUrl) {
      URL.revokeObjectURL(
        resultUrl
      );

      resultUrl = null;
    }

    displayImage(
      selectedFile
    );

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


/* =========================================
   REMOVE BACKGROUND
========================================= */

async function processImage() {
  if (!selectedFile) {
    setStatus(
      "Please select an image first.",
      0
    );

    return;
  }

  try {
    removeButton.disabled =
      true;

    downloadButton.disabled =
      true;

    downloadButton.style.display =
      "none";


    setStatus(
      "Loading AI model...",
      5
    );


    console.log(
      "================================"
    );

    console.log(
      "Krishna AI Studio"
    );

    console.log(
      "Starting background removal"
    );

    console.log(
      "File:",
      selectedFile.name
    );

    console.log(
      "Type:",
      selectedFile.type
    );

    console.log(
      "Size:",
      selectedFile.size
    );

    console.log(
      "Model: isnet"
    );

    console.log(
      "================================"
    );


    /*
     * IMPORTANT:
     *
     * The original image file is sent
     * directly to IMG.LY.
     *
     * No canvas conversion.
     *
     * No browser Image decoding.
     *
     * No createImageBitmap.
     */

    const output =
      await removeBackground(
        selectedFile,
        {
          /*
           * Full IS-Net model.
           *
           * This is intended to provide
           * better segmentation quality
           * than the quantized model.
           */

          model: "isnet",

          /*
           * CPU is safer for mobile
           * browser compatibility.
           */

          device: "cpu",

          /*
           * IMG.LY model files.
           */

          publicPath:
            MODEL_PATH,

          /*
           * Enable debugging so that
           * browser console provides
           * useful information if
           * processing fails.
           */

          debug: true,

          /*
           * Processing progress.
           */

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


            percent =
              Math.max(
                10,
                Math.min(
                  95,
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


    /*
     * Make sure AI returned something.
     */

    if (!output) {
      throw new Error(
        "IMG.LY did not return a result."
      );
    }


    console.log(
      "Background removal completed."
    );

    console.log(
      "Result:",
      output
    );


    /*
     * Save result.
     */

    resultBlob =
      output;


    if (resultUrl) {
      URL.revokeObjectURL(
        resultUrl
      );
    }


    resultUrl =
      URL.createObjectURL(
        resultBlob
      );


    /*
     * Show transparent result.
     */

    preview.src =
      resultUrl;

    preview.alt =
      "Background removed image";


    previewCard.classList.add(
      "show"
    );

    dropZone.classList.add(
      "hidden"
    );


    /*
     * Enable download.
     */

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


  } catch (error) {

    console.error(
      "================================"
    );

    console.error(
      "BACKGROUND REMOVAL ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================"
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


/* =========================================
   DOWNLOAD
========================================= */

function downloadResult() {
  if (
    !resultBlob ||
    !resultUrl
  ) {

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


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();
}


/* =========================================
   RESET
========================================= */

function resetApp() {

  selectedFile = null;

  resultBlob = null;


  if (originalUrl) {

    URL.revokeObjectURL(
      originalUrl
    );

    originalUrl = null;
  }


  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl = null;
  }


  preview.removeAttribute(
    "src"
  );

  preview.alt = "";


  previewCard.classList.remove(
    "show"
  );


  dropZone.classList.remove(
    "hidden"
  );


  removeButton.disabled =
    true;


  downloadButton.disabled =
    true;


  downloadButton.style.display =
    "none";


  fileInput.value = "";


  setStatus(
    "Select an image to get started.",
    0
  );
}


/* =========================================
   FILE PICKER
========================================= */

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


/* =========================================
   DRAG & DROP
========================================= */

dropZone.addEventListener(
  "dragover",
  event => {

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
  event => {

    event.preventDefault();

    dropZone.classList.remove(
      "dragging"
    );


    const file =
      event.dataTransfer
        ?.files?.[0];


    handleFile(file);
  }
);


/* =========================================
   BUTTONS
========================================= */

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


/* =========================================
   CLEANUP
========================================= */

window.addEventListener(
  "beforeunload",
  () => {

    if (originalUrl) {

      URL.revokeObjectURL(
        originalUrl
      );
    }


    if (resultUrl) {

      URL.revokeObjectURL(
        resultUrl
      );
    }
  }
);


/* =========================================
   INITIAL STATE
========================================= */

removeButton.disabled =
  true;

downloadButton.disabled =
  true;

downloadButton.style.display =
  "none";


setStatus(
  "Select an image to get started.",
  0
);


console.log(
  "Krishna AI Studio loaded successfully."
);
