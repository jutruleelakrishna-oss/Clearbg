import { removeBackground } from "@imgly/background-removal";
import "./style.css";


/* =====================================================
   ELEMENTS
===================================================== */

const dropZone =
  document.getElementById("dropZone");

const fileInput =
  document.getElementById("fileInput");

const previewCard =
  document.getElementById("previewCard");

const preview =
  document.getElementById("preview");

const removeButton =
  document.getElementById("removeButton");

const downloadButton =
  document.getElementById("downloadButton");

const resetButton =
  document.getElementById("resetButton");

const status =
  document.getElementById("status");

const progressBar =
  document.getElementById("progressBar");


/* =====================================================
   VARIABLES
===================================================== */

let selectedFile = null;
let resultUrl = null;
let isProcessing = false;


/* =====================================================
   STATUS
===================================================== */

function setStatus(
  message,
  percent = null
) {

  if (status) {
    status.textContent = message;
  }

  if (
    progressBar &&
    percent !== null
  ) {

    const safePercent =
      Math.max(
        0,
        Math.min(100, percent)
      );

    progressBar.style.width =
      `${safePercent}%`;

  }

}


/* =====================================================
   SHOW PREVIEW
===================================================== */

function showPreview(
  imageUrl
) {

  if (!previewCard) {
    return;
  }

  previewCard.classList.add(
    "visible"
  );

  if (preview) {

    preview.src =
      imageUrl;

    preview.style.display =
      "block";

  }

}


/* =====================================================
   LOAD IMAGE
===================================================== */

function loadImage(
  file
) {

  return new Promise(
    (resolve, reject) => {

      const image =
        new Image();

      const url =
        URL.createObjectURL(file);


      image.onload =
        () => {

          URL.revokeObjectURL(
            url
          );

          resolve(image);

        };


      image.onerror =
        () => {

          URL.revokeObjectURL(
            url
          );

          reject(
            new Error(
              "The image could not be decoded."
            )
          );

        };


      image.src =
        url;

    }
  );

}


/* =====================================================
   CONVERT IMAGE TO PNG
===================================================== */

async function createProcessingBlob(
  file
) {

  const image =
    await loadImage(file);


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    image.naturalWidth ||
    image.width;

  canvas.height =
    image.naturalHeight ||
    image.height;


  const context =
    canvas.getContext(
      "2d"
    );


  if (!context) {

    throw new Error(
      "Could not create image canvas."
    );

  }


  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );


  return new Promise(
    (resolve, reject) => {

      canvas.toBlob(
        (blob) => {

          if (!blob) {

            reject(
              new Error(
                "Could not prepare the image."
              )
            );

            return;

          }

          resolve(blob);

        },
        "image/png"
      );

    }
  );

}


/* =====================================================
   FILE VALIDATION
===================================================== */

function isSupportedImage(
  file
) {

  if (!file) {
    return false;
  }


  if (
    file.type &&
    file.type.startsWith(
      "image/"
    )
  ) {

    return true;

  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const supportedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "bmp",
    "avif"
  ];


  return supportedExtensions.includes(
    extension
  );

}


/* =====================================================
   SELECT FILE
===================================================== */

async function handleFile(
  file
) {

  if (!file) {
    return;
  }


  if (!isSupportedImage(file)) {

    setStatus(
      "Please select a supported image file."
    );

    return;

  }


  selectedFile =
    file;


  /*
   * Clear previous result.
   */

  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl =
      null;

  }


  if (downloadButton) {

    downloadButton.style.display =
      "none";

  }


  /*
   * Show original image.
   */

  try {

    const previewUrl =
      URL.createObjectURL(
        file
      );


    showPreview(
      previewUrl
    );


    /*
     * The preview URL can stay active
     * while the image is displayed.
     */

    setStatus(
      `${file.name} selected.`
    );

  } catch (error) {

    console.error(
      error
    );

    setStatus(
      "Could not display this image."
    );

  }

}


/* =====================================================
   FILE INPUT
===================================================== */

fileInput?.addEventListener(
  "change",
  async () => {

    const file =
      fileInput.files?.[0];

    await handleFile(
      file
    );

  }
);


