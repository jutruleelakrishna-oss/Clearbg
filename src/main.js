import { removeBackground } from "@imgly/background-removal";
import { heicTo } from "heic-to";
import UTIF from "utif2";
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
let previewUrl = null;

const MAX_SIZE = 4096;

function setStatus(message, progress = 0) {
  if (status) status.textContent = message;
  if (progressBar) progressBar.style.width = `${progress}%`;
}

function getExtension(file) {
  const name = (file?.name || "").toLowerCase();
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}

function getFormatName(file) {
  const formats = {
    ".jpg": "JPG",
    ".jpeg": "JPEG",
    ".png": "PNG",
    ".webp": "WEBP",
    ".gif": "GIF",
    ".bmp": "BMP",
    ".avif": "AVIF",
    ".ico": "ICO",
    ".svg": "SVG",
    ".tif": "TIFF",
    ".tiff": "TIFF",
    ".heic": "HEIC",
    ".heif": "HEIF"
  };

  return formats[getExtension(file)] || "IMAGE";
}

function isSupported(file) {
  if (!file) return false;

  const extensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif",
    ".ico",
    ".svg",
    ".tif",
    ".tiff",
    ".heic",
    ".heif"
  ];

  return (
    (file.type && file.type.startsWith("image/")) ||
    extensions.includes(getExtension(file))
  );
}

/* ==========================================
   LOAD IMAGE DIRECTLY FROM FILE
========================================== */

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      if (
        image.naturalWidth > 0 &&
        image.naturalHeight > 0
      ) {
        resolve(image);
      } else {
        reject(
          new Error(
            "The image has invalid dimensions."
          )
        );
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(
        new Error(
          `The ${getFormatName(file)} image could not be decoded by this browser.`
        )
      );
    };

    image.src = url;
  });
}

/* ==========================================
   CANVAS TO PNG
========================================== */

function canvasToPNG(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error(
              "Could not convert the image to PNG."
            )
          );
        }
      },
      "image/png"
    );
  });
}

/* ==========================================
   NORMAL IMAGE TO PNG
========================================== */

