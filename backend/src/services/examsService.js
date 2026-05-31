import {
  listExams,
  countExams,
  listAuditLogs,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  bulkUpsertExams,
  insertAuditLog,
} from "../repositories/examsRepository.js";
import { normalizeExamPayload, normalizeImportItems, validateExamPayload } from "../utils/examPayload.js";
import { badRequest, notFound } from "../utils/httpErrors.js";

export async function listExamsService(options) {
  const [items, totalItems] = await Promise.all([
    listExams(options),
    countExams(options),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / options.pageSize));

  return {
    items,
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      totalItems,
      totalPages,
    },
  };
}

export async function getExamByIdService(id) {
  const item = await getExamById(id);
  if (!item) {
    throw notFound("Exam not found");
  }
  return item;
}

export async function createExamService(input) {
  const payload = normalizeExamPayload(input);
  const errors = validateExamPayload(payload);
  if (errors.length > 0) {
    throw badRequest("Validation failed", errors);
  }

  const created = await createExam(payload);
  return created;
}

export async function updateExamService(id, input) {
  const payload = normalizeExamPayload(input);
  const errors = validateExamPayload(payload);
  if (errors.length > 0) {
    throw badRequest("Validation failed", errors);
  }

  const updated = await updateExam(id, payload);
  if (!updated) {
    throw notFound("Exam not found");
  }

  return updated;
}

export async function deleteExamService(id) {
  const deleted = await deleteExam(id);
  if (!deleted) {
    throw notFound("Exam not found");
  }
}

export async function importExamsService(input) {
  const items = normalizeImportItems(input);
  if (items.length === 0) {
    throw badRequest("Import payload must include a non-empty items array");
  }

  const validationErrors = [];
  for (let index = 0; index < items.length; index += 1) {
    const errors = validateExamPayload(items[index]);
    if (errors.length > 0) {
      validationErrors.push({ index, errors });
    }
  }

  if (validationErrors.length > 0) {
    throw badRequest("Validation failed for import items", validationErrors);
  }

  const truncateBeforeImport = String(input?.truncate || "false").toLowerCase() === "true";
  return bulkUpsertExams(items, { truncateBeforeImport });
}

export async function createExamWithAuditService(input, auth) {
  const created = await createExamService(input);
  await insertAuditLog({
    action: "CREATE_EXAM",
    examId: created?.id || null,
    actor: auth?.actor || "unknown",
    actorRole: auth?.role || "unknown",
    payload: { name: created?.name },
  });
  return created;
}

export async function updateExamWithAuditService(id, input, auth) {
  const updated = await updateExamService(id, input);
  await insertAuditLog({
    action: "UPDATE_EXAM",
    examId: id,
    actor: auth?.actor || "unknown",
    actorRole: auth?.role || "unknown",
    payload: { name: updated?.name },
  });
  return updated;
}

export async function deleteExamWithAuditService(id, auth) {
  const existing = await getExamByIdService(id);
  await deleteExamService(id);
  await insertAuditLog({
    action: "DELETE_EXAM",
    examId: id,
    actor: auth?.actor || "unknown",
    actorRole: auth?.role || "unknown",
    payload: { name: existing?.name || null },
  });
}

export async function importExamsWithAuditService(input, auth) {
  const result = await importExamsService(input);
  await insertAuditLog({
    action: "IMPORT_EXAMS",
    examId: null,
    actor: auth?.actor || "unknown",
    actorRole: auth?.role || "unknown",
    payload: {
      imported: result.imported,
      truncateBeforeImport: result.truncateBeforeImport,
    },
  });
  return result;
}

export async function listAuditLogsService({ limit = 50 } = {}) {
  return listAuditLogs({ limit });
}
