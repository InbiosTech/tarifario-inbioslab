export function normalizePromotionPayload(input = {}) {
  const normalizedId = Number(input.id);
  const normalizedExamId = Number(input.examId ?? input.exam_id);
  const normalizedPrice = Number(input.price ?? input.price1 ?? 0);
  const normalizedPromoPrice = Number(input.promoPrice ?? input.promo_price);
  const normalizedPromoPricePublic = Number(input.promoPricePublic ?? input.promo_price_public ?? input.promoPrice ?? input.promo_price);
  const normalizedPromoPriceConvenio = Number(input.promoPriceConvenio ?? input.promo_price_convenio ?? input.promoPrice ?? input.promo_price);
  const normalizedDisplayOrder = Number(input.displayOrder ?? input.display_order ?? 0);

  return {
    id: Number.isInteger(normalizedId) && normalizedId > 0 ? normalizedId : undefined,
    examId: Number.isInteger(normalizedExamId) && normalizedExamId > 0 ? normalizedExamId : NaN,
    code: String(input.code || "").trim() || null,
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim(),
    fundament: String(input.fundament || "").trim(),
    longDescription: String(input.longDescription || input.long_description || "").trim(),
    name: String(input.name || "").trim(),
    image: String(input.image || input.image_url || "").trim(),
    imageCard: String(input.imageCard || input.image_card || input.image_card_url || input.image || input.image_url || "").trim(),
    imageModal: String(input.imageModal || input.image_modal || input.image_modal_url || input.image || input.image_url || "").trim(),
    appliesTo: String(input.appliesTo || input.applies_to || "publico").trim().toLowerCase(),
    price: Number.isFinite(normalizedPrice) ? normalizedPrice : NaN,
    promoPrice: Number.isFinite(normalizedPromoPrice) ? normalizedPromoPrice : NaN,
    promoPricePublic: Number.isFinite(normalizedPromoPricePublic) ? normalizedPromoPricePublic : NaN,
    promoPriceConvenio: Number.isFinite(normalizedPromoPriceConvenio) ? normalizedPromoPriceConvenio : NaN,
    active: Number(input.active ?? input.is_active) === 0 ? 0 : 1,
    displayOrder: Number.isFinite(normalizedDisplayOrder) ? normalizedDisplayOrder : 0,
    startsAt: input.startsAt || input.starts_at || null,
    endsAt: input.endsAt || input.ends_at || null,
  };
}

export function validatePromotionPayload(payload) {
  const errors = [];
  const allowedAppliesTo = new Set(["publico", "convenio", "ambos"]);

  if (!Number.isInteger(payload.examId) || payload.examId <= 0) {
    errors.push("examId is required and must be a positive integer");
  }

  if (!payload.title) {
    errors.push("title is required");
  }

  if (Number.isNaN(payload.price) || payload.price < 0) {
    errors.push("price must be a non-negative number");
  }

  if (Number.isNaN(payload.promoPrice) || payload.promoPrice < 0) {
    errors.push("promoPrice must be a non-negative number");
  }

  if (Number.isNaN(payload.promoPricePublic) || payload.promoPricePublic < 0) {
    errors.push("promoPricePublic must be a non-negative number");
  }

  if (Number.isNaN(payload.promoPriceConvenio) || payload.promoPriceConvenio < 0) {
    errors.push("promoPriceConvenio must be a non-negative number");
  }

  if (!allowedAppliesTo.has(payload.appliesTo)) {
    errors.push("appliesTo must be one of: publico, convenio, ambos");
  }

  if (!Number.isFinite(payload.displayOrder)) {
    errors.push("displayOrder must be numeric");
  }

  return errors;
}
