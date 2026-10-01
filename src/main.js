import { removeBackground } from "@imgly/background-removal";
import { heicTo } from "heic-to";
import UTIF from "utif2";
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
    "image/x-ms-bmp",
    "image/avif",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/svg+xml",
    "image/tiff",
    "image/heic",
    "image/heif"
  ];

  const supportedExtensions = [
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

  const fileName =
    (file.name || "").toLowerCase();

  return (
    supportedTypes.includes(file.type) ||
    supportedExtensions.some(
      (extension) =>
        fileName.endsWith(extension)
    )
  );
}


/* ==========================================
   FILE TYPE NAME
========================================== */

function getFormatName(file) {
  const name =
    (file.name || "").toLowerCase();

  if (name.endsWith(".jpg")) return "JPG";
  if (name.endsWith(".jpeg")) return "JPEG";
  if (name.endsWith(".png")) return "PNG";
  if (name.endsWith(".webp")) return "WEBP";
  if (name.endsWith(".gif")) return "GIF";
  if (name.endsWith(".bmp")) return "BMP";
  if (name.endsWith(".avif")) return "AVIF";
  if (name.endsWith(".ico")) return "ICO";
  if (name.endsWith(".svg")) return "SVG";
  if (name.endsWith(".tif")) return "TIFF";
  if (name.endsWith(".tiff")) return "TIFF";
  if (name.endsWith(".heic")) return "HEIC";
  if (name.endsWith(".heif")) return "HEIF";

  return "IMAGE";
}


/* ==========================================
   FILE EXTENSION
========================================== */

function getFileExtension(file) {
  const name =
    (file.name || "").toLowerCase();

  const dot =
    name.lastIndexOf(".");

  if (dot === -1) {
    return "";
  }

  return name.substring(dot);
}


/* ==========================================
   NORMAL IMAGE DECODER
========================================== */

async function decodeNormalImage(file) {

  /* ----------------------------------------
     METHOD 1: createImageBitmap
  ---------------------------------------- */

  if ("createImageBitmap" in window) {
    try {
      const bitmap =
        await createImageBitmap(file);

      if (
        bitmap.width > 0 &&
        bitmap.height > 0
      ) {
        return {
          image: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          isBitmap: true
        };
      }
    } catch (error) {
      console.warn(
        "createImageBitmap failed:",
        error
      );
    }
  }


  /* ----------------------------------------
     METHOD 2: FileReader + Image
  ---------------------------------------- */

  const dataUrl =
    await new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();

        reader.onload = () => {
          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(
            new Error(
              "The selected file could not be read."
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );


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
                "The image has invalid dimensions."
              )
            );
          }
        };

        img.onerror = () => {
          reject(
            new Error(
              `The ${getFormatName(file)} image could not be decoded by this browser.`
            )
          );
        };

        img.src = dataUrl;
      }
    );


  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    isBitmap: false
  };
}


/* ==========================================
   CANVAS → PNG
========================================== */

