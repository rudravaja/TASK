import express from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const app = express();
const PORT = 3000;

const uploadDir = path.join(process.cwd(), "upload");

await fs.mkdir(uploadDir, { recursive: true });

app.use("/images", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
  cb(null, randomUUID() + "-" + path.basename(file.originalname));
},
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Image Management System</title>

      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "Inter", Arial, sans-serif;
        }

        #pagination {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 14px;
          margin-top: 28px;
        }

        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        #pagination button {
          min-width: 42px;
          padding: 10px 13px;
          background: #ffffff;
          color: #344054;
          border: 1px solid #dbe2ed;
        }

        #pagination button:hover:not(:disabled) {
          background: #e8efff;
          color: #2457c5;
        }

        #pagination button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        #pagination .page-button.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        #pagination .page-summary {
          color: #718096;
          font-size: 13px;
        }

        .page-ellipsis {
          padding: 8px 4px;
          color: #718096;
        }

        body {
          min-height: 100vh;
          background: #f3f6fb;
          padding: 40px 20px;
          color: #172033;
        }

        .container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        h1 {
          font-size: clamp(25px, 4vw, 32px);
          font-weight: 700;
          letter-spacing: -0.8px;
          margin-bottom: 9px;
        }

        .subtitle {
          color: #718096;
          font-size: 14px;
          line-height: 1.6;
        }

        .upload-box {
          background: #ffffff;
          padding: 28px;
          border: 1px solid #e8edf5;
          border-radius: 18px;
          box-shadow: 0 8px 28px rgba(25, 42, 70, 0.05);
          margin-bottom: 36px;
        }

        .upload-box h2,
        .gallery-heading {
          font-size: 19px;
          font-weight: 650;
          margin-bottom: 20px;
        }

        .file-group {
          margin-bottom: 19px;
        }

        .file-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #344054;
          margin-bottom: 9px;
        }

        input[type="file"] {
          display: block;
          width: 100%;
          padding: 12px;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          background: #f8fafc;
          color: #64748b;
          font-size: 13px;
          cursor: pointer;
        }

        input[type="file"]::file-selector-button {
          border: 0;
          border-radius: 7px;
          background: #e8efff;
          color: #2457c5;
          padding: 8px 11px;
          margin-right: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        button {
          border: 0;
          border-radius: 9px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .upload-btn {
          background: #2563eb;
          color: #ffffff;
        }

        .upload-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        #message {
          min-height: 20px;
          margin-top: 13px;
          font-size: 13px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .gallery-heading {
          margin-bottom: 18px;
        }

        #gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          grid-auto-rows: 330px;
          gap: 20px;
          align-items: stretch;
        }

        .image-card {
          width: 100%;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: #ffffff;
          border: 1px solid #e9edf4;
          border-radius: 15px;
          box-shadow: 0 5px 18px rgba(25, 42, 70, 0.055);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .image-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(25, 42, 70, 0.10);
        }

        .image-card img {
          display: block;
          width: 100%;
          height: 180px;
          flex: 0 0 180px;
          object-fit: cover;
          background: #edf1f7;
          border-radius: 10px;
        }

        .image-card p {
          width: 100%;
          min-width: 0;
          height: 44px;
          min-height: 44px;
          max-height: 44px;
          margin: 12px 0;
          color: #526078;
          font-size: 12px;
          line-height: 22px;
          overflow: hidden;
          overflow-wrap: anywhere;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-clamp: 2;
        }

        .card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: auto;
        }

        .details-btn,
        .delete-btn {
          width: 100%;
          min-height: 44px;
          padding: 10px;
          flex: 0 0 44px;
        }

        .details-btn {
          background: #e8efff;
          color: #2457c5;
        }

        .details-btn:hover {
          background: #2457c5;
          color: #ffffff;
        }

        .delete-btn {
          background: #fff0f0;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #dc2626;
          color: #ffffff;
        }

        .details-dialog {
          width: min(92vw, 560px);
          max-height: 88vh;
          margin: auto;
          padding: 0;
          border: 0;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
          overflow: auto;
        }

        .details-dialog::backdrop {
          background: rgba(15, 23, 42, 0.58);
        }

        .details-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 20px 22px;
          border-bottom: 1px solid #e8edf5;
        }

        .details-modal-header h2 {
          font-size: 18px;
          color: #172033;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          padding: 0;
          background: #f1f5f9;
          color: #344054;
          font-size: 23px;
          line-height: 1;
        }

        .details-content {
          padding: 20px 22px 24px;
        }

        .details-preview {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 180px;
          margin-bottom: 18px;
          padding: 10px;
          border-radius: 12px;
          background: #f3f6fb;
        }

        .details-preview img {
          display: block;
          max-width: 100%;
          max-height: 280px;
          object-fit: contain;
          border-radius: 8px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          padding: 11px 0;
          border-bottom: 1px solid #edf1f7;
          font-size: 13px;
        }

        .detail-label {
          flex: 0 0 115px;
          color: #718096;
        }

        .detail-value {
          min-width: 0;
          color: #263348;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .empty-message {
          grid-column: 1 / -1;
          padding: 30px 15px;
          text-align: center;
          color: #718096;
          background: #ffffff;
          border: 1px dashed #d7deea;
          border-radius: 14px;
          font-size: 14px;
        }

        @media (max-width: 700px) {
          body {
            padding: 25px 14px;
          }

          .upload-box {
            padding: 20px;
          }

          #gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: 285px;
            gap: 12px;
          }

          .image-card {
            padding: 8px;
          }

          .image-card img {
            height: 135px;
            flex-basis: 135px;
          }

          .image-card p {
            height: 40px;
            min-height: 40px;
            max-height: 40px;
            margin: 10px 0;
            font-size: 11px;
            line-height: 20px;
          }

          .details-btn,
          .delete-btn {
            min-height: 40px;
            flex-basis: 40px;
            padding: 9px 6px;
            font-size: 12px;
          }

          .details-content {
            padding: 16px;
          }

          .detail-label {
            flex-basis: 95px;
          }
        }
        #input:hover {
            
        }
        @media (max-width: 360px) {
          #gallery {
            grid-template-columns: 1fr;
            grid-auto-rows: 315px;
          }

          .image-card img {
            height: 165px;
            flex-basis: 165px;
          }
        }
      </style>
    </head>

    <body>
      <main class="container">
        <header class="page-header">
          <h1>Image Management System</h1>
          <p class="subtitle">Upload, preview and manage your images</p>
        </header>

        <section class="upload-box">
          <h2>Upload Images</h2>

          <div class="file-group">
            <label for="input1">Select Multiple Images (Maximum 5)</label>
            <input type="file" id="input1" multiple accept="image/*">
          </div>

          <div class="file-group">
            <label for="input2">Select Single Image (Maximum 1)</label>
            <input type="file" id="input2" accept="image/*">
          </div>

          <button class="upload-btn" id="uploadButton" onclick="uploadImages()">
            Upload Images
          </button>

          <p id="message" aria-live="polite"></p>
        </section>

        <section>
          <h2 class="gallery-heading">Uploaded Images</h2>

          <div id="gallery"></div>

          <div id="pagination"></div>
        </section>
      </main>

      <dialog id="detailsDialog" class="details-dialog" aria-labelledby="detailsTitle">
        <div class="details-modal-header">
          <h2 id="detailsTitle">Image Details</h2>
          <button type="button" id="closeDetailsButton" class="modal-close" aria-label="Close details">&times;</button>
        </div>
        <div id="detailsContent" class="details-content"></div>
      </dialog>

      <script>
        const message = document.getElementById("message");
        const gallery = document.getElementById("gallery");
        const pagination = document.getElementById("pagination");
        const uploadButton = document.getElementById("uploadButton");
        const detailsDialog = document.getElementById("detailsDialog");
        const detailsContent = document.getElementById("detailsContent");
        const closeDetailsButton = document.getElementById("closeDetailsButton");

        const limit = 8;

        var currentPage = 1;

        function showMessage(text, isError = false) {
          message.style.color = isError ? "#dc2626" : "#16a34a";
          message.textContent = text;
        }

        async function readJson(response) {
          try {
            const data = await response.json();
            console.log(data);
            return data;
            } catch {
              return { message: "Invalid server response." };
              }
              }
              
        function formatFileSize(bytes) {
          if (!Number.isFinite(bytes) || bytes < 0) {
            return "Unknown";
          }

          if (bytes === 0) {
            return "0 Bytes";
          }

          const units = ["Bytes", "KB", "MB", "GB"];
          const unitIndex = Math.min(
            Math.floor(Math.log(bytes) / Math.log(1024)),
            units.length - 1
          );

          const size = bytes / Math.pow(1024, unitIndex);
          return size.toFixed(unitIndex === 0 ? 0 : 2) + " " + units[unitIndex];
        }

        function formatDate(dateValue) {
          const date = new Date(dateValue);

          if (Number.isNaN(date.getTime())) {
            return "Not available";
          }

          return date.toLocaleString();
        }

        function addDetailRow(label, value) {
          const row = document.createElement("div");
          row.className = "detail-row";

          const labelElement = document.createElement("span");
          labelElement.className = "detail-label";
          labelElement.textContent = label;

          const valueElement = document.createElement("strong");
          valueElement.className = "detail-value";
          valueElement.textContent = value || "Not available";

          row.append(labelElement, valueElement);
          detailsContent.appendChild(row);
        }

        function closeImageDetails() {
          if (detailsDialog.open) {
            detailsDialog.close();
          }
        }

        closeDetailsButton.addEventListener("click", closeImageDetails);

        detailsDialog.addEventListener("click", function (event) {
          if (event.target === detailsDialog) {
            closeImageDetails();
          }
        });

        async function showImageDetails(filename) {
          try {
            const response = await fetch(
              "/api/images/" + encodeURIComponent(filename) + "/details"
            );

            const result = await readJson(response);

            if (!response.ok) {
              throw new Error(result.message || "Could not load image details.");
            }

            detailsContent.innerHTML = "";

            const previewBox = document.createElement("div");
            previewBox.className = "details-preview";

            const previewImage = document.createElement("img");
            previewImage.src = result.url;
            previewImage.alt = result.filename;

            previewImage.onload = function () {
              addDetailRow(
                "Dimensions",
                previewImage.naturalWidth + " × " + previewImage.naturalHeight + " px"
              );
            };

            previewBox.appendChild(previewImage);
            detailsContent.appendChild(previewBox);

            addDetailRow("File name", result.filename);
            addDetailRow("Original name", result.originalName);
            addDetailRow("File type", result.mimeType);
            addDetailRow("Format", result.extension || "Unknown");
            addDetailRow("File size", formatFileSize(result.sizeBytes));
            addDetailRow("Created", formatDate(result.createdAt));
            addDetailRow("Last modified", formatDate(result.modifiedAt));

            detailsDialog.showModal();
          } catch (error) {
            showMessage(error.message, true);
          }
        }

        const IMAGE_CACHE_KEY = "images";

        function getImagePageCache() {
          try {
            const savedCache = JSON.parse(
              localStorage.getItem(IMAGE_CACHE_KEY) || "{}"
            );

            if (
              savedCache &&
              typeof savedCache === "object" &&
              !Array.isArray(savedCache)
            ) {
              return savedCache;
            }

            return {};
          } catch (error) {
            return {};
          }
        }

        function saveImagePageCache(page, result) {
          try {
            const cache = getImagePageCache();
            const cacheKey = "page-" + page + "-limit-" + limit;

            cache[cacheKey] = result;

            localStorage.setItem(
              IMAGE_CACHE_KEY,
              JSON.stringify(cache)
            );
          } catch (error) {
            console.warn("Could not save image information in LocalStorage.", error);
          }
        }

        function clearImagePageCache() {
          try {
            localStorage.removeItem(IMAGE_CACHE_KEY);
          } catch (error) {
            console.warn("Could not clear image cache.", error);
          }
        }

        async function loadImages(page = 1) {
          const cache = getImagePageCache();
          const cacheKey = "page-" + page + "-limit-" + limit;
          const cachedResult = cache[cacheKey];

          if (cachedResult && Array.isArray(cachedResult.images)) {
            currentPage = cachedResult.currentPage || page;
            displayImages(cachedResult.images);
            displayPagination(cachedResult);
          }

          try {
            const response = await fetch(
              "/api/images?page=" + page + "&limit=" + limit
            );

            const result = await readJson(response);

            if (!response.ok) {
              throw new Error(result.message || "Could not load images.");
            }

            currentPage = result.currentPage;

            saveImagePageCache(result.currentPage, result);

            displayImages(result.images);
            displayPagination(result);

          } catch (error) {
            if (cachedResult && Array.isArray(cachedResult.images)) {
              showMessage(
                "Showing saved image information. Could not refresh from server.",
                true
              );
            } else {
              showMessage(error.message, true);
            }
          }
        }

        function displayPagination(result) {
          pagination.innerHTML = "";

          if (result.totalImages === 0) {
            return;
          }

          // const summary = document.createElement("p");
          // summary.className = "page-summary";
          // summary.textContent =
          //   "Showing " + result.startItem +
          //   " - " + result.endItem +
          //   " of " + result.totalImages + " images";

          // pagination.appendChild(summary);

          if (result.totalPages <= 1) {
            return;
          }

          const controls = document.createElement("div");
          controls.className = "pagination-controls";

          const previousButton = document.createElement("button");

          previousButton.textContent = "Previous";
          previousButton.disabled = currentPage === 1;

          previousButton.onclick = function () {
            loadImages(currentPage - 1);
          };

          controls.appendChild(previousButton);

          let pages = [];

          if (result.totalPages <= 7) {

            for (let i = 1; i <= result.totalPages; i++) {
              pages.push(i);
            }

          } else {

            pages.push(1);

            if (currentPage > 4) {
              pages.push("...");
            }

            const startPage = Math.max(2, currentPage - 2);

            const endPage = Math.min(
              result.totalPages - 1,
              currentPage + 2
            );

            for (let i = startPage; i <= endPage; i++) {
              pages.push(i);
            }

            if (currentPage < result.totalPages - 3) {
              pages.push("...");
            }

            pages.push(result.totalPages);
          }

          pages.forEach(function (page) {

            if (page === "...") {
              const dots = document.createElement("span");

              dots.className = "page-ellipsis";
              dots.textContent = "...";

              controls.appendChild(dots);
              return;
            }

            const pageButton = document.createElement("button");

            pageButton.textContent = page;
            pageButton.className = "page-button";

            if (page === currentPage) {
              pageButton.classList.add("active");
            }

            pageButton.onclick = function () {
              loadImages(page);
            };

            controls.appendChild(pageButton);
          });

          const nextButton = document.createElement("button");

          nextButton.textContent = "Next";
          nextButton.disabled = currentPage === result.totalPages;

          nextButton.onclick = function () {
            loadImages(currentPage + 1);
          };

          controls.appendChild(nextButton);

          pagination.appendChild(controls);
        }

        async function uploadImages() {

          const input1 = document.getElementById("input1");
          const input2 = document.getElementById("input2");

          const multipleFiles = Array.from(input1.files);
          const singleFile = input2.files[0];

          if (multipleFiles.length === 0 && !singleFile) {
            showMessage("Please select at least one image.", true);
            return;
          }

          if (multipleFiles.length > 5) {
            showMessage("Maximum 5 multiple images allowed.", true);
            return;
          }

          const selectedFiles = [
            ...multipleFiles,
            ...(singleFile ? [singleFile] : [])
          ];

          for (const file of selectedFiles) {

            if (!file.type.startsWith("image/")) {
              showMessage(file.name + " is not an image.", true);
              return;
            }

            if (file.size > 10 * 1024 * 1024) {
              showMessage(file.name + " is larger than 10 MB.", true);
              return;
            }
          }

          const formData = new FormData();

          for (const file of multipleFiles) {
            formData.append("input1", file);
          }

          if (singleFile) {
            formData.append("input2", singleFile);
          }

          try {

            uploadButton.disabled = true;
            uploadButton.textContent = "Uploading...";

            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData
            });

            const result = await readJson(response);

            if (!response.ok) {
              showMessage(result.message, true);
              return;
            }

            showMessage(result.message);

            input1.value = "";
            input2.value = "";

            clearImagePageCache();
            await loadImages(1);

          } catch (error) {
            showMessage(error.message, true);

          } finally {

            uploadButton.disabled = false;
            uploadButton.textContent = "Upload Images";
          }
        }

        function displayImages(images) {

          gallery.innerHTML = "";

          if (!Array.isArray(images) || images.length === 0) {

            const empty = document.createElement("p");

            empty.className = "empty-message";
            empty.textContent = "No images uploaded yet.";

            gallery.appendChild(empty);
            return;
          }

          images.forEach(function (image) {

            const card = document.createElement("article");
            card.className = "image-card";

            const img = document.createElement("img");

            img.src = image.url;
            img.alt = image.filename;
            img.loading = "lazy";

            const name = document.createElement("p");

            name.textContent = image.filename;
            name.title = image.filename;

            const actions = document.createElement("div");
            actions.className = "card-actions";

            const detailsButton = document.createElement("button");
            detailsButton.type = "button";
            detailsButton.textContent = "Details";
            detailsButton.className = "details-btn";

            detailsButton.onclick = function () {
              showImageDetails(image.filename);
            };

            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Delete";
            button.className = "delete-btn";

            button.onclick = function () {
              deleteImage(image.filename);
            };

            actions.append(detailsButton, button);
            card.append(img, name, actions);

            gallery.appendChild(card);
          });
        }

        async function deleteImage(filename) {

          try {

            const response = await fetch(
              "/api/images/" + encodeURIComponent(filename),
              {
                method: "DELETE"
              }
            );

            const result = await readJson(response);

            if (!response.ok) {
              showMessage(result.message, true);
              return;
            }

            showMessage(result.message);

            clearImagePageCache();
            await loadImages(currentPage);

          } catch (error) {
            showMessage(error.message, true);
          }
        }

        loadImages(1);
      </script>
    </body>
    </html>
  `);
});

app.post(
  "/api/upload",
  upload.fields([
    { name: "input1", maxCount: 5 },
    { name: "input2", maxCount: 1 },
  ]),
  (req, res) => {
    const multipleFiles = req.files?.input1 || [];
    const singleFiles = req.files?.input2 || [];
    const files = [...multipleFiles, ...singleFiles];

    if (files.length === 0) {
      return res.status(400).json({
        message: "No images selected.",
      });
    }

    res.status(201).json({
      message: "Images uploaded successfully.",
      files: files.map((file) => ({
        filename: file.filename,
        url: "/images/" + encodeURIComponent(file.filename),
      })),
    });
  },
);

app.get("/api/images", async (req, res) => {
  try {
    const pageValue = Number(req.query.page);
    const limitValue = Number(req.query.limit);

    const requestedPage =
      Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;

    const limit =
      Number.isInteger(limitValue) && limitValue > 0
        ? Math.min(limitValue, 50)
        : 8;

    const entries = await fs.readdir(uploadDir, {
      withFileTypes: true,
    });

    const filenames = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    filenames.sort().reverse();

    const totalImages = filenames.length;

    const totalPages = Math.ceil(totalImages / limit);

    const currentPage =
      totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

    const startIndex = (currentPage - 1) * limit;

    const pageImages = filenames.slice(startIndex, startIndex + limit);

    const startItem = totalImages === 0 ? 0 : startIndex + 1;

    const endItem = Math.min(startIndex + limit, totalImages);

    res.json({
      images: pageImages.map((filename) => ({
        filename,
        url: "/images/" + encodeURIComponent(filename),
      })),

      currentPage,
      totalPages,
      totalImages,
      limit,
      startItem,
      endItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not load images.",
    });
  }
});

app.get("/api/images/:filename/details", async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const imagePath = path.join(uploadDir, filename);
    const stats = await fs.stat(imagePath);

    if (!stats.isFile()) {
      return res.status(404).json({ message: "Image not found." });
    }

    const extension = path.extname(filename).toLowerCase();

    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml",
      ".avif": "image/avif",
      ".heic": "image/heic",
      ".heif": "image/heif",
      ".tif": "image/tiff",
      ".tiff": "image/tiff",
    };

    res.json({
      filename,
      originalName: filename.replace(/^\d+-/, ""),
      url: "/images/" + encodeURIComponent(filename),
      extension,
      mimeType: mimeTypes[extension] || "Unknown",
      sizeBytes: stats.size,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({ message: "Image not found." });
    }

    res.status(500).json({ message: "Could not load image details." });
  }
});

app.delete("/api/images/:filename", async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);

    await fs.unlink(path.join(uploadDir, filename));

    res.json({
      message: "Image deleted successfully.",
    });
  } catch (error) {
    res.status(404).json({
      message: "Image not found.",
    });
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

  res.status(statusCode).json({
    message:
      error.code === "LIMIT_FILE_SIZE"
        ? "Image size must be 10 MB or less."
        : error.message || "Something went wrong.",
  });
});

app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
