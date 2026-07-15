import { Router } from "express";
import {
  completeMaintenanceController,
  createEquipmentAccessoryController,
  createEquipmentMaintenanceController,
  createInventoryEquipmentController,
  createServiceCallController,
  createSchedulePlanController,
  deleteEquipmentAccessoryController,
  deleteInventoryEquipmentController,
  getSchedulePlanDetailController,
  getInventoryEquipmentController,
  listEquipmentAccessoriesController,
  listEquipmentMaintenanceController,
  listInventoryEquipmentController,
  listSchedulePlansController,
  listScheduleTemplatesController,
  listServiceCallsController,
  listUpcomingMaintenanceController,
  registerScheduleExecutionController,
  resolveServiceCallController,
  updateSchedulePlanActionsController,
  updateEquipmentAccessoryController,
  updateInventoryEquipmentController,
  updateInventoryEquipmentStatusController,
  upsertScheduleTemplateController,
} from "../controllers/inventoryController.js";
import { requireRole, validateAuthConfig } from "../middleware/requireWriteAuth.js";

const router = Router();

router.use(validateAuthConfig, requireRole(["write", "admin"]));

router.get("/equipment", listInventoryEquipmentController);
router.get("/equipment/:id", getInventoryEquipmentController);
router.post("/equipment", createInventoryEquipmentController);
router.put("/equipment/:id", updateInventoryEquipmentController);
router.patch("/equipment/:id/status", updateInventoryEquipmentStatusController);
router.delete("/equipment/:id", deleteInventoryEquipmentController);

router.get("/equipment/:id/accessories", listEquipmentAccessoriesController);
router.post("/equipment/:id/accessories", createEquipmentAccessoryController);
router.put("/equipment/:id/accessories/:accessoryId", updateEquipmentAccessoryController);
router.delete("/equipment/:id/accessories/:accessoryId", deleteEquipmentAccessoryController);

router.get("/equipment/:id/maintenance", listEquipmentMaintenanceController);
router.post("/equipment/:id/maintenance", createEquipmentMaintenanceController);
router.patch("/maintenance/:maintenanceId/complete", completeMaintenanceController);
router.get("/maintenance/upcoming", listUpcomingMaintenanceController);

router.get("/service-calls", listServiceCallsController);
router.post("/service-calls", createServiceCallController);
router.patch("/service-calls/:id/resolve", resolveServiceCallController);

router.get("/schedule/templates", listScheduleTemplatesController);
router.post("/schedule/templates", upsertScheduleTemplateController);
router.get("/schedule/plans", listSchedulePlansController);
router.post("/schedule/plans", createSchedulePlanController);
router.get("/schedule/plans/:id", getSchedulePlanDetailController);
router.put("/schedule/plans/:id/actions", updateSchedulePlanActionsController);
router.post("/schedule/plans/:id/executions", registerScheduleExecutionController);

export default router;