async function normalImageToPNG(file) {
  setStatus("Reading image…", 5);

  const image =
    await loadImageFromFile(file);

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (
    width > MAX_SIZE ||
    height > MAX_SIZE
  ) {
    const scale = Math.min(
      MAX_SIZE / width,
      MAX_SIZE / height
    );

    width = Math.max(
      1,
      Math.round(width * scale)
    );

    height = Math.max(
      1,
      Math.round(height * scale)
    );
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext("2d");

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

  return canvasToPNG(canvas);
}

/* ==========================================
   HEIC / HEIF
========================================== */

async function convertHEIC(file) {
  setStatus(
    "Converting HEIC/HEIF…",
    8
  );

  const result =
    await heicTo({
      blob: file,
      type: "image/png"
    });

  if (!result) {
    throw new Error(
      "HEIC/HEIF conversion failed."
    );
  }

  return result;
}

/* ==========================================
   TIFF
========================================== */

async function convertTIFF(file) {
  setStatus(
    "Converting TIFF…",
    8
  );

  const buffer =
    await file.arrayBuffer();

  const images =
    UTIF.decode(buffer);

  if (
    !images ||
    images.length === 0
  ) {
    throw new Error(
      "Could not decode the TIFF image."
    );
  }

  UTIF.decodeImage(
    buffer,
    images[0]
  );

  const width =
    images[0].width;

  const height =
    images[0].height;

  const rgba =
    UTIF.toRGBA8(
      images[0]
    );

  if (
    !width ||
    !height ||
    !rgba
  ) {
    throw new Error(
      "The TIFF image contains invalid data."
    );
  }

  const sourceCanvas =
    document.createElement(
      "canvas"
    );

  sourceCanvas.width =
    width;

  sourceCanvas.height =
    height;

  const sourceContext =
    sourceCanvas.getContext(
      "2d"
    );

  if (!sourceContext) {
    throw new Error(
      "Could not create TIFF canvas."
    );
  }

  const imageData =
    sourceContext.createImageData(
      width,
      height
    );

  imageData.data.set(
    rgba
  );

  sourceContext.putImageData(
    imageData,
    0,
    0
  );

  let outputWidth =
    width;

  let outputHeight =
    height;

  if (
    outputWidth > MAX_SIZE ||
    outputHeight > MAX_SIZE
  ) {
    const scale =
      Math.min(
        MAX_SIZE / outputWidth,
        MAX_SIZE / outputHeight
      );

    outputWidth =
      Math.round(
        outputWidth * scale
      );

    outputHeight =
      Math.round(
        outputHeight * scale
      );
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    outputWidth;

  canvas.height =
    outputHeight;

  const context =
    canvas.getContext(
      "2d"
    );

  if (!context) {
    throw new Error(
      "Could not create output canvas."
    );
  }

  context.drawImage(
    sourceCanvas,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return canvasToPNG(
    canvas
  );
}

/* ==========================================
   SVG
========================================== */

async function convertSVG(file) {
  setStatus(
    "Converting SVG…",
    8
  );

  const svgText =
    await file.text();

  const blob =
    new Blob(
      [svgText],
      {
        type: "image/svg+xml"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  try {
    const image =
      await new Promise(
        (resolve, reject) => {
          const img =
            new Image();

          img.onload = () => {
            if (
              img.naturalWidth > 0 &&
              img.naturalHeight > 0
            ) {
              resolve(img);
            } else {
              reject(
                new Error(
                  "SVG has invalid dimensions."
                )
              );
            }
          };

          img.onerror = () => {
            reject(
              new Error(
                "The SVG image could not be decoded."
              )
            );
          };

          img.src = url;
        }
      );

    let width =
      image.naturalWidth;

    let height =
      image.naturalHeight;

    if (
      width > MAX_SIZE ||
      height > MAX_SIZE
    ) {
      const scale =
        Math.min(
          MAX_SIZE / width,
          MAX_SIZE / height
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

    canvas.width =
      width;

    canvas.height =
      height;

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      throw new Error(
        "Could not create SVG canvas."
      );
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    return canvasToPNG(
      canvas
    );
  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}

/* ==========================================
   CONVERT ANY SUPPORTED FILE TO PNG
========================================== */

async function convertToPNG(file) {
  const ext =
    getExtension(file);

  if (
    ext === ".heic" ||
    ext === ".heif"
  ) {
    return convertHEIC(file);
  }

  if (
    ext === ".tif" ||
    ext === ".tiff"
  ) {
    return convertTIFF(file);
  }

  if (
    ext === ".svg"
  ) {
    return convertSVG(file);
  }

  return normalImageToPNG(file);
}

/* ==========================================
   PREVIEW
========================================== */

async function createPreview(file) {
  const ext =
    getExtension(file);

  if (
    ext === ".heic" ||
    ext === ".heif" ||
    ext === ".tif" ||
    ext === ".tiff" ||
    ext === ".svg"
  ) {
    const png =
      await convertToPNG(file);

    return URL.createObjectURL(
      png
    );
  }

  /*
     IMPORTANT:
     Direct Blob URL.
     No FileReader.
  */

  return URL.createObjectURL(
    file
  );
}

/* ==========================================
   HANDLE UPLOAD
========================================== */

async function handleFile(file) {
  if (!file) return;

  console.log(
    "Selected file:",
    file.name,
    file.type,
    file.size
  );

  if (file.size === 0) {
    setStatus(
      "The selected file is empty.",
      0
    );
    return;
  }

  if (!isSupported(file)) {
    setStatus(
      "Unsupported image format.",
      0
    );
    return;
  }

  selectedFile =
    file;

  if (resultUrl) {
    URL.revokeObjectURL(
      resultUrl
    );
    resultUrl = null;
  }

  if (
    previewUrl &&
    previewUrl.startsWith("blob:")
  ) {
    URL.revokeObjectURL(
      previewUrl
    );
  }

  previewUrl = null;

  removeButton.disabled =
    true;

  downloadButton.disabled =
    true;

  downloadButton.style.display =
    "none";

  try {
    setStatus(
      "Loading image…",
      3
    );

    previewUrl =
      await createPreview(
        file
      );

    preview.onload =
      () => {
        previewCard.classList.add(
          "visible"
        );

        dropZone.style.display =
          "none";

        removeButton.disabled =
          false;

        setStatus(
          `${getFormatName(file)} image ready.`,
          0
        );
      };

    preview.onerror =
      () => {
        setStatus(
          `The ${getFormatName(file)} image could not be displayed.`,
          0
        );

        removeButton.disabled =
          true;
      };

    preview.src =
      previewUrl;

  } catch (error) {
    console.error(
      "Upload error:",
      error
    );

    selectedFile =
      null;

    removeButton.disabled =
      true;

    setStatus(
      `Error: ${
        error?.message ||
        "The image could not be loaded."
      }`,
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

    downloadButton.style.display =
      "none";

    setStatus(
      "Preparing image…",
      5
    );

    const inputBlob =
      await convertToPNG(
        selectedFile
      );

    setStatus(
      "Starting AI background removal…",
      15
    );

    const resultBlob =
      await removeBackground(
        inputBlob,
        {
          debug: false,

          publicPath:
            "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",

          device: "cpu",

          model:
            "isnet_quint8",

          progress:
            (
              key,
              current,
              total
            ) => {
              if (total) {
                const percent =
                  Math.min(
                    95,
                    15 +
                      Math.round(
                        (current /
                          total) *
                          80
                      )
                  );

                setStatus(
                  `Removing background… ${percent}%`,
                  percent
                );
              }
            }
        }
      );

    if (!resultBlob) {
      throw new Error(
        "AI processing did not return an image."
      );
    }

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
       Replace image in the SAME
       preview section.
    */

    preview.src =
      resultUrl;

    previewCard.classList.add(
      "visible"
    );

    dropZone.style.display =
      "none";

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
      "Background removal error:",
      error
    );

    removeButton.disabled =
      false;

    downloadButton.disabled =
      true;

    downloadButton.style.display =
      "none";

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
   DOWNLOAD
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
    resultUrl = null;
  }

  if (
    previewUrl &&
    previewUrl.startsWith("blob:")
  ) {
    URL.revokeObjectURL(
      previewUrl
    );
  }

  previewUrl = null;

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

  downloadButton.style.display =
    "none";

  fileInput.value =
    "";

  setStatus(
    "Select an image to begin.",
    0
  );
}

/* ==========================================
   EVENTS
========================================== */

fileInput.addEventListener(
  "change",
  (event) => {
    const file =
      event.target.files?.[0];

    handleFile(file);
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
      "drag-over"
    );
  }
);

dropZone.addEventListener(
  "dragleave",
  () => {
    dropZone.classList.remove(
      "drag-over"
    );
  }
);

dropZone.addEventListener(
  "drop",
  (event) => {
    event.preventDefault();

    dropZone.classList.remove(
      "drag-over"
    );

    const file =
      event.dataTransfer?.files?.[0];

    handleFile(file);
  }
);

/* ==========================================
   INITIAL STATE
========================================== */

removeButton.disabled =
  true;

downloadButton.disabled =
  true;

downloadButton.style.display =
  "none";

setStatus(
  "Select an image to begin.",
  0
);

console.log(
  "Krishna AI Studio loaded successfully."
);
