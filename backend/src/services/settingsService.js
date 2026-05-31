import { badRequest } from "../utils/httpErrors.js";
import { getWhatsappQuoteNumber, setWhatsappQuoteNumber } from "../repositories/settingsRepository.js";

function sanitizePhone(value) {
  return String(value || "").replace(/\D/g, "").trim();
}

export async function getPublicSettings() {
  const whatsappQuoteNumber = String(await getWhatsappQuoteNumber() || "").trim();
  return {
    whatsappQuoteNumber,
  };
}

export async function getAdminSettings() {
  return getPublicSettings();
}

export async function updateWhatsappQuoteNumber(payload = {}) {
  const normalized = sanitizePhone(payload.whatsappQuoteNumber ?? payload.whatsapp_quote_number);
  if (!normalized) {
    throw badRequest("whatsappQuoteNumber is required");
  }

  if (normalized.length < 9 || normalized.length > 15) {
    throw badRequest("whatsappQuoteNumber must have between 9 and 15 digits");
  }

  await setWhatsappQuoteNumber(normalized);
  return getPublicSettings();
}
