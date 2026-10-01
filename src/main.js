import { removeBackground } from "@imgly/background-removal";
import { heicTo } from "heic-to";
import UTIF from "utif2";
import { decode as decodePNG } from "fast-png";
import "./style.css";

/* =========================================================
   DOM
========================================================= */

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const previewCard = document.getElementById("previewCard");
const preview = document.getElementById("preview");
const removeButton = document.getElementById("removeButton");
const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");
const status = document.getElementById("status");
const progressBar = document.getElementById("progressBar");

/* =========================================================
   STATE
========================================================= */

let selectedFile = null;
let resultUrl = null;
let previewUrl = null;

const MAX_SIZE = 4096;

/* =========================================================
   STATUS
========================================================= */

function setStatus(message, progress = 0) {
  if (status) {
    status.textContent = message;
  }

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}

/* =========================================================
   EXTENSION
========================================================= */

function getExtension(file) {
  const name = String(file?.name || "").toLowerCase();
  const dot = name.lastIndexOf(".");

  if (dot === -1) {
    return "";
  }

  return name.slice(dot);
}

/* =========================================================
   FORMAT NAME
========================================================= */

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

/* =========================================================
   SUPPORTED FORMATS
========================================================= */

function isSupported(file) {
  if (!file) {
    return false;
  }

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

  const extension = getExtension(file);

  return (
    (file.type &&
      file.type.startsWith("image/")) ||
    extensions.includes(extension)
  );
}

/* =========================================================
   LIMIT DIMENSIONS
========================================================= */

function getLimitedSize(width, height) {
  let outputWidth = width;
  let outputHeight = height;

  if (
    outputWidth > MAX_SIZE ||
    outputHeight > MAX_SIZE
  ) {
    const scale = Math.min(
      MAX_SIZE / outputWidth,
      MAX_SIZE / outputHeight
    );

    outputWidth = Math.max(
      1,
      Math.round(outputWidth * scale)
    );

    outputHeight = Math.max(
      1,
      Math.round(outputHeight * scale)
    );
  }

  return {
    width: outputWidth,
    height: outputHeight
  };
}

/* =========================================================
   CANVAS → PNG FILE
========================================================= */

function canvasToPNGFile(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Could not create the PNG image."
            )
          );
          return;
        }

        const file = new File(
          [blob],
          "krishna-ai-studio-input.png",
          {
            type: "image/png",
            lastModified: Date.now()
          }
        );

        resolve(file);
      },
      "image/png"
    );
  });
}

/* =========================================================
   PNG BYTE DECODER
   ---------------------------------------------------------
   This is the important fix.

   The original PNG is decoded directly from its bytes
   using fast-png instead of the browser's PNG decoder.
========================================================= */

