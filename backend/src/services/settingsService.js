import { badRequest } from "../utils/httpErrors.js";
import { getWhatsappQuoteNumber, setWhatsappQuoteNumber } from "../repositories/settingsRepository.js";

const DEFAULT_WHATSAPP_QUOTE_NUMBER = "945241682";

function isRecoverableSettingsSchemaError(error) {
  const code = String(error?.code || "").trim().toUpperCase();
  return (
    code === "ER_NO_SUCH_TABLE" ||
    code === "ER_BAD_FIELD_ERROR" ||
    code === "ER_TABLEACCESS_DENIED_ERROR" ||
    code === "ER_DBACCESS_DENIED_ERROR" ||
    code === "ER_ACCESS_DENIED_ERROR"
  );
}

function sanitizePhone(value) {
  return String(value || "").replace(/\D/g, "").trim();
}

export async function getPublicSettings() {
  let whatsappQuoteNumber = "";

  try {
    whatsappQuoteNumber = String(await getWhatsappQuoteNumber() || "").trim();
  } catch (error) {
    if (!isRecoverableSettingsSchemaError(error)) {
      throw error;
    }
  }

  return {
    whatsappQuoteNumber: whatsappQuoteNumber || DEFAULT_WHATSAPP_QUOTE_NUMBER,
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
