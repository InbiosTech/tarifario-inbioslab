import { Router } from "express";
import multer from "multer";
import {
  createPromotionController,
  deletePromotionController,
  getPromotionController,
  listAdminPromotionsController,
  listPublicPromotionsController,
  updatePromotionController,
} from "../controllers/promotionsController.js";
import { saveOptimizedPromotionImage, uploadPromotionImage } from "../middleware/promotionUploads.js";
import { requireRole, validateAuthConfig } from "../middleware/requireWriteAuth.js";
import { badRequest } from "../utils/httpErrors.js";

const router = Router();

router.get("/", listPublicPromotionsController);

router.post(
  "/upload-image",
  validateAuthConfig,
  requireRole(["write", "admin"]),
  uploadPromotionImage.single("image"),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) {
        throw badRequest("image file is required");
      }

      const saved = await saveOptimizedPromotionImage(file.buffer);
      const cardPath = saved.cardPath;
      const modalPath = saved.modalPath;
      const cardUrl = `${req.protocol}://${req.get("host")}${cardPath}`;
      const modalUrl = `${req.protocol}://${req.get("host")}${modalPath}`;
      return res.status(201).json({
        cardFileName: saved.cardFileName,
        modalFileName: saved.modalFileName,
        cardPath,
        modalPath,
        cardUrl,
        modalUrl,
        path: modalPath,
        url: modalUrl,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/admin", validateAuthConfig, requireRole(["write", "admin"]), listAdminPromotionsController);
router.get("/:id", validateAuthConfig, requireRole(["write", "admin"]), getPromotionController);
router.post("/", validateAuthConfig, requireRole(["write", "admin"]), createPromotionController);
router.put("/:id", validateAuthConfig, requireRole(["write", "admin"]), updatePromotionController);
router.delete("/:id", validateAuthConfig, requireRole(["write", "admin"]), deletePromotionController);

router.use((error, _req, _res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return next(badRequest("Image exceeds 5MB limit"));
    }
    return next(badRequest(error.message));
  }
  return next(error);
});

export default router;