async function decodePNGFile(file) {
  setStatus(
    "Reading PNG image…",
    5
  );

  const buffer =
    await file.arrayBuffer();

  if (!buffer || buffer.byteLength === 0) {
    throw new Error(
      "The PNG file is empty."
    );
  }

  let decoded;

  try {
    decoded = decodePNG(
      new Uint8Array(buffer)
    );
  } catch (error) {
    console.error(
      "fast-png decode error:",
      error
    );

    throw new Error(
      "The PNG file is invalid or corrupted."
    );
  }

  if (
    !decoded ||
    !decoded.width ||
    !decoded.height ||
    !decoded.data
  ) {
    throw new Error(
      "The PNG image contains no readable pixel data."
    );
  }

  const width = decoded.width;
  const height = decoded.height;

  const size =
    getLimitedSize(
      width,
      height
    );

  const sourceData =
    decoded.data;

  const channels =
    decoded.channels || 4;

  const depth =
    decoded.depth || 8;

  const sourcePixelCount =
    width * height;

  const rgba =
    new Uint8ClampedArray(
      sourcePixelCount * 4
    );

  /*
     Convert all PNG color formats
     to standard RGBA.
  */

  if (channels === 4) {
    if (depth === 16) {
      for (
        let i = 0, j = 0;
        i < sourceData.length &&
        j < rgba.length;
        i += 2, j += 1
      ) {
        rgba[j] =
          sourceData[i];
      }
    } else {
      rgba.set(
        sourceData
      );
    }
  }

  else if (channels === 3) {
    if (depth === 16) {
      let sourceIndex = 0;
      let targetIndex = 0;

      for (
        let i = 0;
        i < sourcePixelCount;
        i++
      ) {
        rgba[targetIndex++] =
          sourceData[sourceIndex];

        rgba[targetIndex++] =
          sourceData[sourceIndex + 2];

        rgba[targetIndex++] =
          sourceData[sourceIndex + 4];

        rgba[targetIndex++] =
          255;

        sourceIndex += 6;
      }
    } else {
      let sourceIndex = 0;
      let targetIndex = 0;

      for (
        let i = 0;
        i < sourcePixelCount;
        i++
      ) {
        rgba[targetIndex++] =
          sourceData[sourceIndex++];

        rgba[targetIndex++] =
          sourceData[sourceIndex++];

        rgba[targetIndex++] =
          sourceData[sourceIndex++];

        rgba[targetIndex++] =
          255;
      }
    }
  }

  else if (channels === 2) {
    if (depth === 16) {
      let sourceIndex = 0;
      let targetIndex = 0;

      for (
        let i = 0;
        i < sourcePixelCount;
        i++
      ) {
        const gray =
          sourceData[sourceIndex];

        const alpha =
          sourceData[sourceIndex + 2];

        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = alpha;

        sourceIndex += 4;
      }
    } else {
      let sourceIndex = 0;
      let targetIndex = 0;

      for (
        let i = 0;
        i < sourcePixelCount;
        i++
      ) {
        const gray =
          sourceData[sourceIndex++];

        const alpha =
          sourceData[sourceIndex++];

        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = alpha;
      }
    }
  }

  else if (channels === 1) {
    if (depth === 16) {
      let sourceIndex = 0;
      let targetIndex = 0;

      for (
        let i = 0;
        i < sourcePixelCount;
        i++
      ) {
        const gray =
          sourceData[sourceIndex];

        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = 255;

        sourceIndex += 2;
      }
    } else {
      let sourceIndex = 0;
      let targetIndex = 0;

      for (
        let i = 0;
        i < sourcePixelCount;
        i++
      ) {
        const gray =
          sourceData[sourceIndex++];

        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = gray;
        rgba[targetIndex++] = 255;
      }
    }
  }

  else {
    throw new Error(
      "This PNG color format is not supported."
    );
  }

  /*
     Create source ImageData.
  */

  const sourceCanvas =
    document.createElement(
      "canvas"
    );

  sourceCanvas.width = width;
  sourceCanvas.height = height;

  const sourceContext =
    sourceCanvas.getContext(
      "2d",
      {
        alpha: true
      }
    );

  if (!sourceContext) {
    throw new Error(
      "Canvas is not supported by this browser."
    );
  }

  const imageData =
    new ImageData(
      rgba,
      width,
      height
    );

  sourceContext.putImageData(
    imageData,
    0,
    0
  );

  /*
     Resize if necessary.
  */

  const outputCanvas =
    document.createElement(
      "canvas"
    );

  outputCanvas.width =
    size.width;

  outputCanvas.height =
    size.height;

  const outputContext =
    outputCanvas.getContext(
      "2d",
      {
        alpha: true
      }
    );

  if (!outputContext) {
    throw new Error(
      "Could not create output canvas."
    );
  }

  outputContext.clearRect(
    0,
    0,
    size.width,
    size.height
  );

  outputContext.drawImage(
    sourceCanvas,
    0,
    0,
    size.width,
    size.height
  );

  return canvasToPNGFile(
    outputCanvas
  );
}

/* =========================================================
   NORMAL IMAGE → PNG
========================================================= */

