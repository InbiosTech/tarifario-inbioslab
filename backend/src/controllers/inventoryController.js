import { parseIdParam } from "../utils/queryParams.js";
export {
  createSchedulePlanController,
  getSchedulePlanDetailController,
  listSchedulePlansController,
  listScheduleTemplatesController,
  registerScheduleExecutionController,
  updateSchedulePlanActionsController,
  upsertScheduleTemplateController,
} from "./inventoryScheduleController.js";
import {
  completeMaintenanceService,
  createEquipmentAccessoryService,
  createEquipmentMaintenanceService,
  createInventoryEquipmentService,
  createServiceCallService,
  deleteEquipmentAccessoryService,
  deleteInventoryEquipmentService,
  getInventoryEquipmentService,
  listEquipmentAccessoriesService,
  listEquipmentMaintenanceService,
  listInventoryEquipmentService,
  listServiceCallsService,
  listUpcomingMaintenanceService,
  resolveServiceCallService,
  updateEquipmentAccessoryService,
  updateInventoryEquipmentService,
  updateInventoryEquipmentStatusService,
} from "../services/inventoryService.js";

export async function listInventoryEquipmentController(req, res, next) {
  try {
    const response = await listInventoryEquipmentService(req.query);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function getInventoryEquipmentController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const item = await getInventoryEquipmentService(id);
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function createInventoryEquipmentController(req, res, next) {
  try {
    const created = await createInventoryEquipmentService(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
}

export async function updateInventoryEquipmentController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const updated = await updateInventoryEquipmentService(id, req.body);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export async function updateInventoryEquipmentStatusController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const updated = await updateInventoryEquipmentStatusService(id, req.body?.operationalStatus);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export async function deleteInventoryEquipmentController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    await deleteInventoryEquipmentService(id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function listEquipmentAccessoriesController(req, res, next) {
  try {
    const equipmentId = parseIdParam(req.params.id);
    const items = await listEquipmentAccessoriesService(equipmentId);
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
}

export async function createEquipmentAccessoryController(req, res, next) {
  try {
    const equipmentId = parseIdParam(req.params.id);
    const item = await createEquipmentAccessoryService(equipmentId, req.body);
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
}

export async function updateEquipmentAccessoryController(req, res, next) {
  try {
    const equipmentId = parseIdParam(req.params.id);
    const accessoryId = parseIdParam(req.params.accessoryId);
    const item = await updateEquipmentAccessoryService(equipmentId, accessoryId, req.body);
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function deleteEquipmentAccessoryController(req, res, next) {
  try {
    const accessoryId = parseIdParam(req.params.accessoryId);
    await deleteEquipmentAccessoryService(accessoryId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function listEquipmentMaintenanceController(req, res, next) {
  try {
    const equipmentId = parseIdParam(req.params.id);
    const items = await listEquipmentMaintenanceService(equipmentId);
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
}

export async function createEquipmentMaintenanceController(req, res, next) {
  try {
    const equipmentId = parseIdParam(req.params.id);
    const item = await createEquipmentMaintenanceService(equipmentId, req.body);
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
}

export async function completeMaintenanceController(req, res, next) {
  try {
    const id = parseIdParam(req.params.maintenanceId);
    const response = await completeMaintenanceService(id);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function listUpcomingMaintenanceController(req, res, next) {
  try {
    const response = await listUpcomingMaintenanceService(req.query);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function listServiceCallsController(req, res, next) {
  try {
    const response = await listServiceCallsService(req.query);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function createServiceCallController(req, res, next) {
  try {
    const created = await createServiceCallService(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
}

export async function resolveServiceCallController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const response = await resolveServiceCallService(id, req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}
