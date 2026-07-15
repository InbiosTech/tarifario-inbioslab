USE tarifario_inbioslab;

CREATE TEMPORARY TABLE tmp_inventory_import_yarina_contin (
  company_name VARCHAR(120) NOT NULL,
  equipment_type VARCHAR(30) NOT NULL,
  brand VARCHAR(140) NOT NULL,
  model VARCHAR(180) NOT NULL,
  serial_number VARCHAR(180) NOT NULL,
  install_location VARCHAR(255) NULL,
  area_name VARCHAR(150) NULL,
  condition_status VARCHAR(40) NOT NULL,
  operational_status VARCHAR(30) NOT NULL,
  maintenance_alert_days INT NOT NULL,
  notes TEXT NULL
);

INSERT INTO tmp_inventory_import_yarina_contin (
  company_name,
  equipment_type,
  brand,
  model,
  serial_number,
  install_location,
  area_name,
  condition_status,
  operational_status,
  maintenance_alert_days,
  notes
) VALUES
('unite_trading','laboratorio','PROKAN','PE-7100','1.0107001.2109.00043.086999.00001','HOSPITAL DE YARINA-CENTRAL',NULL,'cesion_en_uso','operativo',30,'Equipo: FULLY AUTO HEMATOLOGY ANALYZER'),
('unite_trading','laboratorio','HP','BOISB-0207-00','CNCKC90759','HOSPITAL DE YARINA-CENTRAL',NULL,'cesion_en_uso','operativo',30,'Equipo: IMPRESORA LASER'),
('unite_trading','laboratorio','KAISEN','KUE-RT01-WB-CH','900012104260260.00','HOSPITAL DE YARINA-CENTRAL',NULL,'cesion_en_uso','operativo',30,'Equipo: UPS'),
('comercial_importadora_sudamerica_sac','laboratorio','THERMOBIO INC','CHALLENGE III','ES1J8W02059','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: BIOQUIMICO AUTOMATIZADO'),
('comercial_importadora_sudamerica_sac','laboratorio','HP','CE858A','BRBSGBJFTJ','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: IMPRESORA LASER'),
('comercial_importadora_sudamerica_sac','laboratorio','VIEW SONIC','VA1903H','VR4211021865','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: PANTALLA LCD'),
('comercial_importadora_sudamerica_sac','laboratorio','POWER TECNOLOGIES','FX-1500LCD-U','22036350063','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: UPS'),
('comercial_importadora_sudamerica_sac','laboratorio','LENOVO','F0BB','MP10TNES','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','semi_operativo',30,'Equipo: ALL IN ONE'),
('comercial_importadora_sudamerica_sac','laboratorio','ENKORE EPIC','S/N','S/N-CONTIN-ENKORE-EPIC','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','inoperativo',30,'Equipo: PC | Serial original: S/N'),
('comercial_importadora_sudamerica_sac','laboratorio','POWER SAFE','TAMF-05','1706084','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: ESTABILIZADOR'),
('comercial_importadora_sudamerica_sac','laboratorio','ROBONIK','PRIETEST TOUCH','AT6080317RBK','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: ANALIZADOR BIOQUIMICO SEMIAUTOMATICO'),
('comercial_importadora_sudamerica_sac','laboratorio','LINEAR','ARES','481809009','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: CUAGULOMETRO | Observacion: PIPETA SENSOR MALOGRADO'),
('comercial_importadora_sudamerica_sac','laboratorio','HIGH POWER','5T-500TM','422ETU037','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: ESTABILIZADOR'),
('comercial_importadora_sudamerica_sac','aire_acondicionado','LG','VM242C9','011TAEJD7540','HOSPITAL REGIONAL DE PUCALLPA-CONTIN',NULL,'cesion_en_uso','operativo',30,'Equipo: SPLIT ROOM AIR CONDITIONER 18 BTU');

INSERT INTO inventory_equipment (
  company_name,
  equipment_type,
  brand,
  model,
  serial_number,
  install_location,
  area_name,
  condition_status,
  operational_status,
  maintenance_alert_days,
  notes
)
SELECT
  t.company_name,
  t.equipment_type,
  t.brand,
  t.model,
  t.serial_number,
  t.install_location,
  t.area_name,
  t.condition_status,
  t.operational_status,
  t.maintenance_alert_days,
  t.notes
FROM tmp_inventory_import_yarina_contin t
ON DUPLICATE KEY UPDATE
  company_name = VALUES(company_name),
  equipment_type = VALUES(equipment_type),
  brand = VALUES(brand),
  model = VALUES(model),
  install_location = VALUES(install_location),
  area_name = VALUES(area_name),
  condition_status = VALUES(condition_status),
  operational_status = VALUES(operational_status),
  maintenance_alert_days = VALUES(maintenance_alert_days),
  notes = VALUES(notes),
  updated_at = CURRENT_TIMESTAMP;

SELECT ROW_COUNT() AS affected_rows_insert_or_update;
SELECT COUNT(*) AS source_rows FROM tmp_inventory_import_yarina_contin;
SELECT COUNT(*) AS matched_serials_after_import
FROM inventory_equipment e
INNER JOIN tmp_inventory_import_yarina_contin t ON t.serial_number = e.serial_number;

SELECT id, serial_number, brand, model, operational_status, install_location
FROM inventory_equipment
WHERE serial_number = '1706084';
