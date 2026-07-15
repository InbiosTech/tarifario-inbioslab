USE tarifario_inbioslab;

CREATE TEMPORARY TABLE tmp_inventory_import (
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

INSERT INTO tmp_inventory_import (company_name, equipment_type, brand, model, serial_number, install_location, area_name, condition_status, operational_status, maintenance_alert_days, notes) VALUES
('comercial_importadora_sudamericana_sac','laboratorio','THERMOBIO INC','CHALLENGE IV','ES1J9W03147Y','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','inoperativo',30,'Equipo: FULLY-AUTO CHEMISTRY ANALYZER'),
('comercial_importadora_sudamericana_sac','laboratorio','HALION','S/N','S/N','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','en_desuso','operativo',30,'Equipo: PC | Observacion: MONITOR, TECLADO, MOUSE | Estado original: OPERATIVO / SIN USO'),
('comercial_importadora_sudamericana_sac','laboratorio','HIGH POWER','PIC-5T-2000TM','171021-02','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: ESTABILIZADOR'),
('comercial_importadora_sudamericana_sac','laboratorio','KAISEN','KUE-T02-WB-CH','9000.22102.2106.47','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: UPS'),
('comercial_importadora_sudamericana_sac','laboratorio','GAMATEC','TRANSF. AISLAMIENTO','2107200567TRFAL-2K','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: ESTABILIZADOR'),
('comercial_importadora_sudamericana_sac','laboratorio','KAISEN','KUE-T02-WBCH','9.00022E+14','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: UPS'),
('comercial_importadora_sudamericana_sac','laboratorio','THERMOBIO INC','CHALLENGE IV','F0EU00SXLD','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: FULLY-AUTO CHEMISTRY ANALYZER'),
('comercial_importadora_sudamericana_sac','laboratorio','LENOVO','ES2K1K07131Y','MP29749N','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: ALL IN ONE | Observacion: TECLADO, MOUSE'),
('comercial_importadora_sudamericana_sac','laboratorio','HP','SEOLA-1802-01','BRBSQ7T43','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: IMPRESORA LASER'),
('comercial_importadora_sudamericana_sac','laboratorio','LG','22V280','812NZCG002699','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: ALL IN ONE | Observacion: USO PARA INFORME DE ESTADISTICA MENSUAL'),
('comercial_importadora_sudamericana_sac','laboratorio','ROBONIK','PRIETEST TOUCH','AT6150317RBK','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: BIOCHEMISTRY ANALYSER'),
('comercial_importadora_sudamericana_sac','laboratorio','VONDFO','BGA-102','BGA1022207200549','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','inoperativo',30,'Equipo: ANALIZADOR DE GASES ARTERIALES'),
('comercial_importadora_sudamericana_sac','laboratorio','EAGLENOS','EN102','EN10224060302','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: ANALIZADOR DE GASES ARTERIALES'),
('comercial_importadora_sudamericana_sac','aire_acondicionado','MONTERO-INVERTER','ELITE18K-24','15DJ3NPB00ZPB1300088','HOSPITAL DE PUCALLPA- EMERGENCIA','BIOQUIMICA','cesion_en_uso','operativo',30,'Equipo: SPLIT TYPE AIR CONDITIONER-18BTU'),
('united_trading_sac','laboratorio','PROKAN','PE-7100','10107001.2109.00046.086999.00001','HOSPITAL DE PUCALLPA- EMERGENCIA','HEMATOLOGIA','cesion_en_uso','operativo',30,'Equipo: FULLY AUTO HEMATOLOGY ANALIZER'),
('united_trading_sac','laboratorio','LENOVO','F0G000TXLD','MP1ZAYAM','HOSPITAL DE PUCALLPA- EMERGENCIA','HEMATOLOGIA','cesion_en_uso','operativo',30,'Equipo: ALL IN ONE'),
('united_trading_sac','laboratorio','HP','SDGOB-1392','BRBSQ3Y0H5','HOSPITAL DE PUCALLPA- EMERGENCIA','HEMATOLOGIA','cesion_en_uso','operativo',30,'Equipo: IMPRESORA LASER'),
('united_trading_sac','laboratorio','GAMATEC','KUE-RTO1-WB-CH','9000.120113.200781','HOSPITAL DE PUCALLPA- EMERGENCIA','HEMATOLOGIA','cesion_en_uso','operativo',30,'Equipo: ESTABILIZADOR'),
('united_trading_sac','laboratorio','LINEEAR','ARES','482302045','HOSPITAL DE PUCALLPA- EMERGENCIA','HEMATOLOGIA','cesion_en_uso','operativo',30,'Equipo: COAGULATION ANALYZER'),
('united_trading_sac','aire_acondicionado','MONTERO','M12K-ONOFF23','S/N-HEMATOLOGIA-20','HOSPITAL DE PUCALLPA- EMERGENCIA','HEMATOLOGIA','cesion_en_uso','operativo',30,'Equipo: SPLIT TYPE AIR CONDITIONER -INVERTER | Serial original: S/N'),
('comercial_importadora_sudamericana_sac','laboratorio','LENOVO','F0G000TXLD','MP1ZB4SX','HOSPITAL DE PUCALLPA- EMERGENCIA','BANCO DE SANGRE','cesion_en_uso','operativo',30,'Equipo: ALL IN ONE'),
('comercial_importadora_sudamericana_sac','laboratorio','AUTOBIO','IWO','2041001893','HOSPITAL DE PUCALLPA- EMERGENCIA','BANCO DE SANGRE','cesion_en_uso','operativo',30,'Equipo: MICROPLATE WASHER'),
('comercial_importadora_sudamericana_sac','laboratorio','HP','SEOLA-1802-01','BRBSP7N1YN','HOSPITAL DE PUCALLPA- EMERGENCIA','BANCO DE SANGRE','cesion_en_uso','operativo',30,'Equipo: IMPRESORA LASER'),
('comercial_importadora_sudamericana_sac','laboratorio','LENOVO','F0G000TXLD','MP1Z84SX','HOSPITAL DE PUCALLPA- EMERGENCIA','BANCO DE SANGRE','cesion_en_uso','inoperativo',30,'Equipo: ALL IN ONE'),
('comercial_importadora_sudamericana_sac','laboratorio','AUTOBIO','PHOMO','3011004655','HOSPITAL DE PUCALLPA- EMERGENCIA','BANCO DE SANGRE','cesion_en_uso','operativo',30,'Equipo: MICROPLATE PHOTOMETER'),
('comercial_importadora_sudamericana_sac','laboratorio','LABNOVATION','LD-500','LD548105436','HOSPITAL DE PUCALLPA- EMERGENCIA','INMUNOLOGIA','cesion_en_uso','operativo',30,'Equipo: ANALIZADOR AUTOMATIZADO DE HPLC'),
('comercial_importadora_sudamericana_sac','laboratorio','CDP','UPO11-2i','85827.7001.424','HOSPITAL DE PUCALLPA- EMERGENCIA','INMUNOLOGIA','cesion_en_uso','operativo',30,'Equipo: UPS'),
('comercial_importadora_sudamericana_sac','laboratorio','POWERRONIC','S/N','67375','HOSPITAL DE PUCALLPA- EMERGENCIA','INMUNOLOGIA','cesion_en_uso','operativo',30,'Equipo: ESTABILIZADOR'),
('comercial_importadora_sudamericana_sac','laboratorio','YHLO','iFlash 1800-A','IA0006540A','HOSPITAL DE PUCALLPA- EMERGENCIA','INMUNOLOGIA','cesion_en_uso','operativo',30,'Equipo: CHEMILUMINESCENCE IMMUNOASSAY ANALIZER'),
('comercial_importadora_sudamericana_sac','laboratorio','KAISEN','KUE-T02-WB-CH','9000.221022.10656','HOSPITAL DE PUCALLPA- EMERGENCIA','INMUNOLOGIA','cesion_en_uso','operativo',30,'Equipo: UPS'),
('comercial_importadora_sudamericana_sac','laboratorio','HP','SEOLA-1802-01','BRBSP7N1YNYH','HOSPITAL DE PUCALLPA- EMERGENCIA','INMUNOLOGIA','cesion_en_uso','operativo',30,'Equipo: IMPRESORA LASER'),
('comercial_importadora_sudamericana_sac','laboratorio','LENOVO','F0E800DSLD','MP1RPSJY','HOSPITAL DE PUCALLPA- EMERGENCIA','INMUNOLOGIA','cesion_en_uso','operativo',30,'Equipo: ALL IN ONE | Observacion: TECLADO, MOUSE'),
('comercial_importadora_sudamericana_sac','aire_acondicionado','LG','OM182C1.NJRO','403CRSF20454','HOSPITAL DE PUCALLPA- EMERGENCIA','INMUNOLOGIA','cesion_en_uso','operativo',30,'Equipo: AIR COINDITIONER');

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
FROM tmp_inventory_import t
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
SELECT COUNT(*) AS source_rows
FROM tmp_inventory_import;
SELECT COUNT(*) AS matched_serials_after_import
FROM inventory_equipment e
INNER JOIN tmp_inventory_import t ON t.serial_number = e.serial_number;