async function normalImageToPNG(file) {
  /*
     PNG gets its own decoder.
  */

  if (
    getExtension(file) === ".png"
  ) {
    return decodePNGFile(file);
  }

  setStatus(
    "Preparing image…",
    5
  );

  /*
     Other normal formats use the browser.
  */

  const url =
    URL.createObjectURL(file);

  try {
    const image =
      await new Promise(
        (resolve, reject) => {
          const img =
            new Image();

          img.onload = () => {
            resolve(img);
          };

          img.onerror = () => {
            reject(
              new Error(
                "This image format could not be decoded by your browser."
              )
            );
          };

          img.src = url;
        }
      );

    const size =
      getLimitedSize(
        image.naturalWidth,
        image.naturalHeight
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      size.width;

    canvas.height =
      size.height;

    const context =
      canvas.getContext(
        "2d",
        {
          alpha: true
        }
      );

    if (!context) {
      throw new Error(
        "Canvas is not supported."
      );
    }

    context.drawImage(
      image,
      0,
      0,
      size.width,
      size.height
    );

    return canvasToPNGFile(
      canvas
    );

  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}

/* =========================================================
   HEIC / HEIF
========================================================= */

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

  const url =
    URL.createObjectURL(
      result
    );

  try {
    const image =
      await new Promise(
        (resolve, reject) => {
          const img =
            new Image();

          img.onload = () => {
            resolve(img);
          };

          img.onerror = () => {
            reject(
              new Error(
                "Converted HEIC image could not be decoded."
              )
            );
          };

          img.src = url;
        }
      );

    const size =
      getLimitedSize(
        image.naturalWidth,
        image.naturalHeight
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      size.width;

    canvas.height =
      size.height;

    const context =
      canvas.getContext(
        "2d"
      );

    context.drawImage(
      image,
      0,
      0,
      size.width,
      size.height
    );

    return canvasToPNGFile(
      canvas
    );

  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}

/* =========================================================
   TIFF
========================================================= */

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

  const size =
    getLimitedSize(
      width,
      height
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    size.width;

  canvas.height =
    size.height;

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
    size.width,
    size.height
  );

  return canvasToPNGFile(
    canvas
  );
}

/* =========================================================
   SVG
========================================================= */

async function convertSVG(file) {
  setStatus(
    "Converting SVG…",
    8
  );

  const text =
    await file.text();

  const blob =
    new Blob(
      [text],
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
            resolve(img);
          };

          img.onerror = () => {
            reject(
              new Error(
                "SVG could not be decoded."
              )
            );
          };

          img.src = url;
        }
      );

    const width =
      image.naturalWidth || 1024;

    const height =
      image.naturalHeight || 1024;

    const size =
      getLimitedSize(
        width,
        height
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      size.width;

    canvas.height =
      size.height;

    const context =
      canvas.getContext(
        "2d"
      );

    context.drawImage(
      image,
      0,
      0,
      size.width,
      size.height
    );

    return canvasToPNGFile(
      canvas
    );

  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}

/* =========================================================
   PREPARE FOR AI
========================================================= */

async function prepareForAI(file) {
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

  if (ext === ".svg") {
    return convertSVG(file);
  }

  return normalImageToPNG(file);
}

/* =========================================================
   CREATE PREVIEW
========================================================= */

async function createPreview(file) {
  const ext =
    getExtension(file);

  /*
     PNG:
     Decode directly with fast-png,
     then display the clean PNG.
  */

  if (ext === ".png") {
    const png =
      await decodePNGFile(file);

    return URL.createObjectURL(
      png
    );
  }

  /*
     Special formats.
  */

  if (
    ext === ".heic" ||
    ext === ".heif" ||
    ext === ".tif" ||
    ext === ".tiff" ||
    ext === ".svg"
  ) {
    const png =
      await prepareForAI(file);

    return URL.createObjectURL(
      png
    );
  }

  /*
     Normal browser-supported images.
  */

  return URL.createObjectURL(
    file
  );
}

/* =========================================================
   HANDLE FILE
========================================================= */

async function handleFile(file) {
  if (!file) {
    return;
  }

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

    preview.onload = () => {
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

    preview.onerror = () => {
      removeButton.disabled =
        true;

      setStatus(
        "The image preview could not be displayed.",
        0
      );
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

/* =========================================================
   REMOVE BACKGROUND
========================================================= */

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
      "Preparing image for AI…",
      5
    );

    /*
       For PNG this uses fast-png,
       so the original browser decoder
       is completely bypassed.
    */

    const inputFile =
      await prepareForAI(
        selectedFile
      );

    if (!inputFile) {
      throw new Error(
        "Could not prepare the source image."
      );
    }

    if (
      inputFile.type !==
      "image/png"
    ) {
      throw new Error(
        "The prepared image is not a valid PNG."
      );
    }

    setStatus(
      "Starting AI bac