/* =====================================================
   DROP ZONE CLICK
===================================================== */

dropZone?.addEventListener(
  "click",
  () => {

    if (isProcessing) {
      return;
    }

    fileInput?.click();

  }
);


/* =====================================================
   DRAG & DROP
===================================================== */

dropZone?.addEventListener(
  "dragover",
  (event) => {

    event.preventDefault();

    if (isProcessing) {
      return;
    }

    dropZone.classList.add(
      "dragover"
    );

  }
);


dropZone?.addEventListener(
  "dragleave",
  () => {

    dropZone.classList.remove(
      "dragover"
    );

  }
);


dropZone?.addEventListener(
  "drop",
  async (event) => {

    event.preventDefault();

    dropZone.classList.remove(
      "dragover"
    );


    if (isProcessing) {
      return;
    }


    const file =
      event.dataTransfer?.files?.[0];


    await handleFile(
      file
    );

  }
);


/* =====================================================
   REMOVE BACKGROUND
===================================================== */

removeButton?.addEventListener(
  "click",
  async () => {

    if (
      !selectedFile ||
      isProcessing
    ) {

      return;

    }


    isProcessing =
      true;


    removeButton.disabled =
      true;


    if (downloadButton) {

      downloadButton.style.display =
        "none";

    }


    setStatus(
      "Preparing image...",
      0
    );


    try {

      /*
       * Convert JPG/WEBP/etc.
       * into PNG before processing.
       *
       * This avoids image decoding
       * problems with some files.
       */

      const processingBlob =
        await createProcessingBlob(
          selectedFile
        );


      setStatus(
        "Loading AI model...",
        5
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

                const percent =
                  total
                    ? Math.round(
                        (current / total) *
                        100
                      )
                    : 0;


                setStatus(
                  `Processing… ${percent}%`,
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
       * Create result URL.
       */

      resultUrl =
        URL.createObjectURL(
          resultBlob
        );


      /*
       * IMPORTANT:
       *
       * The processed image replaces
       * the original image in the SAME
       * preview section.
       */

      showPreview(
        resultUrl
      );


      /*
       * Show download button.
       */

      if (downloadButton) {

        downloadButton.style.display =
          "inline-flex";

      }


      setStatus(
        "Background removed successfully.",
        100
      );


    } catch (error) {

      console.error(
        "Background removal error:",
        error
      );


      let message =
        "AI processing failed.";


      if (
        error?.message
      ) {

        message =
          error.message;

      }


      setStatus(
        message
      );

    } finally {

      isProcessing =
        false;

      removeButton.disabled =
        false;

    }

  }
);


/* =====================================================
   DOWNLOAD
===================================================== */

downloadButton?.addEventListener(
  "click",
  () => {

    if (!resultUrl) {
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
);


/* =====================================================
   RESET
===================================================== */

resetButton?.addEventListener(
  "click",
  () => {

    /*
     * Revoke generated result.
     */

    if (resultUrl) {

      URL.revokeObjectURL(
        resultUrl
      );

      resultUrl =
        null;

    }


    /*
     * Reset variables.
     */

    selectedFile =
      null;

    isProcessing =
      false;


    /*
     * Reset file input.
     */

    if (fileInput) {

      fileInput.value =
        "";

    }


    /*
     * Hide preview.
     */

    if (previewCard) {

      previewCard.classList.remove(
        "visible"
      );

    }


    if (preview) {

      preview.removeAttribute(
        "src"
      );

    }


    /*
     * Hide download.
     */

    if (downloadButton) {

      downloadButton.style.display =
        "none";

    }


    /*
     * Reset progress.
     */

    if (progressBar) {

      progressBar.style.width =
        "0%";

    }


    setStatus(
      "Select an image to get started."
    );

  }
);


/* =====================================================
   INITIAL STATE
===================================================== */

if (downloadButton) {

  downloadButton.style.display =
    "none";

}


if (previewCard) {

  previewCard.classList.remove(
    "visible"
  );

}


setStatus(
  "Select an image to get started."
);
