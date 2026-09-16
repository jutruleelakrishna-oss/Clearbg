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
    setStatus("Please choose an image file.");
    return;
  }

  selectedFile = file;

  preview.src = URL.createObjectURL(file);
  preview.hidden = false;

  result.hidden = true;
  downloadButton.hidden = true;
  removeButton.disabled = false;

  setStatus(`${file.name} ready.`);
}

function convertToJpeg(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);

      const maxSize = 2500;

      let width = image.naturalWidth;
      let height = image.naturalHeight;

      if (width > maxSize || height > maxSize) {
        const scale = Math.min(
          maxSize / width,
          maxSize / height
        );

        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Could not create image canvas."));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);

      context.drawImage(
        image,
        0,
        0
