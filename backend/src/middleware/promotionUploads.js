import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import { badRequest } from "../utils/httpErrors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promotionsUploadDir = path.resolve(__dirname, "..", "..", "uploads", "promotions");
let sharpFactoryPromise;
let storageCtorPromise;

function trimTrailingSlashes(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getStorageBucketName() {
  return String(env.promotionsAssetsBucket || "").trim();
}

function getPublicBaseUrl() {
  const configured = trimTrailingSlashes(env.promotionsAssetsPublicBaseUrl);
  if (configured) return configured;

  const bucketName = getStorageBucketName();
  if (!bucketName) return "";
  return `https://storage.googleapis.com/${bucketName}`;
}

async function getSharpFactory() {
  if (!sharpFactoryPromise) {
    sharpFactoryPromise = import("sharp")
      .then((mod) => mod.default || mod)
      .catch((error) => {
        sharpFactoryPromise = null;
        throw error;
      });
  }

  return sharpFactoryPromise;
}

async function getStorageCtor() {
  if (!storageCtorPromise) {
    storageCtorPromise = import("@google-cloud/storage")
      .then((mod) => mod.Storage)
      .catch((error) => {
        storageCtorPromise = null;
        throw error;
      });
  }

  return storageCtorPromise;
}

function ensurePromotionUploadsDir() {
  try {
    fs.mkdirSync(promotionsUploadDir, { recursive: true });
  } catch (_error) {
    throw badRequest("No se pudo preparar el directorio de imagenes");
  }
}

function buildStoredPaths(cardFileName, modalFileName) {
  const publicBaseUrl = getPublicBaseUrl();
  if (publicBaseUrl) {
    return {
      cardPath: `${publicBaseUrl}/promotions/${cardFileName}`,
      modalPath: `${publicBaseUrl}/promotions/${modalFileName}`,
    };
  }

  return {
    cardPath: `/uploads/promotions/${cardFileName}`,
    modalPath: `/uploads/promotions/${modalFileName}`,
  };
}

async function saveImageToCloudStorage({ bucketName, relativePath, content }) {
  const Storage = await getStorageCtor().catch(() => {
    throw badRequest("Cloud Storage SDK is not available on this runtime");
  });

  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(relativePath);

  await file.save(content, {
    resumable: false,
    validation: false,
    metadata: {
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
}

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
  const sharp = await getSharpFactory().catch(() => {
    throw badRequest("Image processing is not available on this runtime");
  });
  const bucketName = getStorageBucketName();
  const useCloudStorage = Boolean(bucketName);

  if (env.isProduction && !useCloudStorage) {
    throw badRequest("PROMOTIONS_ASSETS_BUCKET_PROD must be configured in production");
  }

  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const cardFileName = `promo-${unique}-card.webp`;
  const modalFileName = `promo-${unique}-modal.webp`;
  const cardOutputPath = path.resolve(promotionsUploadDir, cardFileName);
  const modalOutputPath = path.resolve(promotionsUploadDir, modalFileName);
  const cardRelativePath = `promotions/${cardFileName}`;
  const modalRelativePath = `promotions/${modalFileName}`;

  const cardBuffer = await sharp(fileBuffer)
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
    .toBuffer();

  const modalBuffer = await sharp(fileBuffer)
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
    .toBuffer();

  if (useCloudStorage) {
    await Promise.all([
      saveImageToCloudStorage({
        bucketName,
        relativePath: cardRelativePath,
        content: cardBuffer,
      }),
      saveImageToCloudStorage({
        bucketName,
        relativePath: modalRelativePath,
        content: modalBuffer,
      }),
    ]);
  } else {
    ensurePromotionUploadsDir();
    await Promise.all([
      fs.promises.writeFile(cardOutputPath, cardBuffer),
      fs.promises.writeFile(modalOutputPath, modalBuffer),
    ]);
  }

  const stored = buildStoredPaths(cardFileName, modalFileName);

  return {
    cardFileName,
    modalFileName,
    cardPath: stored.cardPath,
    modalPath: stored.modalPath,
    storageMode: useCloudStorage ? "gcs" : "local",
  };
}
