import { Router } from "express";
import {
  getAdminSettingsController,
  getPublicSettingsController,
  updateWhatsappQuoteNumberController,
} from "../controllers/settingsController.js";
import { requireRole, validateAuthConfig } from "../middleware/requireWriteAuth.js";

const router = Router();

router.get("/public", getPublicSettingsController);
router.get("/admin", validateAuthConfig, requireRole(["write", "admin"]), getAdminSettingsController);
router.put("/admin/whatsapp-number", validateAuthConfig, requireRole(["write", "admin"]), updateWhatsappQuoteNumberController);

export default router;
