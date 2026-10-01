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
   RELIABLE IMAGE DECODER
========================================== */

async function decodeImage(file) {

  /*
     METHOD 1
     Native createImageBitmap
  */

  if (
    "createImageBitmap" in window
  ) {

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


  /*
     METHOD 2
     FileReader + Image
  */

  const dataUrl =
    await new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();


        reader.onload =
          () => {

            resolve(
              reader.result
            );
          };


        reader.onerror =
          () => {

            reject(
              new Error(
                "The selected file could not be read."
              )
            );
          };


        reader.readAsDataURL(
          file
        );

      }
    );


  const image =
    await new Promise(
      (resolve, reject) => {

        const img =
          new Image();


        img.onload =
          () => {

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


        img.onerror =
          () => {

            reject(
              new Error(
                `The ${getFormatName(file)} image could not be decoded by this browser.`
              )
            );
          };


        img.src =
          dataUrl;

      }
    );


  return {

    image,

    width:
      image.naturalWidth,

    height:
      image.naturalHeight,

    isBitmap: false

  };
}


/* ==========================================
   CONVERT IMAGE TO PNG
========================================== */

async function convertToPNG(file) {

  setStatus(
    "Reading image…",
    5
  );


  const decoded =
    await decodeImage(file);


  let width =
    decoded.width;

  let height =
    decoded.height;


  /*
     Limit very large images
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
    decoded.image,
    0,
    0,
    width,
    height
  );


  /*
     Close ImageBitmap
  */

  if (
    decoded.isBitmap &&
    decoded.image.close
  ) {

    decoded.image.close();
  }


  /*
     Convert to PNG
  */

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
   SHOW SELECTED IMAGE
========================================== */

function showImage(file) {

  if (!preview) {
    return;
  }


  /*
     Remove old preview URL
  */

  if (previewUrl) {

    URL.revokeObjectURL(
      previewUrl
    );

    previewUrl =
      null;
  }


  /*
     Create new preview URL
  */

  previewUrl =
    URL.createObjectURL(
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

      setStatus(
        `The ${getFormatName(file)} image could not be displayed.`,
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
    {
      name: file.name,
      type: file.type,
      size: file.size
    }
  );


  /*
     Empty file check
  */

  if (
    file.size === 0
  ) {

    setStatus(
      "The selected file is empty.",
      0
    );

    return;
  }


  /*
     Format check
  */

  if (
    !isSupportedImage(file)
  ) {

    setStatus(
      "Unsupported image format. Supported formats: JPG, JPEG, PNG, WEBP, GIF, BMP, AVIF, ICO, SVG, TIFF, HEIC and HEIF.",
      0
    );

    return;
  }


  selectedFile =
    file;


  /*
     Remove previous result
  */

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
      "Reading image…",
      10
    );


    /*
       Convert ANY browser-readable
       supported image into PNG.
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


    /*
       IMG.LY background removal
    */

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


    /*
       Check result
    */

    if (!resultBlob) {

      throw new Error(
        "AI processing did not return an image."
      );
    }


    /*
       Remove previous result URL
    */

    if (resultUrl) {

      URL.revokeObjectURL(
        resultUrl
      );
    }


    /*
       Create result URL
    */

    resultUrl =
      URL.createObjectURL(
        resultBlob
      );


    /*
       IMPORTANT:
       Result stays in SAME
       preview section.
    */

    preview.src =
      resultUrl;


    previewCard.classList.add(
      "visible"
    );


    dropZone.style.display =
      "none";


    /*
       SHOW DOWNLOAD BUTTON
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


  /*
     Remove result
  */

  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl =
      null;
  }


  /*
     Remove preview
  */

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


downloadButton.style.display =
  "none";


setStatus(
  "Select an image to begin.",
  0
);


console.log(
  "Krishna AI Studio loaded successfully."
);
