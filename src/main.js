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
let modelPromise = null;


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

    const value = Math.max(
      0,
      Math.min(100, progress)
    );

    progressBar.style.width =
      `${value}%`;
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
   LOAD MODEL
========================================= */

async function loadModel() {

  if (backgroundRemover) {
    return backgroundRemover;
  }

  if (modelPromise) {
    return modelPromise;
  }

  modelPromise =
    (async () => {

      try {

        console.log(
          "Loading MODNet..."
        );

        setStatus(
          "Loading AI model...",
          5
        );


        /*
         * WASM + Q8 is intentionally used
         * here for better compatibility with
         * Android/mobile browsers.
         *
         * Transformers.js recommends q8
         * for WASM/resource-constrained
         * environments.
         */

        const remover =
          await pipeline(
            "background-removal",
            MODEL_NAME,
            {
              device: "wasm",
              dtype: "q8",

              progress_callback:
                (info) => {

                  console.log(
                    "Model progress:",
                    info
                  );


                  if (
                    info?.status ===
                    "progress"
                  ) {

                    const progress =
                      Number(info.progress);


                    if (
                      Number.isFinite(progress)
                    ) {

                      const percent =
                        Math.min(
                          45,
                          Math.max(
                            5,
                            Math.round(
                              5 +
                              progress * 0.4
                            )
                          )
                        );


                      setStatus(
                        `Downloading AI model... ${Math.round(progress)}%`,
                        percent
                      );
                    }
                  }
                }
            }
          );


        backgroundRemover =
          remover;


        console.log(
          "MODNet loaded successfully."
        );


        return backgroundRemover;


      } catch (error) {

        console.error(
          "MODEL LOAD ERROR:",
          error
        );


        modelPromise =
          null;

        backgroundRemover =
          null;

        throw error;
      }

    })();


  return modelPromise;
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
      "Selected file:",
      file.name
    );

    console.log(
      "File type:",
      file.type
    );

    console.log(
      "File size:",
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

      resultUrl =
        null;
    }


    displayImage(
      selectedFile
    );


  } catch (error) {

    console.error(
      "FILE ERROR:",
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
      "Loading AI...",
      5
    );


    console.log(
      "================================"
    );

    console.log(
      "KRISHNA AI STUDIO"
    );

    console.log(
      "BACKGROUND REMOVAL"
    );

    console.log(
      "Model:",
      MODEL_NAME
    );

    console.log(
      "Device: WASM"
    );

    console.log(
      "Data type: Q8"
    );

    console.log(
      "================================"
    );


    /*
     * Load model.
     */

    const remover =
      await loadModel();


    if (!remover) {

      throw new Error(
        "MODNet could not be loaded."
      );
    }


    setStatus(
      "Preparing image...",
      50
    );


    /*
     * IMPORTANT:
     *
     * MODNet's official Transformers.js
     * example uses an image URL as input.
     *
     * So we create a temporary object URL
     * from the selected image.
     */

    const imageUrl =
      URL.createObjectURL(
        selectedFile
      );


    try {

      setStatus(
        "Analyzing your image...",
        55
      );


      console.log(
        "Starting MODNet inference..."
      );


      /*
       * Run AI.
       */

      const output =
        await remover(
          imageUrl
        );


      console.log(
        "MODNet output:",
        output
      );


      if (
        !output ||
        !output[0]
      ) {

        throw new Error(
          "MODNet returned no image."
        );
      }


      const resultImage =
        output[0];


      console.log(
        "Result:",
        resultImage
      );


      setStatus(
        "Creating transparent PNG...",
        90
      );


      /*
       * Convert MODNet RawImage
       * into a PNG blob.
       */

      resultBlob =
        await resultImage.toBlob(
          "image/png"
        );


      if (!resultBlob) {

        throw new Error(
          "Could not create transparent PNG."
        );
      }


      console.log(
        "Result PNG created:",
        resultBlob.size,
        "bytes"
      );


      /*
       * Remove old result URL.
       */

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
       * Display result.
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


    } finally {

      /*
       * Always release temporary
       * input image URL.
       */

      URL.revokeObjectURL(
        imageUrl
      );
    }


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
      "Message:",
      error?.message
    );

    console.error(
      "Stack:",
      error?.stack
    );

    console.error(
      "================================"
    );


    removeButton.disabled =
      false;


    downloadButton.disabled =
      true;


    downloadButton.style.display =
      "none";


    const message =
      error?.message ||
      "Unknown background removal error.";


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
