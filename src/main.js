import { removeBackground } from "@imgly/background-removal";
import "./style.css";


/* ==========================================
   ELEMENTS
========================================== */

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


/* ==========================================
   STATE
========================================== */

let selectedFile = null;

let resultUrl = null;

let selectedPreviewUrl = null;

let isProcessing = false;


/* ==========================================
   STATUS
========================================== */

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
        Math.min(
          100,
          percent
        )
      );


    progressBar.style.width =
      `${safePercent}%`;

  }

}


/* ==========================================
   PREVIEW
========================================== */

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


/* ==========================================
   IMAGE LOADING
========================================== */

function loadImage(
  file
) {

  return new Promise(
    (resolve, reject) => {

      const image =
        new Image();

      const url =
        URL.createObjectURL(
          file
        );


      image.onload = () => {

        URL.revokeObjectURL(
          url
        );

        resolve(image);

      };


      image.onerror = () => {

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


/* ==========================================
   PREPARE IMAGE
========================================== */

async function createProcessingBlob(
  file
) {

  const image =
    await loadImage(
      file
    );


  const canvas =
    document.createElement(
      "canvas"
    );


  const width =
    image.naturalWidth ||
    image.width;


  const height =
    image.naturalHeight ||
    image.height;


  if (!width || !height) {

    throw new Error(
      "Invalid image dimensions."
    );

  }


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
      "Could not create image canvas."
    );

  }


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


/* ==========================================
   SUPPORTED FILE
========================================== */

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


/* ==========================================
   HANDLE FILE
========================================== */

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


  if (resultUrl) {

    URL.revokeObjectURL(
      resultUrl
    );

    resultUrl =
      null;

  }


  if (selectedPreviewUrl) {

    URL.revokeObjectURL(
      selectedPreviewUrl
    );

    selectedPreviewUrl =
      null;

  }


  if (downloadButton) {

    downloadButton.style.display =
      "none";

  }


  try {

    selectedPreviewUrl =
      URL.createObjectURL(
        file
      );


    showPreview(
      selectedPreviewUrl
    );


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


/* ==========================================
   FILE INPUT
========================================== */

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


/* ==========================================
   DROP ZONE CLICK
========================================== */

dropZone?.addEventListener(
  "click",
  () => {

    if (isProcessing) {
      return;
    }


    fileInput?.click();

  }
);


/* ==========================================
   DRAG OVER
========================================== */

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


/* ==========================================
   DRAG LEAVE
========================================== */

dropZone?.addEventListener(
  "dragleave",
  () => {

    dropZone.classList.remove(
      "dragover"
    );

  }
);


/* ==========================================
   DROP
========================================== */

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
      event.dataTransfer
        ?.files?.[0];


    await handleFile(
      file
    );

  }
);


/* ==========================================
   REMOVE BACKGROUND
========================================== */

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

      /* -------------------------------
         Convert image to PNG first
      -------------------------------- */

      const processingBlob =
        await createProcessingBlob(
          selectedFile
        );


      setStatus(
        "Loading AI model...",
        5
      );


      /* -------------------------------
         AI BACKGROUND REMOVAL
      -------------------------------- */

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

            progress: (
              key,
              current,
              total
            ) => {

              const percent =
                total
                  ? Math.round(
                      (
                        current /
                        total
                      ) * 100
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


      /* -------------------------------
         SHOW RESULT IN SAME SECTION
      -------------------------------- */

      resultUrl =
        URL.createObjectURL(
          resultBlob
        );


      showPreview(
        resultUrl
      );


      /* -------------------------------
         DOWNLOAD
      -------------------------------- */

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


      if (error?.message) {

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


/* ==========================================
   DOWNLOAD
========================================== */

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


/* ==========================================
   RESET
========================================== */

resetButton?.addEventListener(
  "click",
  () => {

    if (resultUrl) {

      URL.revokeObjectURL(
        resultUrl
      );

      resultUrl =
        null;

    }


    if (selectedPreviewUrl) {

      URL.revokeObjectURL(
        selectedPreviewUrl
      );

      selectedPreviewUrl =
        null;

    }


    selectedFile =
      null;


    isProcessing =
      false;


    if (fileInput) {

      fileInput.value =
        "";

    }


    if (previewCard) {

      previewCard.classList.remove(
        "visible"
      );

    }


    if (preview) {

      preview.removeAttribute(
        "src"
      );

      preview.style.display =
        "none";

    }


    if (downloadButton) {

      downloadButton.style.display =
        "none";

    }


    if (progressBar) {

      progressBar.style.width =
        "0%";

    }


    if (removeButton) {

      removeButton.disabled =
        false;

    }


    setStatus(
      "Select an image to get started."
    );

  }
);


/* ==========================================
   INITIAL STATE
========================================== */

if (downloadButton) {

  downloadButton.style.display =
    "none";

}


if (previewCard) {

  previewCard.classList.remove(
    "visible"
  );

}


if (preview) {

  preview.style.display =
    "none";

}


setStatus(
  "Select an image to get started."
);
