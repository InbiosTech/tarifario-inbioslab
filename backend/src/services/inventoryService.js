import { badRequest, notFound } from "../utils/httpErrors.js";
import {
  createAccessory,
  createEquipment,
  createMaintenance,
  createServiceCall,
  deleteAccessory,
  deleteEquipment,
  getEquipmentById,
  listAccessoriesByEquipmentId,
  listEquipment,
  listMaintenanceByEquipmentId,
  listServiceCalls,
  listUpcomingMaintenance,
  markMaintenanceCompleted,
  resolveServiceCall,
  updateAccessory,
  updateEquipment,
  updateEquipmentStatus,
} from "../repositories/inventoryRepository.js";

const ALLOWED_TYPES = new Set(["laboratorio", "aire_acondicionado"]);
const ALLOWED_STATUS = new Set(["operativo", "inoperativo", "malogrado", "en_observacion"]);
const ALLOWED_COMPANIES = new Set(["united_trading_sac", "comercial_importadora_sudamericana_sac"]);

function sanitizeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function sanitizeInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.trunc(num);
}

function normalizeEquipmentPayload(input = {}) {
  const equipmentType = String(input.equipmentType || "laboratorio").trim().toLowerCase();
  const operationalStatus = String(input.operationalStatus || "operativo").trim().toLowerCase();
  const companyName = String(input.companyName || "united_trading_sac").trim().toLowerCase();

  return {
    companyName: ALLOWED_COMPANIES.has(companyName) ? companyName : "united_trading_sac",
    equipmentType: ALLOWED_TYPES.has(equipmentType) ? equipmentType : "laboratorio",
    brand: String(input.brand || "").trim(),
    model: String(input.model || "").trim(),
    serialNumber: String(input.serialNumber || "").trim(),
    invoiceNumber: String(input.invoiceNumber || "").trim() || null,
    importDate: sanitizeDate(input.importDate),
    installLocation: String(input.installLocation || "").trim() || null,
    areaName: String(input.areaName || "").trim() || null,
    ingressDate: sanitizeDate(input.ingressDate),
    conditionStatus: String(input.conditionStatus || "").trim().toLowerCase() || "cesion_en_uso",
    operationalStatus: ALLOWED_STATUS.has(operationalStatus) ? operationalStatus : "operativo",
    nextMaintenanceDate: sanitizeDate(input.nextMaintenanceDate),
    maintenanceAlertDays: Math.max(1, sanitizeInt(input.maintenanceAlertDays, 30)),
    notes: String(input.notes || "").trim() || null,
  };
}

function validateEquipmentPayload(payload) {
  const errors = [];

  if (!payload.brand) errors.push("brand is required");
  if (!payload.model) errors.push("model is required");
  if (!payload.serialNumber) errors.push("serialNumber is required");

  return errors;
}

function normalizeAccessoryPayload(input = {}) {
  return {
    accessoryName: String(input.accessoryName || "").trim(),
    brand: String(input.brand || "").trim() || null,
    serialNumber: String(input.serialNumber || "").trim() || null,
    ingressDate: sanitizeDate(input.ingressDate),
    notes: String(input.notes || "").trim() || null,
  };
}

function normalizeMaintenancePayload(input = {}) {
  return {
    plannedDate: sanitizeDate(input.plannedDate),
    completedAt: input.completedAt ? String(input.completedAt) : null,
    notes: String(input.notes || "").trim() || null,
  };
}

function sanitizeDateTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw.replace("T", " ").slice(0, 19);
  if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(normalized)) return null;
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

function normalizeServiceCallPayload(input = {}) {
  const companyName = String(input.companyName || "united_trading_sac").trim().toLowerCase();
  const status = String(input.status || "abierto").trim().toLowerCase();
  const resolvedAt = sanitizeDateTime(input.resolvedAt);

  return {
    companyName: ALLOWED_COMPANIES.has(companyName) ? companyName : "united_trading_sac",
    equipmentId: input.equipmentId ? sanitizeInt(input.equipmentId, 0) : null,
    reportedAt: sanitizeDateTime(input.reportedAt) || new Date().toISOString().slice(0, 19).replace("T", " "),
    issueDescription: String(input.issueDescription || "").trim(),
    actionTaken: String(input.actionTaken || "").trim() || null,
    status: status === "resuelto" ? "resuelto" : "abierto",
    resolvedAt: status === "resuelto" ? (resolvedAt || new Date().toISOString().slice(0, 19).replace("T", " ")) : resolvedAt,
  };
}

