import { Router } from "express";
import {
  listExamsController,
  listAuditLogsController,
  getExamByIdController,
  createExamController,
  updateExamController,
  deleteExamController,
  importExamsController,
} from "../controllers/examsController.js";
import { requireRole, validateAuthConfig } from "../middleware/requireWriteAuth.js";

const router = Router();

router.get("/", listExamsController);
router.get("/audit", validateAuthConfig, requireRole(["admin"]), listAuditLogsController);
router.get("/:id", getExamByIdController);
router.post("/", validateAuthConfig, requireRole(["write", "admin"]), createExamController);
router.put("/:id", validateAuthConfig, requireRole(["write", "admin"]), updateExamController);
router.delete("/:id", validateAuthConfig, requireRole(["write", "admin"]), deleteExamController);
router.post("/import", validateAuthConfig, requireRole(["admin"]), importExamsController);

export default router;
