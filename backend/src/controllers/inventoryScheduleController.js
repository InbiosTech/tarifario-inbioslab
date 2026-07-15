import { parseIdParam } from "../utils/queryParams.js";
import {
  createSchedulePlanService,
  getSchedulePlanDetailService,
  listSchedulePlansService,
  listScheduleTemplatesService,
  registerScheduleExecutionService,
  updateSchedulePlanActionsService,
  upsertScheduleTemplateService,
} from "../services/inventoryScheduleService.js";

export async function listScheduleTemplatesController(req, res, next) {
  try {
    const response = await listScheduleTemplatesService(req.query);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function upsertScheduleTemplateController(req, res, next) {
  try {
    const response = await upsertScheduleTemplateService(req.body);
    return res.status(201).json(response);
  } catch (error) {
    return next(error);
  }
}

export async function listSchedulePlansController(req, res, next) {
  try {
    const response = await listSchedulePlansService(req.query);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function createSchedulePlanController(req, res, next) {
  try {
    const response = await createSchedulePlanService(req.body);
    return res.status(201).json(response);
  } catch (error) {
    return next(error);
  }
}

export async function getSchedulePlanDetailController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const response = await getSchedulePlanDetailService(id);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function updateSchedulePlanActionsController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const response = await updateSchedulePlanActionsService(id, req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function registerScheduleExecutionController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const response = await registerScheduleExecutionService(id, req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}
