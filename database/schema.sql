CREATE TABLE IF NOT EXISTS laboratory_tests (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  sample TEXT,
  method TEXT,
  price_public DECIMAL(10, 2) NOT NULL,
  price_convenio DECIMAL(10, 2) NOT NULL,
  tube TEXT,
  info TEXT,
  process_time VARCHAR(100),
  quantity INT NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_laboratory_tests_name (name),
  KEY idx_laboratory_tests_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
