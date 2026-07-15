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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
