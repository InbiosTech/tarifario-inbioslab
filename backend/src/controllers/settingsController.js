import {
  getAdminSettings,
  getPublicSettings,
  updateWhatsappQuoteNumber,
} from "../services/settingsService.js";

export async function getPublicSettingsController(_req, res, next) {
  try {
    const settings = await getPublicSettings();
    return res.json(settings);
  } catch (error) {
    return next(error);
  }
}

export async function getAdminSettingsController(_req, res, next) {
  try {
    const settings = await getAdminSettings();
    return res.json(settings);
  } catch (error) {
    return next(error);
  }
}

export async function updateWhatsappQuoteNumberController(req, res, next) {
  try {
    const updated = await updateWhatsappQuoteNumber(req.body);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}
