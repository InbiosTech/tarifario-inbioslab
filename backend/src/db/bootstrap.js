import { pool } from "./pool.js";

async function hasColumn(tableName, columnName) {
  const [rows] = await pool.query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName],
  );

  return rows.length > 0;
}

export async function ensureInfrastructure() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(120) NOT NULL,
      setting_value VARCHAR(600) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    INSERT INTO app_settings (setting_key, setting_value)
    VALUES ('whatsapp_quote_number', '945241682')
    ON DUPLICATE KEY UPDATE setting_value = setting_value
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exams_audit_log (
      id BIGINT NOT NULL AUTO_INCREMENT,
      action VARCHAR(50) NOT NULL,
      exam_id INT NULL,
      actor VARCHAR(120) NOT NULL,
      actor_role VARCHAR(20) NOT NULL,
      payload JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_exams_audit_log_exam_id (exam_id),
      KEY idx_exams_audit_log_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INT NOT NULL AUTO_INCREMENT,
      exam_id INT NULL,
      code VARCHAR(60) NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      fundament TEXT NULL,
      long_description TEXT NULL,
      name VARCHAR(255) NULL,
      image_url VARCHAR(600) NULL,
      image_card_url VARCHAR(600) NULL,
      image_modal_url VARCHAR(600) NULL,
      applies_to VARCHAR(20) NOT NULL DEFAULT 'publico',
      price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      promo_price DECIMAL(10, 2) NULL,
      promo_price_public DECIMAL(10, 2) NULL,
      promo_price_convenio DECIMAL(10, 2) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      display_order INT NOT NULL DEFAULT 0,
      starts_at DATETIME NULL,
      ends_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_promotions_code (code),
      KEY idx_promotions_active (is_active),
      KEY idx_promotions_order (display_order),
      KEY idx_promotions_exam_id (exam_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const promotionsHasExamId = await hasColumn("promotions", "exam_id");
  if (!promotionsHasExamId) {
    await pool.query(`
      ALTER TABLE promotions
      ADD COLUMN exam_id INT NULL AFTER id
    `);
  }

  const promotionsHasFundament = await hasColumn("promotions", "fundament");
  if (!promotionsHasFundament) {
    await pool.query(`
      ALTER TABLE promotions
      ADD COLUMN fundament TEXT NULL AFTER description
    `);
  }

  const promotionsHasPromoPrice = await hasColumn("promotions", "promo_price");
  if (!promotionsHasPromoPrice) {
    await pool.query(`
      ALTER TABLE promotions
      ADD COLUMN promo_price DECIMAL(10, 2) NULL AFTER price
    `);
  }

  const promotionsHasImageCard = await hasColumn("promotions", "image_card_url");
  if (!promotionsHasImageCard) {
    await pool.query(`
      ALTER TABLE promotions
      ADD COLUMN image_card_url VARCHAR(600) NULL AFTER image_url
    `);
  }

  const promotionsHasImageModal = await hasColumn("promotions", "image_modal_url");
  if (!promotionsHasImageModal) {
    await pool.query(`
      ALTER TABLE promotions
      ADD COLUMN image_modal_url VARCHAR(600) NULL AFTER image_card_url
    `);
  }

  const promotionsHasAppliesTo = await hasColumn("promotions", "applies_to");
  if (!promotionsHasAppliesTo) {
    await pool.query(`
      ALTER TABLE promotions
      ADD COLUMN applies_to VARCHAR(20) NOT NULL DEFAULT 'publico' AFTER image_modal_url
    `);
  }

  const promotionsHasPromoPricePublic = await hasColumn("promotions", "promo_price_public");
  if (!promotionsHasPromoPricePublic) {
    await pool.query(`
      ALTER TABLE promotions
      ADD COLUMN promo_price_public DECIMAL(10, 2) NULL AFTER promo_price
    `);
  }

  const promotionsHasPromoPriceConvenio = await hasColumn("promotions", "promo_price_convenio");
  if (!promotionsHasPromoPriceConvenio) {
    await pool.query(`
      ALTER TABLE promotions
      ADD COLUMN promo_price_convenio DECIMAL(10, 2) NULL AFTER promo_price_public
    `);
  }

  await pool.query(`
    UPDATE promotions
    SET
      applies_to = COALESCE(NULLIF(applies_to, ''), 'publico'),
      promo_price_public = COALESCE(promo_price_public, promo_price)
    WHERE 1 = 1
  `);
}
