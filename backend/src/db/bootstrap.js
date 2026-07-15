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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_equipment (
      id BIGINT NOT NULL AUTO_INCREMENT,
      company_name VARCHAR(120) NOT NULL DEFAULT 'united_trading_sac',
      equipment_type VARCHAR(30) NOT NULL DEFAULT 'laboratorio',
      brand VARCHAR(140) NOT NULL,
      model VARCHAR(180) NOT NULL,
      serial_number VARCHAR(180) NOT NULL,
      invoice_number VARCHAR(120) NULL,
      import_date DATE NULL,
      install_location VARCHAR(255) NULL,
      area_name VARCHAR(150) NULL,
      ingress_date DATE NULL,
      condition_status VARCHAR(40) NOT NULL DEFAULT 'cesion_en_uso',
      operational_status VARCHAR(30) NOT NULL DEFAULT 'operativo',
      next_maintenance_date DATE NULL,
      maintenance_alert_days INT NOT NULL DEFAULT 30,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_inventory_equipment_serial (serial_number),
      KEY idx_inventory_equipment_company (company_name),
      KEY idx_inventory_equipment_type (equipment_type),
      KEY idx_inventory_equipment_status (operational_status),
      KEY idx_inventory_equipment_maintenance (next_maintenance_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const equipmentHasCompanyName = await hasColumn("inventory_equipment", "company_name");
  if (!equipmentHasCompanyName) {
    await pool.query(`
      ALTER TABLE inventory_equipment
      ADD COLUMN company_name VARCHAR(120) NOT NULL DEFAULT 'united_trading_sac' AFTER id
    `);

    await pool.query(`
      CREATE INDEX idx_inventory_equipment_company ON inventory_equipment (company_name)
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_accessories (
      id BIGINT NOT NULL AUTO_INCREMENT,
      equipment_id BIGINT NOT NULL,
      accessory_name VARCHAR(180) NOT NULL,
      brand VARCHAR(120) NULL,
      serial_number VARCHAR(180) NULL,
      ingress_date DATE NULL,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_inventory_accessories_equipment_id (equipment_id),
      CONSTRAINT fk_inventory_accessories_equipment
        FOREIGN KEY (equipment_id) REFERENCES inventory_equipment(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_maintenance (
      id BIGINT NOT NULL AUTO_INCREMENT,
      equipment_id BIGINT NOT NULL,
      planned_date DATE NOT NULL,
      completed_at DATETIME NULL,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_inventory_maintenance_equipment_id (equipment_id),
      KEY idx_inventory_maintenance_planned (planned_date),
      CONSTRAINT fk_inventory_maintenance_equipment
        FOREIGN KEY (equipment_id) REFERENCES inventory_equipment(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_service_calls (
      id BIGINT NOT NULL AUTO_INCREMENT,
      company_name VARCHAR(120) NOT NULL,
      equipment_id BIGINT NULL,
      attention_type VARCHAR(30) NOT NULL DEFAULT 'espontanea',
      reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      issue_description TEXT NOT NULL,
      action_taken TEXT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'abierto',
      resolved_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_inventory_service_calls_company (company_name),
      KEY idx_inventory_service_calls_equipment (equipment_id),
      KEY idx_inventory_service_calls_reported (reported_at),
      KEY idx_inventory_service_calls_status (status),
      CONSTRAINT fk_inventory_service_calls_equipment
        FOREIGN KEY (equipment_id) REFERENCES inventory_equipment(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_schedule_templates (
      id BIGINT NOT NULL AUTO_INCREMENT,
      company_name VARCHAR(120) NOT NULL,
      hospital_name VARCHAR(255) NOT NULL,
      year INT NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'CRONOGRAMA DE MANTENIMIENTO',
      institution_name VARCHAR(255) NULL,
      logo_data LONGTEXT NULL,
      seal_left_data LONGTEXT NULL,
      seal_right_data LONGTEXT NULL,
      signature_data LONGTEXT NULL,
      stamp_data LONGTEXT NULL,
      footer_left TEXT NULL,
      footer_center TEXT NULL,
      footer_right TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_inventory_schedule_templates_key (company_name, hospital_name, year),
      KEY idx_inventory_schedule_templates_company (company_name),
      KEY idx_inventory_schedule_templates_year (year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_schedule_template_actions (
      id BIGINT NOT NULL AUTO_INCREMENT,
      template_id BIGINT NOT NULL,
      action_name VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_inventory_schedule_template_actions_template (template_id),
      CONSTRAINT fk_inventory_schedule_template_actions_template
        FOREIGN KEY (template_id) REFERENCES inventory_schedule_templates(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_schedule_plans (
      id BIGINT NOT NULL AUTO_INCREMENT,
      equipment_id BIGINT NOT NULL,
      template_id BIGINT NOT NULL,
      company_name VARCHAR(120) NOT NULL,
      hospital_name VARCHAR(255) NOT NULL,
      year INT NOT NULL,
      frequency_months INT NOT NULL,
      start_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'activo',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_inventory_schedule_plans_equipment (equipment_id),
      KEY idx_inventory_schedule_plans_template (template_id),
      KEY idx_inventory_schedule_plans_company (company_name),
      KEY idx_inventory_schedule_plans_year (year),
      CONSTRAINT fk_inventory_schedule_plans_equipment
        FOREIGN KEY (equipment_id) REFERENCES inventory_equipment(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_inventory_schedule_plans_template
        FOREIGN KEY (template_id) REFERENCES inventory_schedule_templates(id)
        ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_schedule_plan_actions (
      id BIGINT NOT NULL AUTO_INCREMENT,
      plan_id BIGINT NOT NULL,
      action_name VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_inventory_schedule_plan_actions_plan (plan_id),
      CONSTRAINT fk_inventory_schedule_plan_actions_plan
        FOREIGN KEY (plan_id) REFERENCES inventory_schedule_plans(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_schedule_executions (
      id BIGINT NOT NULL AUTO_INCREMENT,
      plan_id BIGINT NOT NULL,
      performed_at DATE NOT NULL,
      month_number INT NOT NULL,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_inventory_schedule_executions_plan_month (plan_id, month_number),
      KEY idx_inventory_schedule_executions_plan (plan_id),
      CONSTRAINT fk_inventory_schedule_executions_plan
        FOREIGN KEY (plan_id) REFERENCES inventory_schedule_plans(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
