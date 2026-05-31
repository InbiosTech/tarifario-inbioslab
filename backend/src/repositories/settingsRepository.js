import { pool } from "../db/pool.js";

const KEY_WHATSAPP_QUOTE_NUMBER = "whatsapp_quote_number";

export async function getSettingValue(key) {
  const [rows] = await pool.query(
    `
      SELECT setting_value AS value
      FROM app_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [key],
  );

  return rows[0]?.value ?? null;
}

export async function upsertSettingValue(key, value) {
  await pool.query(
    `
      INSERT INTO app_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        updated_at = CURRENT_TIMESTAMP
    `,
    [key, value],
  );
}

export async function getWhatsappQuoteNumber() {
  return getSettingValue(KEY_WHATSAPP_QUOTE_NUMBER);
}

export async function setWhatsappQuoteNumber(value) {
  await upsertSettingValue(KEY_WHATSAPP_QUOTE_NUMBER, value);
}