function canvasToPNG(canvas) {
  return new Promise(
    (resolve, reject) => {

      canvas.toBlob(
        (blob) => {

          if (!blob) {
            reject(
              new Error(
                "The image could not be converted to PNG."
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
   IMAGE → PNG
========================================== */

async function imageToPNG(
  image,
  sourceWidth,
  sourceHeight
) {

  let width =
    sourceWidth;

  let height =
    sourceHeight;


  /* ----------------------------------------
     Limit huge images
  ---------------------------------------- */

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

  canvas.width =
    width;

  canvas.height =
    height;


  const context =
    canvas.getContext(
      "2d",
      {
        alpha: true
      }
    );


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


  return await canvasToPNG(
    canvas
  );
}


/* ==========================================
   HEIC / HEIF → PNG
========================================== */

async function convertHEICToPNG(file) {

  setStatus(
    "Converting HEIC/HEIF image…",
    8
  );


  const png =
    await heicTo({
      blob: file,
      type: "image/png"
    });


  if (!png) {
    throw new Error(
      "HEIC/HEIF conversion failed."
    );
  }


  return png;
}


/* ==========================================
   TIFF → PNG
========================================== */

async function convertTIFFToPNG(file) {

  setStatus(
    "Reading TIFF image…",
    8
  );


  const buffer =
    await file.arrayBuffer();


  const ifds =
    UTIF.decode(buffer);


  if (
    !ifds ||
    !ifds.length
  ) {
    throw new Error(
      "Could not decode the TIFF image."
    );
  }


  /* Decode first TIFF image */

  UTIF.decodeImage(
    buffer,
    ifds[0]
  );


  const rgba =
    UTIF.toRGBA8(
      ifds[0]
    );


  const width =
    ifds[0].width;

  const height =
    ifds[0].height;


  if (
    !width ||
    !height
  ) {
    throw new Error(
      "The TIFF image has invalid dimensions."
    );
  }


  /* ----------------------------------------
     Limit huge TIFF images
  ---------------------------------------- */

  let outputWidth =
    width;

  let outputHeight =
    height;


  if (
    outputWidth > MAX_IMAGE_SIZE ||
    outputHeight > MAX_IMAGE_SIZE
  ) {

    const scale =
      Math.min(
        MAX_IMAGE_SIZE / outputWidth,
        MAX_IMAGE_SIZE / outputHeight
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


  /* ----------------------------------------
     Output canvas
  ---------------------------------------- */

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
      "2d",
      {
        alpha: true
      }
    );


  if (!context) {
    throw new Error(
      "Your browser does not support TIFF processing."
    );
  }


  /* ----------------------------------------
     Source canvas
  ---------------------------------------- */

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


  /* ----------------------------------------
     Resize if necessary
  ---------------------------------------- */

  context.drawImage(
    sourceCanvas,
    0,
    0,
    outputWidth,
    outputHeight
  );


  return await canvasToPNG(
    canvas
  );
}


/* ==========================================
   SVG → PNG
========================================== */

async function convertSVGToPNG(file) {

  setStatus(
    "Converting SVG image…",
    8
  );


  const svgText =
    await file.text();


  const svgBlob =
    new Blob(
      [svgText],
      {
        type: "image/svg+xml"
      }
    );


  const url =
    URL.createObjectURL(
      svgBlob
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


    return await imageToPNG(
      image,
      image.naturalWidth,
      image.naturalHeight
    );

  } finally {

    URL.revokeObjectURL(
      url
    );
  }
}


/* ==========================================
   CONVERT ANY SUPPORTED FILE → PNG
========================================== */

async function convertToPNG(file) {

  const extension =
    getFileExtension(file);


  /* ----------------------------------------
     HEIC / HEIF
  ---------------------------------------- */

  if (
    extension === ".heic" ||
    extension === ".heif"
  ) {
    return await convertHEICToPNG(
      file
    );
  }


  /* ----------------------------------------
     TIFF / TIF
  ---------------------------------------- */

  if (
    extension === ".tif" ||
    extension === ".tiff"
  ) {
    return await convertTIFFToPNG(
      file
    );
  }


  /* ----------------------------------------
     SVG
  ---------------------------------------- */

  if (
    extension === ".svg"
  ) {
    return await convertSVGToPNG(
      file
    );
  }


  /* ----------------------------------------
     Normal browser images

     JPG
     JPEG
     PNG
     WEBP
     GIF
     BMP
     AVIF
     ICO
  ---------------------------------------- */

  setStatus(
    "Reading image…",
    5
  );


  const decoded =
    await decodeNormalImage(
      file
    );


  const png =
    await imageToPNG(
      decoded.image,
      decoded.width,
      decoded.height
    );


  /* Close bitmap */

  if (
    decoded.isBitmap &&
    decoded.image.close
  ) {
    decoded.image.close();
  }


  return png;
}


/* ==========================================
   PREVIEW SUPPORTED FILE
========================================== */

async function createPreviewURL(file) {

  const extension =
    getFileExtension(file);


  /* HEIC / HEIF */

  if (
    extension === ".heic" ||
    extension === ".heif"
  ) {

    const png =
      await convertHEICToPNG(
        file
      );

    return URL.createObjectURL(
      png
    );
  }


  /* TIFF / TIF */

  if (
    extension === ".tif" ||
    extension === ".tiff"
  ) {

    const png =
      await convertTIFFToPNG(
        file
      );

    return URL.createObjectURL(
      png
    );
  }


  /* SVG */

  if (
    extension === ".svg"
  ) {

    const png =
      await convertSVGToPNG(
        file
      );

    return URL.createObjectURL(
      png
    );
  }


  /* Normal image */

  return URL.createObjectURL(
    file
  );
}


/* ==========================================
   SHOW IMAGE
========================================== */

async function showImage(file) {

  /* Remove previous preview */

  if (previewUrl) {

    URL.revokeObjectURL(
      previewUrl
    );

    previewUrl =
      null;
  }


  setStatus(
    "Loading image…",
    3
  );


  /* Convert special formats */

  previewUrl =
    await createPreviewURL(
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


      downloadButton.disabled =
        true;


      downloadButton.style.display =
        "none";


      setStatus(
        `${getFormatName(file)} image ready. Remove the background.`,
        0
      );
    };


  preview.onerror =
    () => {

      removeButton.disabled =
        true;


      setStatus(
        `The ${getFormatName(file)} image could not be displayed.`,
        0
      );
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
    {
      name: file.name,
      type: file.type,
      size: file.size
    }
  );


  /* Empty file */

  if (
    file.size === 0
  ) {

    setStatus(
      "The selected file is empty.",
      0
    );

    return;
  }


  /* Format validation */

  if (
    !isSupportedImage(file)
  ) {

    setStatus(
      "Unsupported image format. Supported: JPG, JPEG, PNG, WEBP, GIF, BMP, AVIF, ICO, SVG, TIFF, HEIC and HEIF.",
      0
    );

    return;
  }


  /* Save file */

  selectedFile =
    file;


  /* Remove old result */

  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl =
      null;
  }


  downloadButton.disabled =
    true;

  downloadButton.style.display =
    "none";


  try {

    await showImage(
      file
    );

  } catch (error) {

    console.error(
      "Krishna AI Studio upload error:",
      error
    );


    selectedFile =
      null;


    removeButton.disabled =
      true;


    setStatus(
      `Error: ${
        error?.message ||
        "The selected file could not be read."
      }`,
      0
    );
  }
}


/* ==========================================
   PROCESS IMAGE
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


    /* Step 1 */

    setStatus(
      "Preparing image…",
      5
    );


    /* Convert selected format to PNG */

    const processingBlob =
      await convertToPNG(
        selectedFile
      );


    /* Step 2 */

    setStatus(
      "Starting AI background removal…",
      15
    );


    console.log(
      "Krishna AI Studio: AI processing started"
    );


    /* Step 3: IMG.LY */

    const resultBlob =
      await removeBackground(
        processingBlob,
        {
          debug: true,

          publicPath:
            "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",

          device:
            "cpu",

          model:
            "isnet_quint8",

          progress:
            (
              key,
              current,
              total
            ) => {

              let percent =
                15;


              if (total) {

                percent =
                  15 +
                  Math.round(
                    (
                      current /
                      total
                    ) * 80
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


    /* Verify result */

    if (!resultBlob) {

      throw new Error(
        "AI processing did not return an image."
      );
    }


    /* Remove old result */

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


    /* SAME preview section */

    preview.src =
      resultUrl;


    previewCard.classList.add(
      "visible"
    );


    dropZone.style.display =
      "none";


    /* SHOW DOWNLOAD BUTTON */

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
      "Krishna AI Studio: Processing complete"
    );

  } catch (error) {

    console.error(
      "Krishna AI Studio processing error:",
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


  /* Remove result URL */

  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl =
      null;
  }


    /* Remove preview URL */

  if (previewUrl) {

    URL.revokeObjectURL(
      previewUrl
    );

    previewUrl =
      null;
  }


  /* Clear preview */

  preview.removeAttribute(
    "src"
  );


  previewCard.classList.remove(
    "visible"
  );


  /* Show upload section */

  dropZone.style.display =
    "";


  /* Reset buttons */

  removeButton.disabled =
    true;


  downloadButton.disabled =
    true;


  downloadButton.style.display =
    "none";


  /* Reset file input */

  fileInput.value =
    "";


  /* Reset status */

  setStatus(
    "Select an image to begin.",
    0
  );


  console.log(
    "Krishna AI Studio reset."
  );
}


/* ==========================================
   FILE INPUT
========================================== */

fileInput.addEventListener(
  "change",
  async (event) => {

    const file =
      event.target.files?.[0];

    if (file) {

      await handleFile(
        file
      );
    }
  }
);


/* ==========================================
   REMOVE BACKGROUND BUTTON
========================================== */

removeButton.addEventListener(
  "click",
  async () => {

    await processImage();
  }
);


/* ==========================================
   DOWNLOAD BUTTON
========================================== */

downloadButton.addEventListener(
  "click",
  () => {

    downloadResult();
  }
);


/* ==========================================
   RESET BUTTON
========================================== */

resetButton.addEventListener(
  "click",
  () => {

    resetApp();
  }
);


/* ==========================================
   CLICK DROP ZONE
========================================== */

dropZone.addEventListener(
  "click",
  () => {

    fileInput.click();
  }
);


/* ==========================================
   DRAG OVER
========================================== */

dropZone.addEventListener(
  "dragover",
  (event) => {

    event.preventDefault();

    dropZone.classList.add(
      "drag-over"
    );
  }
);


/* ==========================================
   DRAG LEAVE
========================================== */

dropZone.addEventListener(
  "dragleave",
  () => {

    dropZone.classList.remove(
      "drag-over"
    );
  }
);


/* ==========================================
   DROP FILE
========================================== */

dropZone.addEventListener(
  "drop",
  async (event) => {

    event.preventDefault();

    dropZone.classList.remove(
      "drag-over"
    );


    const file =
      event.dataTransfer?.files?.[0];


    if (file) {

      await handleFile(
        file
      );
    }
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
