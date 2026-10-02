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

let originalUrl = null;
let resultUrl = null;

let backgroundRemover = null;
let loadingModel = null;


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

  const name =
    file.name?.toLowerCase() || "";

  const extensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif"
  ];

  return extensions.some(
    extension =>
      name.endsWith(extension)
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
        file.type || "image/png",

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

  downloadButton.disabled =
    true;

  downloadButton.style.display =
    "none";

  setStatus(
    "Image ready. Remove the background.",
    0
  );
}


/* =========================================
   LOAD AI MODEL
========================================= */

async function getBackgroundRemover() {

  if (backgroundRemover) {
    return backgroundRemover;
  }

  if (loadingModel) {
    return loadingModel;
  }

  loadingModel =
    (async () => {

      try {

        setStatus(
          "Loading AI model...",
          5
        );

        console.log(
          "Loading:",
          MODEL_NAME
        );


        /*
         * First try WebGPU.
         */

        if (
          typeof navigator !== "undefined" &&
          navigator.gpu
        ) {

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
                  dtype: "fp32",

                  progress_callback:
                    modelProgress
                }
              );

            console.log(
              "MODNet loaded using WebGPU."
            );

            return backgroundRemover;

          } catch (webgpuError) {

            console.warn(
              "WebGPU failed. Using WASM.",
              webgpuError
            );

            backgroundRemover =
              null;
          }
        }


        /*
         * WASM fallback.
         */

        console.log(
          "Loading MODNet using WASM..."
        );

        backgroundRemover =
          await pipeline(
            "background-removal",
            MODEL_NAME,
            {
              device: "wasm",
              dtype: "fp32",

              progress_callback:
                modelProgress
            }
          );


        console.log(
          "MODNet loaded using WASM."
        );


        return backgroundRemover;

      } catch (error) {

        console.error(
          "AI model loading failed:",
          error
        );

        backgroundRemover =
          null;

        throw error;

      } finally {

        loadingModel =
          null;
      }

    })();

  return loadingModel;
}


/* =========================================
   MODEL PROGRESS
========================================= */

function modelProgress(info) {

  if (!info) {
    return;
  }

  try {

    if (
      info.status ===
      "progress"
    ) {

      const progress =
        Number(info.progress);


      if (
        Number.isFinite(progress)
      ) {

        const percent =
          Math.round(
            Math.min(
              45,
              5 + progress * 0.4
            )
          );


        setStatus(
          `Loading AI model... ${Math.round(progress)}%`,
          percent
        );
      }


    } else if (
      info.status ===
      "initiate"
    ) {

      setStatus(
        "Downloading AI model...",
        8
      );


    } else if (
      info.status ===
      "done"
    ) {

      setStatus(
        "AI model loaded.",
        45
      );
    }

  } catch (error) {

    console.warn(
      "Progress error:",
      error
    );
  }
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
      "Selected:",
      file.name
    );

    console.log(
      "Type:",
      file.type
    );

    console.log(
      "Size:",
      file.size
    );


    selectedFile =
      await prepareFile(file);


    resultBlob =
      null;


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
      "File error:",
      error
    );

    selectedFile =
      null;

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
      "Starting AI...",
      5
    );


    console.log(
      "================================"
    );

    console.log(
      "KRISHNA AI STUDIO"
    );

    console.log(
      "Background removal"
    );

    console.log(
      "Model:",
      MODEL_NAME
    );

    console.log(
      "================================"
    );


    /*
     * Load MODNet.
     */

    const remover =
      await getBackgroundRemover();


    if (!remover) {

      throw new Error(
        "MODNet could not be loaded."
      );
    }


    setStatus(
      "Analyzing your image...",
      50
    );


    /*
     * Run background removal.
     *
     * MODNet returns an array containing
     * a 4-channel RawImage.
     */

    const output =
      await remover(
        selectedFile
      );


    console.log(
      "MODNet output:",
      output
    );


    if (
      !output ||
      !Array.isArray(output) ||
      !output[0]
    ) {

      throw new Error(
        "MODNet returned an invalid result."
      );
    }


    const resultImage =
      output[0];


    console.log(
      "Result image:",
      resultImage
    );

    console.log(
      "Width:",
      resultImage.width
    );

    console.log(
      "Height:",
      resultImage.height
    );

    console.log(
      "Channels:",
      resultImage.channels
    );


    setStatus(
      "Creating transparent PNG...",
      85
    );


    /*
     * Convert RawImage to PNG.
     */

    resultBlob =
      await resultImage.toBlob(
        "image/png"
      );


    if (!resultBlob) {

      throw new Error(
        "Could not create the transparent PNG."
      );
    }


    console.log(
      "PNG created:",
      resultBlob.size
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
     * Create result URL.
     */

    resultUrl =
      URL.createObjectURL(
        resultBlob
      );


    /*
     * Display transparent image.
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
      "Background removal completed."
    );


  } catch (error) {

    console.error(
      "================================"
    );

    console.error(
      "BACKGROUND REMOVAL FAILED"
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


    /*
     * Show useful error instead of
     * hiding the actual problem.
     */

    const message =
      error?.message ||
      String(error) ||
      "Unknown error";


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

  selectedFile =
    null;

  resultBlob =
    null;


  if (originalUrl) {

    URL.revokeObjectURL(
      originalUrl
    );

    originalUrl =
      null;
  }


  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl =
      null;
  }


  preview.removeAttribute(
    "src"
  );

  preview.alt =
    "";


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


  fileInput.value =
    "";


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
