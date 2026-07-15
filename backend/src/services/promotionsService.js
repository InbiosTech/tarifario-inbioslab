import { badRequest, notFound } from "../utils/httpErrors.js";
import {
  createPromotion,
  deletePromotion,
  getPromotionById,
  listPromotionsPaginated,
  listPublicPromotions,
  listPublicPromotionsByAudience,
  updatePromotion,
} from "../repositories/promotionsRepository.js";
import { getExamById, insertAuditLog } from "../repositories/examsRepository.js";
import { normalizePromotionPayload, validatePromotionPayload } from "../utils/promotionPayload.js";

function isRecoverablePromotionSchemaError(error) {
  const code = String(error?.code || "").trim().toUpperCase();
  return (
    code === "ER_NO_SUCH_TABLE" ||
    code === "ER_BAD_FIELD_ERROR" ||
    code === "ER_TABLEACCESS_DENIED_ERROR" ||
    code === "ER_DBACCESS_DENIED_ERROR" ||
    code === "ER_ACCESS_DENIED_ERROR"
  );
}

function resolveExamFundament(exam) {
  const method = String(exam?.method || "").trim();
  if (method) return method;
  return String(exam?.info || "").trim();
}

async function applyExamAutoData(payload) {
  const exam = await getExamById(payload.examId);
  if (!exam) {
    throw notFound("Exam not found for promotion");
  }

  const fundament = resolveExamFundament(exam);

  const basePrice = Number(exam?.price1 ?? 0);
  const safeBasePrice = Number.isFinite(basePrice) && basePrice >= 0 ? basePrice : 0;
  const promoPrice = Number.isFinite(payload.promoPrice) && payload.promoPrice >= 0
    ? payload.promoPrice
    : safeBasePrice;
  const baseConvenio = Number(exam?.price2 ?? exam?.price_convenio ?? safeBasePrice);
  const safeBaseConvenio = Number.isFinite(baseConvenio) && baseConvenio >= 0 ? baseConvenio : safeBasePrice;
  const promoPricePublic = Number.isFinite(payload.promoPricePublic) && payload.promoPricePublic >= 0
    ? payload.promoPricePublic
    : promoPrice;
  const promoPriceConvenio = Number.isFinite(payload.promoPriceConvenio) && payload.promoPriceConvenio >= 0
    ? payload.promoPriceConvenio
    : safeBaseConvenio;

  return {
    ...payload,
    title: payload.title || String(exam?.name || "").trim(),
    description: payload.description || String(exam?.sample || "").trim(),
    name: payload.name || String(exam?.name || "").trim(),
    fundament,
    longDescription: payload.longDescription || fundament,
    appliesTo: payload.appliesTo || "publico",
    price: safeBasePrice,
    promoPrice,
    promoPricePublic,
    promoPriceConvenio,
  };
}

export async function getPublicPromotions(query = {}) {
  const audience = String(query.audience || "publico").trim().toLowerCase();

  try {
    if (audience === "convenio") {
      return listPublicPromotionsByAudience({ audience: "convenio" });
    }
    return listPublicPromotions();
  } catch (error) {
    // Public landing should remain available even if promotions query fails.
    console.error("Failed to list public promotions", {
      audience,
      code: error?.code,
      message: error?.message,
    });

    return [];
  }
}

export async function getAdminPromotions(query) {
  const includeInactive = String(query.includeInactive || "0") === "1";
  const search = String(query.search || "").trim();
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 20);
  const sortBy = String(query.sortBy || "displayOrder");
  const sortOrder = String(query.sortOrder || "asc");

  if (!Number.isInteger(page) || page < 1) {
    throw badRequest("page must be an integer >= 1");
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw badRequest("pageSize must be an integer between 1 and 100");
  }

  let items = [];
  let totalItems = 0;

  try {
    const response = await listPromotionsPaginated({
      includeInactive,
      search,
      pageSize,
      offset: (page - 1) * pageSize,
      sortBy,
      sortOrder,
    });

    items = response.items;
    totalItems = response.totalItems;
  } catch (error) {
    if (!isRecoverablePromotionSchemaError(error)) {
      throw error;
    }
  }

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

export async function getPromotionDetail(id) {
  const row = await getPromotionById(id);
  if (!row) {
    throw notFound("Promotion not found");
  }
  return row;
}

export async function createPromotionRecord(payload, auth) {
  const normalizedInput = normalizePromotionPayload(payload);
  const normalized = await applyExamAutoData(normalizedInput);
  const errors = validatePromotionPayload(normalized);
  if (errors.length) {
    throw badRequest(errors.join("; "));
  }

  const promotionId = await createPromotion(normalized);

  await insertAuditLog({
    action: "promotion_created",
    examId: null,
    actor: auth.actor,
    actorRole: auth.role,
    payload: {
      promotionId,
      title: normalized.title,
      price: normalized.price,
      promoPrice: normalized.promoPrice,
    },
  });

  return getPromotionDetail(promotionId);
}

export async function updatePromotionRecord(id, payload, auth) {
  const existing = await getPromotionById(id);
  if (!existing) {
    throw notFound("Promotion not found");
  }

  const normalizedInput = normalizePromotionPayload({ ...existing, ...payload, id });
  const normalized = await applyExamAutoData(normalizedInput);
  const errors = validatePromotionPayload(normalized);
  if (errors.length) {
    throw badRequest(errors.join("; "));
  }

  const affected = await updatePromotion(id, normalized);
  if (!affected) {
    throw notFound("Promotion not found");
  }

  await insertAuditLog({
    action: "promotion_updated",
    examId: null,
    actor: auth.actor,
    actorRole: auth.role,
    payload: {
      promotionId: id,
      title: normalized.title,
      price: normalized.price,
      promoPrice: normalized.promoPrice,
    },
  });

  return getPromotionDetail(id);
}

export async function deletePromotionRecord(id, auth) {
  const existing = await getPromotionById(id);
  if (!existing) {
    throw notFound("Promotion not found");
  }

  const affected = await deletePromotion(id);
  if (!affected) {
    throw notFound("Promotion not found");
  }

  await insertAuditLog({
    action: "promotion_deleted",
    examId: null,
    actor: auth.actor,
    actorRole: auth.role,
    payload: {
      promotionId: id,
      title: existing.title,
    },
  });

  return { deleted: true };
}
