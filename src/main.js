import { pipeline } from "@huggingface/transformers";
import "./style.css";

/* =========================================
   ELEMENTS
========================================= */

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const previewCard = document.getElementById("previewCard");
const preview = document.getElementById("preview");

const removeButton = document.getElementById("removeButton");
const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");

const status = document.getElementById("status");
const progressBar = document.getElementById("progressBar");


/* =========================================
   STATE
========================================= */

let selectedFile = null;
let resultBlob = null;

let resultUrl = null;
let originalUrl = null;

let backgroundRemover = null;
let modelLoading = false;


/* =========================================
   MODEL
========================================= */

const MODEL_NAME = "Xenova/modnet";


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
    ".avif",
    ".heic",
    ".heif"
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
   LOAD AI MODEL
========================================= */

async function loadBackgroundRemover() {

  if (backgroundRemover) {
    return backgroundRemover;
  }

  if (modelLoading) {

    while (modelLoading) {
      await new Promise(
        resolve => setTimeout(resolve, 100)
      );
    }

    return backgroundRemover;
  }

  modelLoading = true;

  try {

    setStatus(
      "Loading AI background remover...",
      5
    );


    console.log(
      "================================"
    );

    console.log(
      "Krishna AI Studio"
    );

    console.log(
      "Loading MODNet"
    );

    console.log(
      "Model:",
      MODEL_NAME
    );

    console.log(
      "================================"
    );


    /*
     * Use WebGPU when the browser supports it.
     *
     * This is much faster on compatible
     * phones and computers.
     */

    const webGPUAvailable =
      "gpu" in navigator;


    if (webGPUAvailable) {

      try {

        console.log(
          "Trying WebGPU..."
        );


        backgroundRemover =
          await pipeline(
            "background-removal",
            MODEL_NAME,
            {
              device: "webgpu",
              dtype: "fp16",

              progress_callback:
                modelProgress
            }
          );


        console.log(
          "MODNet loaded with WebGPU."
        );


      } catch (webGPUError) {

        console.warn(
          "WebGPU failed. Falling back to WASM.",
          webGPUError
        );


        backgroundRemover =
          await pipeline(
            "background-removal",
            MODEL_NAME,
            {
              device: "wasm",
              dtype: "q8",

              progress_callback:
                modelProgress
            }
          );


        console.log(
          "MODNet loaded with WASM."
        );
      }


    } else {

      console.log(
        "WebGPU unavailable."
      );

      console.log(
        "Using WASM."
      );


      backgroundRemover =
        await pipeline(
          "background-removal",
          MODEL_NAME,
          {
            device: "wasm",
            dtype: "q8",

            progress_callback:
              modelProgress
          }
        );
    }


    return backgroundRemover;


  } finally {

    modelLoading = false;
  }
}


/* =========================================
   MODEL PROGRESS
========================================= */

function modelProgress(progress) {

  try {

    if (!progress) {
      return;
    }


    /*
     * Transformers.js reports different
     * progress states while downloading
     * the model.
     */

    if (
      progress.status ===
      "progress"
    ) {

      const value =
        Number(progress.progress);


      if (
        Number.isFinite(value)
      ) {

        const percent =
          Math.max(
            5,
            Math.min(
              45,
              Math.round(
                5 +
                (value * 0.4)
              )
            )
          );


        setStatus(
          `Loading AI model... ${Math.round(value)}%`,
          percent
        );
      }


    } else if (
      progress.status ===
      "initiate"
    ) {

      setStatus(
        "Downloading AI model...",
        8
      );


    } else if (
      progress.status ===
      "done"
    ) {

      setStatus(
        "AI model loaded.",
        45
      );
    }

  } catch (error) {

    console.warn(
      "Model progress error:",
      error
    );
  }
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
      "Preparing AI...",
      5
    );


    console.log(
      "================================"
    );

    console.log(
      "BACKGROUND REMOVAL"
    );

    console.log(
      "Model:",
      MODEL_NAME
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
      "================================"
    );


    /*
     * Load the new AI.
     */

    const remover =
      await loadBackgroundRemover();


    if (!remover) {

      throw new Error(
        "AI background remover could not be loaded."
      );
    }


    setStatus(
      "Analyzing image...",
      50
    );


    /*
     * Send the original file directly
     * to Transformers.js.
     *
     * MODNet performs portrait matting
     * and returns an RGBA RawImage.
     */

    const output =
      await remover(
        selectedFile
      );


    console.log(
      "AI output:",
      output
    );


    if (
      !output ||
      !Array.isArray(output) ||
      !output[0]
    ) {

      throw new Error(
        "The AI did not return a valid transparent image."
      );
    }


    setStatus(
      "Creating transparent image...",
      85
    );


    /*
     * Transformers.js returns a RawImage.
     *
     * MODNet's background-removal pipeline
     * returns an RGBA image.
     *
     * Convert it directly to PNG.
     */

    resultBlob =
      await output[0].toBlob(
        "image/png"
      );


    if (!resultBlob) {

      throw new Error(
        "The AI result could not be converted to PNG."
      );
    }


    console.log(
      "Result PNG:",
      resultBlob
    );


    /*
     * Remove previous result URL.
     */

    if (resultUrl) {

      URL.revokeObjectURL(
        resultUrl
      );
    }


    /*
     * Create transparent PNG URL.
     */

    resultUrl =
      URL.createObjectURL(
        resultBlob
      );


    /*
     * Show result.
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


    console.log(
      "Background removal completed successfully."
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


    downloadButton.disabled =
      true;


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
    "krishna-ai-studio-background-removed.png";


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
