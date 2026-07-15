import { badRequest, notFound } from "../utils/httpErrors.js";
import { getEquipmentById } from "../repositories/inventoryRepository.js";
import {
  createSchedulePlan,
  getSchedulePlanById,
  getScheduleTemplateById,
  listPlanActions,
  listPlanExecutions,
  listSchedulePlans,
  listScheduleTemplates,
  listTemplateActions,
  replacePlanActions,
  replaceTemplateActions,
  upsertPlanExecution,
  upsertScheduleTemplate,
} from "../repositories/inventoryScheduleRepository.js";

const ALLOWED_COMPANIES = new Set(["united_trading_sac", "comercial_importadora_sudamericana_sac"]);
const ALLOWED_FREQUENCIES = new Set([3, 4, 6]);

function sanitizeInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.trunc(num);
}

function sanitizeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function sanitizeYear(value) {
  const year = sanitizeInt(value, 0);
  if (year < 2020 || year > 2100) return 0;
  return year;
}

function sanitizeCompany(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_COMPANIES.has(normalized) ? normalized : "united_trading_sac";
}

function sanitizeText(value) {
  return String(value || "").trim();
}

function sanitizeAssetData(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw.startsWith("data:image/")) return raw;
  return null;
}

function normalizeActionRows(input) {
  const rows = Array.isArray(input) ? input : [];
  const normalized = rows
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, 80);
  return [...new Set(normalized)];
}

function buildScheduledMonths(startDate, frequencyMonths, year) {
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return [];

  const month = date.getMonth() + 1;
  const months = [];
  for (let current = month; current <= 12; current += frequencyMonths) {
    months.push(current);
  }

  if (!months.length && year) {
    months.push(month);
  }

  return months;
}

export async function listScheduleTemplatesService(query = {}) {
  const companyName = String(query.companyName || "").trim().toLowerCase();
  const hospitalName = sanitizeText(query.hospitalName);
  const year = sanitizeYear(query.year);

  const templates = await listScheduleTemplates({
    companyName: ALLOWED_COMPANIES.has(companyName) ? companyName : "",
    hospitalName,
    year,
  });

  const items = [];
  for (const template of templates) {
    const actions = await listTemplateActions(template.id);
    items.push({ ...template, actions });
  }

  return { items };
}

export async function upsertScheduleTemplateService(input = {}) {
  const hospitalName = sanitizeText(input.hospitalName);
  const year = sanitizeYear(input.year);
  const title = sanitizeText(input.title || "CRONOGRAMA DE MANTENIMIENTO");
  const institutionName = sanitizeText(input.institutionName || hospitalName);
  const actions = normalizeActionRows(input.actions);

  if (!hospitalName) {
    throw badRequest("hospitalName is required");
  }

  if (!year) {
    throw badRequest("year is required");
  }

  if (actions.length === 0) {
    throw badRequest("At least one action row is required");
  }

  const payload = {
    companyName: sanitizeCompany(input.companyName),
    hospitalName,
    year,
    title,
    institutionName,
    logoData: sanitizeAssetData(input.logoData),
    sealLeftData: sanitizeAssetData(input.sealLeftData),
    sealRightData: sanitizeAssetData(input.sealRightData),
    signatureData: sanitizeAssetData(input.signatureData),
    stampData: sanitizeAssetData(input.stampData),
    footerLeft: sanitizeText(input.footerLeft),
    footerCenter: sanitizeText(input.footerCenter),
    footerRight: sanitizeText(input.footerRight),
  };

  const templateId = await upsertScheduleTemplate(payload);
  if (!templateId) {
    throw badRequest("Template could not be saved");
  }

  await replaceTemplateActions(templateId, actions);

  const template = await getScheduleTemplateById(templateId);
  const actionRows = await listTemplateActions(templateId);
  return { ...template, actions: actionRows };
}

