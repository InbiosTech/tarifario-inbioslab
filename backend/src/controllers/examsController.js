import {
  listExamsService,
  listAuditLogsService,
  getExamByIdService,
  createExamWithAuditService,
  updateExamWithAuditService,
  deleteExamWithAuditService,
  importExamsWithAuditService,
} from "../services/examsService.js";
import { parseIdParam, parseListQuery } from "../utils/queryParams.js";

export async function listExamsController(req, res, next) {
  try {
    const options = parseListQuery(req.query);
    const result = await listExamsService(options);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getExamByIdController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const item = await getExamByIdService(id);
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function createExamController(req, res, next) {
  try {
    const created = await createExamWithAuditService(req.body, req.auth);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateExamController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const updated = await updateExamWithAuditService(id, req.body, req.auth);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteExamController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    await deleteExamWithAuditService(id, req.auth);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function importExamsController(req, res, next) {
  try {
    const result = await importExamsWithAuditService(req.body, req.auth);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listAuditLogsController(req, res, next) {
  try {
    const limit = Number(req.query.limit || 50);
    const rows = await listAuditLogsService({ limit });
    res.json({ items: rows });
  } catch (error) {
    next(error);
  }
}
