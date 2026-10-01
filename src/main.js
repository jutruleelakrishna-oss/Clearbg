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
   SUPPORTED FORMATS
========================================== */

function isSupportedImage(file) {
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

  const name = (file.name || "").toLowerCase();

  return (
    (file.type && file.type.startsWith("image/")) ||
    extensions.some((ext) => name.endsWith(ext))
  );
}


/* ==========================================
   FORMAT NAME
========================================== */

function getFormatName(file) {
  const name = (file.name || "").toLowerCase();

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
   EXTENSION
========================================== */

function getFileExtension(file) {
  const name = (file.name || "").toLowerCase();
  const position = name.lastIndexOf(".");

  return position === -1
    ? ""
    : name.substring(position);
}


/* ==========================================
   READ FILE AS DATA URL
========================================== */

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(
          new Error(
            "The image data could not be read."
          )
        );
      }
    };

    reader.onerror = () => {
      reject(
        new Error(
          "The selected file could not be read."
        )
      );
    };

    reader.onabort = () => {
      reject(
        new Error(
          "Reading the selected file was cancelled."
        )
      );
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(
        new Error(
          "The selected file could not be read."
        )
      );
    }
  });
}


/* ==========================================
   LOAD IMAGE FROM DATA URL
========================================== */

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();

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
          "The image could not be decoded by this browser."
        )
      );
    };

    img.src = dataUrl;
  });
}


/* ==========================================
   NORMAL IMAGE DECODER
========================================== */

async function decodeNormalImage(file) {

  /*
     IMPORTANT:
     Use FileReader first.

     This is more reliable on many
     Android browsers than createImageBitmap.
  */

  setStatus(
    "Reading image…",
    5
  );


  try {

    const dataUrl =
      await readFileAsDataURL(
        file
      );


    const image =
      await loadImage(
        dataUrl
      );


    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight
    };

  } catch (firstError) {

    console.warn(
      "FileReader image decoding failed:",
      firstError
    );


    /*
       Fallback to createImageBitmap
    */

    if (
      typeof createImageBitmap ===
      "function"
    ) {

      try {

        const bitmap =
          await createImageBitmap(
            file
          );


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

      } catch (secondError) {

        console.warn(
          "createImageBitmap failed:",
          secondError
        );
      }
    }


    throw new Error(
      `The ${getFormatName(file)} image could not be decoded.`
    );
  }
}


/* ==========================================
   CANVAS → PNG
========================================== */

function canvasToPNG(canvas) {
  return new Promise((resolve, reject) => {

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

  });
}


/* ==========================================
   IMAGE → PNG
========================================== */

async function imageToPNG(
  image,
  sourceWidth,
  sourceHeight
) {

  let width = sourceWidth;
  let height = sourceHeight;


  /*
     Prevent extremely large
     canvas allocations.
  */

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
      Math.max(
        1,
        Math.round(width * scale)
      );

    height =
      Math.max(
        1,
        Math.round(height * scale)
      );
  }


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width = width;
  canvas.height = height;


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
    UTIF.decode(
      buffer
    );


  if (
    !ifds ||
    ifds.length === 0
  ) {

    throw new Error(
      "Could not decode the TIFF image."
    );
  }


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


  let outputWidth = width;
  let outputHeight = height;


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


  const sourceCanvas =
    document.createElement(
      "canvas"
    );


  sourceCanvas.width = width;
  sourceCanvas.height = height;


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
   CONVERT FILE → PNG
========================================== */

async function convertToPNG(file) {

  const extension =
    getFileExtension(file);


  if (
    extension === ".heic" ||
    extension === ".heif"
  ) {

    return await convertHEICToPNG(
      file
    );
  }


  if (
    extension === ".tif" ||
    extension === ".tiff"
  ) {

    return await convertTIFFToPNG(
      file
    );
  }


  if (
    extension === ".svg"
  ) {

    return await convertSVGToPNG(
      file
    );
  }


  /*
     JPG
     JPEG
     PNG
     WEBP
     GIF
     BMP
     AVIF
     ICO
  */

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


  if (
    decoded.isBitmap &&
    decoded.image.close
  ) {

    decoded.image.close();
  }


  return png;
}


/* ==========================================
   CREATE PREVIEW
========================================== */

async function createPreviewURL(file) {

  const extension =
    getFileExtension(file);


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


  /*
     For normal browser-supported
     images, use FileReader instead
     of direct object URL.

     This gives us a reliable
     decoded preview.
  */

  const dataUrl =
    await readFileAsDataURL(
      file
    );


  return dataUrl;
}


/* ==========================================
   SHOW IMAGE
========================================== */

async function showImage(file) {

  if (previewUrl) {

    if (
      previewUrl.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        previewUrl
      );
    }

    previewUrl =
      null;
  }


  setStatus(
    "Loading image…",
    3
  );


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


  if (file.size === 0) {

    setStatus(
      "The selected file is empty.",
      0
    );

    return;
  }


  if (!isSupportedImage(file)) {

    setStatus(
      "Unsupported image format. Supported: JPG, JPEG, PNG, WEBP, GIF, BMP, AVIF, ICO, SVG, TIFF, HEIC and HEIF.",
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


    downloadButton.disabled =
      true;


    downloadButton.style.display =
      "none";


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


    setStatus(
      "Preparing image…",
      5
    );


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
       SAME preview section
    */

    preview.src =
      resultUrl;


    previewCard.classList.add(
      "visible"
    );


    dropZone.style.display =
      "none";


    /*
       SHOW DOWNLOAD
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


  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl =
      null;
  }


  if (previewUrl) {

    if (
      previewUrl.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        previewUrl
      );
    }

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


  downloadButton.style.display =
    "none";


  fileInput.value =
    "";


  setStatus(
    "Select an image to begin.",
    0
  );


  console.log(
  "Krishna AI Studio loaded successfully."
);
}
