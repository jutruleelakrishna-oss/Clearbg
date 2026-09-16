import { removeBackground } from "@imgly/background-removal";
import "./style.css";

const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const removeButton = document.querySelector("#removeButton");
const downloadButton = document.querySelector("#downloadButton");
const resetButton = document.querySelector("#resetButton");

const preview = document.querySelector("#preview");
const result = document.querySelector("#result");
const status = document.querySelector("#status");
const progressBar = document.querySelector("#progressBar");

let selectedFile = null;
let resultUrl = null;

function setStatus(message, percent = null) {
  status.textContent = message;

  if (percent === null) {
    progressBar.style.width = "0%";
  } else {
    const value = Math.max(0, Math.min(100, percent));
    progressBar.style.width = `${value}%`;
  }
}

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    setStatus("Please choose a JPG or PNG image.");
    return;
  }

  selectedFile = file;

  if (preview.src.startsWith("blob:")) {
    URL.revokeObjectURL(preview.src);
  }

  preview.src = URL.createObjectURL(file);
  preview.hidden = false;

  result.hidden = true;
  downloadButton.hidden = true;
  removeButton.disabled = false;

  setStatus(`${file.name} ready.`);
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (file) {
    setFile(file);
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
});

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files?.[0];

  if (file) {
    setFile(file);
  }
});

dropZone.addEventListener("click", () => {
  fileInput.click();
});

removeButton.addEventListener("click", async () => {
  if (!selectedFile) return;

  removeButton.disabled = true;
  downloadButton.hidden = true;

  try {
    setStatus("Starting AI…", 5);

    const blob = await removeBackground(selectedFile, {
      debug: true,
      device: "cpu",
      model: "isnet_quint8",

      progress: (key, current, total) => {
        const percent = total
          ? Math.round((current / total) * 100)
          : 0;

        setStatus(
          `Processing… ${percent}%`,
          percent
        );

        console.log(
          "ClearBG:",
          key,
          current,
          total
        );
      }
    });

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    resultUrl = URL.createObjectURL(blob);

    result.src = resultUrl;
    result.hidden = false;

    downloadButton.hidden = false;

    setStatus(
      "Background removed successfully!",
      100
    );

  } catch (error) {
    console.error("ClearBG error:", error);

    const message =
      error?.message ||
      error?.toString() ||
      "Unknown error";

    setStatus(`Error: ${message}`);
  } finally {
    removeButton.disabled = false;
  }
});

downloadButton.addEventListener("click", () => {
  if (!resultUrl) return;

  const link = document.createElement("a");

  link.href = resultUrl;
  link.download = "clearbg-result.png";

  document.body.appendChild(link);
  link.click();
  link.remove();
});

resetButton.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";

  preview.hidden = true;
  result.hidden = true;
  downloadButton.hidden = true;
  removeButton.disabled = true;

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }

  setStatus("Choose an image to begin.");
});