export async function listInventoryEquipmentService(query = {}) {
  const page = Math.max(1, sanitizeInt(query.page, 1));
  const pageSize = Math.min(100, Math.max(1, sanitizeInt(query.pageSize, 20)));
  const search = String(query.search || "").trim();
  const equipmentType = String(query.equipmentType || "").trim().toLowerCase();
  const operationalStatus = String(query.operationalStatus || "").trim().toLowerCase();
  const companyName = String(query.companyName || "").trim().toLowerCase();

  const { items, totalItems } = await listEquipment({
    page,
    pageSize,
    search,
    equipmentType: ALLOWED_TYPES.has(equipmentType) ? equipmentType : "",
    operationalStatus: ALLOWED_STATUS.has(operationalStatus) ? operationalStatus : "",
    companyName: ALLOWED_COMPANIES.has(companyName) ? companyName : "",
  });

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

export async function getInventoryEquipmentService(id) {
  const item = await getEquipmentById(id);
  if (!item) {
    throw notFound("Equipment not found");
  }

  return item;
}

export async function createInventoryEquipmentService(input) {
  const payload = normalizeEquipmentPayload(input);
  const errors = validateEquipmentPayload(payload);
  if (errors.length > 0) {
    throw badRequest("Validation failed", errors);
  }

  const id = await createEquipment(payload);
  return getInventoryEquipmentService(id);
}

export async function updateInventoryEquipmentService(id, input) {
  const payload = normalizeEquipmentPayload(input);
  const errors = validateEquipmentPayload(payload);
  if (errors.length > 0) {
    throw badRequest("Validation failed", errors);
  }

  const affected = await updateEquipment(id, payload);
  if (!affected) {
    throw notFound("Equipment not found");
  }

  return getInventoryEquipmentService(id);
}

export async function updateInventoryEquipmentStatusService(id, status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    throw badRequest("Invalid operational status");
  }

  const affected = await updateEquipmentStatus(id, normalizedStatus);
  if (!affected) {
    throw notFound("Equipment not found");
  }

  return getInventoryEquipmentService(id);
}

export async function deleteInventoryEquipmentService(id) {
  const affected = await deleteEquipment(id);
  if (!affected) {
    throw notFound("Equipment not found");
  }
}

export async function listEquipmentAccessoriesService(equipmentId) {
  await getInventoryEquipmentService(equipmentId);
  return listAccessoriesByEquipmentId(equipmentId);
}

export async function createEquipmentAccessoryService(equipmentId, input) {
  await getInventoryEquipmentService(equipmentId);
  const payload = normalizeAccessoryPayload(input);
  if (!payload.accessoryName) {
    throw badRequest("accessoryName is required");
  }

  const id = await createAccessory(equipmentId, payload);
  const rows = await listAccessoriesByEquipmentId(equipmentId);
  return rows.find((item) => Number(item.id) === Number(id)) || null;
}

export async function updateEquipmentAccessoryService(equipmentId, accessoryId, input) {
  await getInventoryEquipmentService(equipmentId);
  const payload = normalizeAccessoryPayload(input);
  if (!payload.accessoryName) {
    throw badRequest("accessoryName is required");
  }

  const affected = await updateAccessory(accessoryId, payload);
  if (!affected) {
    throw notFound("Accessory not found");
  }

  const rows = await listAccessoriesByEquipmentId(equipmentId);
  return rows.find((item) => Number(item.id) === Number(accessoryId)) || null;
}

export async function deleteEquipmentAccessoryService(accessoryId) {
  const affected = await deleteAccessory(accessoryId);
  if (!affected) {
    throw notFound("Accessory not found");
  }
}

export async function listEquipmentMaintenanceService(equipmentId) {
  await getInventoryEquipmentService(equipmentId);
  return listMaintenanceByEquipmentId(equipmentId);
}

export async function createEquipmentMaintenanceService(equipmentId, input) {
  await getInventoryEquipmentService(equipmentId);

  const payload = normalizeMaintenancePayload(input);
  if (!payload.plannedDate) {
    throw badRequest("plannedDate is required");
  }

  const id = await createMaintenance(equipmentId, payload);
  const rows = await listMaintenanceByEquipmentId(equipmentId);
  return rows.find((item) => Number(item.id) === Number(id)) || null;
}

export async function completeMaintenanceService(id) {
  const affected = await markMaintenanceCompleted(id);
  if (!affected) {
    throw notFound("Maintenance not found");
  }

  return { completed: true };
}

export async function listUpcomingMaintenanceService(query = {}) {
  const days = Math.max(1, Math.min(365, sanitizeInt(query.days, 30)));
  const companyName = String(query.companyName || "").trim().toLowerCase();
  const items = await listUpcomingMaintenance({
    days,
    companyName: ALLOWED_COMPANIES.has(companyName) ? companyName : "",
  });
  return { items, days };
}

export async function listServiceCallsService(query = {}) {
  const page = Math.max(1, sanitizeInt(query.page, 1));
  const pageSize = Math.min(200, Math.max(1, sanitizeInt(query.pageSize, 20)));
  const companyName = String(query.companyName || "").trim().toLowerCase();
  const search = String(query.search || "").trim();
  const equipmentId = sanitizeInt(query.equipmentId, 0);

  const { items, totalItems } = await listServiceCalls({
    page,
    pageSize,
    companyName: ALLOWED_COMPANIES.has(companyName) ? companyName : "",
    equipmentId: equipmentId > 0 ? equipmentId : 0,
    search,
  });

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

export async function createServiceCallService(input) {
  const payload = normalizeServiceCallPayload(input);
  if (!payload.issueDescription) {
    throw badRequest("issueDescription is required");
  }

  if (payload.equipmentId) {
    await getInventoryEquipmentService(payload.equipmentId);
  }

  const id = await createServiceCall(payload);
  const { items } = await listServiceCalls({ page: 1, pageSize: 1, companyName: payload.companyName, equipmentId: 0, search: "" });
  return items.find((item) => Number(item.id) === Number(id)) || null;
}

export async function resolveServiceCallService(id, input) {
  const payload = {
    actionTaken: String(input?.actionTaken || "").trim(),
    resolvedAt: sanitizeDateTime(input?.resolvedAt) || null,
  };

  const affected = await resolveServiceCall(id, payload);
  if (!affected) {
    throw notFound("Service call not found");
  }

  return { resolved: true };
}
