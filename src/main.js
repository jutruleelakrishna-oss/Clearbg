import { removeBackground } from "@imgly/background-removal";
import "./style.css";

/* ==========================================
   ELEMENTS
========================================== */

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

const previewCard = document.getElementById("previewCard");
const preview = document.getElementById("preview");

const removeButton = document.getElementById("removeButton");
const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");

const status = document.getElementById("status");
const progressBar = document.getElementById("progressBar");


/* ==========================================
   STATE
========================================== */

let selectedFile = null;
let resultUrl = null;
let previewUrl = null;

const MAX_IMAGE_SIZE = 4096;


/* ==========================================
   STATUS
========================================== */

function setStatus(message, progress = 0) {
  if (status) {
    status.textContent = message;
  }

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}


/* ==========================================
   SUPPORTED IMAGE TYPES
========================================== */

function isSupportedImage(file) {
  if (!file) {
    return false;
  }

  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
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

  const fileName =
    file.name.toLowerCase();

  return (
    supportedTypes.includes(file.type) ||
    supportedExtensions.some(
      (extension) =>
        fileName.endsWith(extension)
    )
  );
}


/* ==========================================
   LOAD IMAGE
========================================== */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image =
      document.createElement("img");

    const url =
      URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);

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
      URL.revokeObjectURL(url);

      reject(
        new Error(
          "The image could not be decoded. Please try a JPG or PNG image."
        )
      );
    };

    image.src = url;
  });
}


/* ==========================================
   CONVERT IMAGE TO PNG
========================================== */

async function convertToPNG(file) {
  setStatus(
    "Preparing image…",
    5
  );

  const image =
    await loadImage(file);

  let width =
    image.naturalWidth;

  let height =
    image.naturalHeight;


  /* Limit very large images */

  if (
    width > MAX_IMAGE_SIZE ||
    height > MAX_IMAGE_SIZE
  ) {
    const scale =
      Math.min(
        MAX_IMAGE_SIZE / width,
        MAX_IMAGE_SIZE / height
      );

    width =
      Math.round(
        width * scale
      );

    height =
      Math.round(
        height * scale
      );
  }


  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = width;
  canvas.height = height;


  const context =
    canvas.getContext("2d", {
      alpha: true
    });


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


  return new Promise(
    (resolve, reject) => {
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
    }
  );
}


/* ==========================================
   SHOW IMAGE
========================================== */

function showImage(file) {
  if (!preview) {
    return;
  }


  /* Remove previous preview URL */

  if (previewUrl) {
    URL.revokeObjectURL(
      previewUrl
    );

    previewUrl = null;
  }


  previewUrl =
    URL.createObjectURL(file);


  preview.onload = () => {

    /* IMPORTANT:
       Your CSS uses .visible,
       not .show */

    previewCard.classList.add(
      "visible"
    );

    dropZone.style.display =
      "none";


    removeButton.disabled =
      false;

    downloadButton.disabled =
      true;


    setStatus(
      "Image ready. Remove the background.",
      0
    );
  };


  preview.onerror = () => {

    setStatus(
      "The image could not be displayed. Try JPG or PNG.",
      0
    );

    removeButton.disabled =
      true;
  };


  preview.src =
    previewUrl;
}


/* ==========================================
   HANDLE FILE
========================================== */

async function handleFile(file) {

  if (!file) {
    return;
  }


  console.log(
    "Krishna AI Studio selected file:",
    file
  );


  if (!isSupportedImage(file)) {

    setStatus(
      "Unsupported image format. Please select JPG, PNG, WEBP, GIF, BMP or AVIF.",
      0
    );

    return;
  }


  selectedFile =
    file;


  /* Remove old result */

  if (resultUrl) {
    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl = null;
  }


  downloadButton.disabled =
    true;


  try {

    setStatus(
      "Loading image…",
      5
    );


    showImage(file);

  } catch (error) {

    console.error(
      "Krishna AI Studio upload error:",
      error
    );


    setStatus(
      error?.message ||
        "Unable to load image.",
      0
    );
  }
}


/* ==========================================
   REMOVE BACKGROUND
========================================== */

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


    setStatus(
      "Preparing image for AI…",
      10
    );


    /*
      Convert uploaded image to PNG
      before sending it to IMG.LY.
    */

    const processingBlob =
      await convertToPNG(
        selectedFile
      );


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
                  (current / total) *
                    80
                );
            }


            percent =
              Math.min(
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

      URL.revokeObjectURL(
        resultUrl
      );
    }


    /* Create result URL */

    resultUrl =
      URL.createObjectURL(
        resultBlob
      );


    /*
      IMPORTANT:
      Result stays in the SAME
      preview section.
    */

    preview.src =
      resultUrl;


    previewCard.classList.add(
      "visible"
    );

    dropZone.style.display =
      "none";


    downloadButton.disabled =
      false;

    removeButton.disabled =
      false;


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


    removeButton.disabled =
      false;


    setStatus(
      `Error: ${
        error?.message ||
        "Background removal failed."
      }`,
      0
    );
  }
}


/* ==========================================
   DOWNLOAD RESULT
========================================== */

function downloadResult() {

  if (!resultUrl) {

    setStatus(
      "Remove the background first.",
      0
    );

    return;
  }


  const link =
    document.createElement(
      "a"
    );


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


/* ==========================================
   RESET
========================================== */

function resetApp() {

  selectedFile =
    null;


  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl =
      null;
  }


  if (previewUrl) {

    URL.revokeObjectURL(
      previewUrl
    );

    previewUrl =
      null;
  }


  preview.removeAttribute(
    "src"
  );


  previewCard.classList.remove(
    "visible"
  );


  dropZone.style.display =
    "";


  removeButton.disabled =
    true;


  downloadButton.disabled =
    true;


  fileInput.value =
    "";


  setStatus(
    "Select an image to begin.",
    0
  );
}


/* ==========================================
   FILE PICKER
========================================== */

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


    if (file) {

      handleFile(file);
    }
  }
);


/* ==========================================
   DRAG & DROP
========================================== */

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
      event.dataTransfer.files?.[0];


    if (file) {

      handleFile(file);
    }
  }
);


/* ==========================================
   BUTTONS
========================================== */

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


/* ==========================================
   INITIAL STATE
========================================== */

removeButton.disabled =
  true;


downloadButton.disabled =
  true;


setStatus(
  "Select an image to begin.",
  0
);


console.log(
  "Krishna AI Studio loaded successfully."
);
