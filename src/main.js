import { removeBackground } from "@imgly/background-removal";

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

const MAX_IMAGE_SIZE = 4096;

const MODEL_PATH =
  "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";


/* ---------------------------------------
   STATUS
--------------------------------------- */

function setStatus(message, progress = 0) {
  if (status) {
    status.textContent = message;
  }

  if (progressBar) {
    const safe = Math.max(
      0,
      Math.min(100, progress)
    );

    progressBar.style.width = `${safe}%`;
  }
}


/* ---------------------------------------
   SUPPORTED IMAGE
--------------------------------------- */

function isImage(file) {
  if (!file) return false;

  if (file.type && file.type.startsWith("image/")) {
    return true;
  }

  const name = file.name?.toLowerCase() || "";

  return [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif"
  ].some(ext => name.endsWith(ext));
}


/* ---------------------------------------
   DECODE IMAGE
--------------------------------------- */

async function decodeImage(file) {

  /*
   * First try normal browser Image decoding.
   */

  try {

    const url = URL.createObjectURL(file);

    const image = await new Promise(
      (resolve, reject) => {

        const img = new Image();

        img.onload = () => resolve(img);

        img.onerror = () => reject(
          new Error("Browser image decoder failed.")
        );

        img.src = url;
      }
    );

    URL.revokeObjectURL(url);

    if (
      image.naturalWidth &&
      image.naturalHeight
    ) {
      return image;
    }

  } catch (error) {
    console.warn(
      "Normal image decoder failed:",
      error
    );
  }


  /*
   * Fallback to createImageBitmap.
   */

  if ("createImageBitmap" in window) {

    try {

      const bitmap =
        await createImageBitmap(file);

      return bitmap;

    } catch (error) {

      console.warn(
        "createImageBitmap failed:",
        error
      );

    }

  }

  throw new Error(
    "The image could not be decoded by this browser. Please try JPG or PNG."
  );
}


/* ---------------------------------------
   CONVERT TO PNG
--------------------------------------- */

async function convertToPNG(file) {

  setStatus(
    "Preparing image...",
    5
  );

  const image =
    await decodeImage(file);

  let width =
    image.naturalWidth ||
    image.width;

  let height =
    image.naturalHeight ||
    image.height;


  if (!width || !height) {

    throw new Error(
      "The image has invalid dimensions."
    );

  }


  /*
   * Keep mobile memory usage reasonable.
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
      Math.round(width * scale);

    height =
      Math.round(height * scale);
  }


  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;


  const context =
    canvas.getContext("2d", {
      alpha: true
    });


  if (!context) {

    throw new Error(
      "Your browser could not create an image canvas."
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


  /*
   * Close ImageBitmap when possible.
   */

  if (
    typeof image.close === "function"
  ) {
    image.close();
  }


  return new Promise(
    (resolve, reject) => {

      canvas.toBlob(
        blob => {

          if (!blob) {

            reject(
              new Error(
                "The image could not be converted to PNG."
              )
            );

            return;
          }

          resolve(
            new File(
              [blob],
              "krishna-ai-input.png",
              {
                type: "image/png",
                lastModified: Date.now()
              }
            )
          );

        },
        "image/png"
      );

    }
  );
}


/* ---------------------------------------
   DISPLAY SELECTED IMAGE
--------------------------------------- */

function displaySelectedImage(file) {

  if (originalUrl) {
    URL.revokeObjectURL(originalUrl);
  }

  originalUrl =
    URL.createObjectURL(file);

  preview.src = originalUrl;

  preview.alt =
    "Selected image";

  previewCard.classList.add("show");

  dropZone.classList.add("hidden");

  removeButton.disabled = false;

  downloadButton.style.display =
    "none";

  downloadButton.disabled = true;

  setStatus(
    "Image ready. Remove the background.",
    0
  );
}


/* ---------------------------------------
   HANDLE FILE
--------------------------------------- */

async function handleFile(file) {

  if (!file) return;


  if (!isImage(file)) {

    setStatus(
      "Please select a valid image file.",
      0
    );

    return;
  }


  selectedFile = file;

  resultBlob = null;


  if (resultUrl) {

    URL.revokeObjectURL(resultUrl);

    resultUrl = null;

  }


  try {

    displaySelectedImage(file);

  } catch (error) {

    console.error(
      "File error:",
      error
    );

    setStatus(
      error?.message ||
      "The selected file could not be read.",
      0
    );

  }

}


/* ---------------------------------------
   BACKGROUND REMOVAL
--------------------------------------- */

async function processImage() {

  if (!selectedFile) {

    setStatus(
      "Please select an image first.",
      0
    );

    return;
  }


  try {

    removeButton.disabled = true;

    downloadButton.disabled = true;

    downloadButton.style.display =
      "none";


    setStatus(
      "Preparing image for AI...",
      10
    );


    /*
     * Convert the selected image to a
     * browser-safe PNG.
     */

    const inputFile =
      await convertToPNG(selectedFile);


    setStatus(
      "Starting AI background removal...",
      15
    );


    console.log(
      "Krishna AI Studio: AI started"
    );


    /*
     * IMPORTANT:
     * Let IMG.LY perform the actual
     * segmentation.
     */

    const output =
      await removeBackground(
        inputFile,
        {
          debug: false,

          model: "isnet_quint8",

          device: "cpu",

          publicPath: MODEL_PATH,

          progress: (
            key,
            current,
            total
          ) => {

            let percent = 15;

            if (
              Number.isFinite(total) &&
              total > 0
            ) {

              percent =
                15 +
                Math.round(
                  (current / total) * 80
                );

            }

            percent =
              Math.min(
                95,
                Math.max(
                  15,
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


    if (!output) {

      throw new Error(
        "AI processing did not return an image."
      );

    }


    resultBlob = output;


    if (resultUrl) {

      URL.revokeObjectURL(resultUrl);

    }


    resultUrl =
      URL.createObjectURL(
        resultBlob
      );


    /*
     * Replace the SAME preview
     * with the transparent result.
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
      "Krishna AI Studio: AI completed"
    );


  } catch (error) {

    console.error(
      "Background removal error:",
      error
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


/* ---------------------------------------
   DOWNLOAD
--------------------------------------- */

function downloadResult() {

  if (!resultBlob || !resultUrl) {

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


  document.body.appendChild(link);

  link.click();

  link.remove();

}


/* ---------------------------------------
   RESET
--------------------------------------- */

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


/* ---------------------------------------
   FILE PICKER
--------------------------------------- */

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


/* ---------------------------------------
   DRAG & DROP
--------------------------------------- */

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
      event.dataTransfer?.files?.[0];


    handleFile(file);

  }
);


/* ---------------------------------------
   BUTTONS
--------------------------------------- */

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


/* ---------------------------------------
   CLEANUP
--------------------------------------- */

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


/* ---------------------------------------
   INITIAL STATE
--------------------------------------- */

removeButton.disabled = true;

downloadButton.disabled = true;

setStatus(
  "Select an image to get started.",
  0
);

console.log(
  "Krishna AI Studio loaded."
);
