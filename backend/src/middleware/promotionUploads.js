import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { badRequest } from "../utils/httpErrors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promotionsUploadDir = path.resolve(__dirname, "..", "..", "uploads", "promotions");

fs.mkdirSync(promotionsUploadDir, { recursive: true });

const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function fileFilter(_req, file, cb) {
  if (!allowedMime.has(String(file.mimetype || "").toLowerCase())) {
    cb(badRequest("Only image files are allowed (jpg, png, webp, gif)"));
    return;
  }
  cb(null, true);
}

export const uploadPromotionImage = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export async function saveOptimizedPromotionImage(fileBuffer) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const cardFileName = `promo-${unique}-card.webp`;
  const modalFileName = `promo-${unique}-modal.webp`;
  const cardOutputPath = path.resolve(promotionsUploadDir, cardFileName);
  const modalOutputPath = path.resolve(promotionsUploadDir, modalFileName);

  await sharp(fileBuffer)
    .rotate()
    .resize({
      width: 960,
      height: 540,
      fit: "contain",
      background: "#eef8f8",
    })
    .webp({
      quality: 80,
      effort: 4,
    })
    .toFile(cardOutputPath);

  await sharp(fileBuffer)
    .rotate()
    .resize({
      width: 1280,
      height: 720,
      fit: "cover",
      position: "center",
    })
    .webp({
      quality: 82,
      effort: 4,
    })
    .toFile(modalOutputPath);

  return {
    cardFileName,
    modalFileName,
    cardPath: `/uploads/promotions/${cardFileName}`,
    modalPath: `/uploads/promotions/${modalFileName}`,
  };
}
