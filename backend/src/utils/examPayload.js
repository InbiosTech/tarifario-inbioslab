export function normalizeExamPayload(input = {}) {
  const normalizedId = Number(input.id);

  return {
    id: Number.isInteger(normalizedId) && normalizedId > 0 ? normalizedId : undefined,
    name: String(input.name || "").trim(),
    sample: String(input.sample || "").trim(),
    method: String(input.method || "").trim(),
    price1: Number(input.price1 || 0),
    price2: Number(input.price2 || 0),
    tube: String(input.tube || "").trim(),
    info: String(input.info || "").trim(),
    time: String(input.time || "").trim(),
    quantity: Math.max(1, Number(input.quantity || 1)),
    active: Number(input.active) === 0 ? 0 : 1,
  };
}

export function validateExamPayload(payload) {
  const errors = [];

  if (!payload.name) {
    errors.push("name is required");
  }

  if (Number.isNaN(payload.price1) || payload.price1 < 0) {
    errors.push("price1 must be a non-negative number");
  }

  if (Number.isNaN(payload.price2) || payload.price2 < 0) {
    errors.push("price2 must be a non-negative number");
  }

  if (Number.isNaN(payload.quantity) || payload.quantity < 1) {
    errors.push("quantity must be at least 1");
  }

  return errors;
}

export function normalizeImportItems(input) {
  const rawItems = Array.isArray(input) ? input : input?.items;
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item) => normalizeExamPayload(item));
}