export async function listSchedulePlansService(query = {}) {
  const companyName = String(query.companyName || "").trim().toLowerCase();
  const hospitalName = sanitizeText(query.hospitalName);
  const year = sanitizeYear(query.year);
  const equipmentId = sanitizeInt(query.equipmentId, 0);

  const items = await listSchedulePlans({
    companyName: ALLOWED_COMPANIES.has(companyName) ? companyName : "",
    hospitalName,
    year,
    equipmentId,
  });

  return { items };
}

export async function createSchedulePlanService(input = {}) {
  const equipmentId = sanitizeInt(input.equipmentId, 0);
  const templateId = sanitizeInt(input.templateId, 0);
  const hospitalName = sanitizeText(input.hospitalName);
  const year = sanitizeYear(input.year);
  const startDate = sanitizeDate(input.startDate);
  const frequencyMonths = sanitizeInt(input.frequencyMonths, 0);

  if (!equipmentId) throw badRequest("equipmentId is required");
  if (!templateId) throw badRequest("templateId is required");
  if (!hospitalName) throw badRequest("hospitalName is required");
  if (!year) throw badRequest("year is required");
  if (!startDate) throw badRequest("startDate is required");
  if (!ALLOWED_FREQUENCIES.has(frequencyMonths)) {
    throw badRequest("frequencyMonths must be 3, 4 or 6");
  }

  const equipment = await getEquipmentById(equipmentId);
  if (!equipment) throw notFound("Equipment not found");

  const template = await getScheduleTemplateById(templateId);
  if (!template) throw notFound("Template not found");

  const planId = await createSchedulePlan({
    equipmentId,
    templateId,
    companyName: sanitizeCompany(input.companyName || equipment.company_name),
    hospitalName,
    year,
    frequencyMonths,
    startDate,
  });

  const templateActions = await listTemplateActions(templateId);
  const actionRows = templateActions.map((row) => row.action_name);
  await replacePlanActions(planId, actionRows);

  return getSchedulePlanDetailService(planId);
}

export async function getSchedulePlanDetailService(id) {
  const planId = sanitizeInt(id, 0);
  if (!planId) throw badRequest("Invalid plan id");

  const plan = await getSchedulePlanById(planId);
  if (!plan) throw notFound("Schedule plan not found");

  const actions = await listPlanActions(planId);
  const executions = await listPlanExecutions(planId);
  const executedMonths = [...new Set(executions.map((item) => Number(item.month_number)).filter((num) => num >= 1 && num <= 12))].sort((a, b) => a - b);

  const actionRows = actions.map((action) => ({
    ...action,
    checks: Array.from({ length: 12 }, (_value, index) => executedMonths.includes(index + 1)),
  }));

  const scheduledMonths = buildScheduledMonths(plan.start_date, Number(plan.frequency_months), Number(plan.year));

  return {
    plan,
    actions: actionRows,
    executions,
    executedMonths,
    scheduledMonths,
  };
}

export async function updateSchedulePlanActionsService(id, input = {}) {
  const planId = sanitizeInt(id, 0);
  if (!planId) throw badRequest("Invalid plan id");

  const plan = await getSchedulePlanById(planId);
  if (!plan) throw notFound("Schedule plan not found");

  const actions = normalizeActionRows(input.actions);
  if (actions.length === 0) {
    throw badRequest("At least one action row is required");
  }

  await replacePlanActions(planId, actions);
  return getSchedulePlanDetailService(planId);
}

export async function registerScheduleExecutionService(id, input = {}) {
  const planId = sanitizeInt(id, 0);
  if (!planId) throw badRequest("Invalid plan id");

  const plan = await getSchedulePlanById(planId);
  if (!plan) throw notFound("Schedule plan not found");

  const performedAt = sanitizeDate(input.performedAt);
  if (!performedAt) throw badRequest("performedAt is required");

  const executionYear = Number(performedAt.slice(0, 4));
  if (executionYear !== Number(plan.year)) {
    throw badRequest(`performedAt must be inside year ${plan.year}`);
  }

  const monthNumber = Number(performedAt.slice(5, 7));
  await upsertPlanExecution(planId, {
    performedAt,
    monthNumber,
    notes: sanitizeText(input.notes),
  });

  return getSchedulePlanDetailService(planId);
}
