import { pool } from "../db/pool.js";

const ALLOWED_STATUS = new Set(["operativo", "inoperativo", "malogrado", "en_observacion"]);
const ALLOWED_TYPES = new Set(["laboratorio", "aire_acondicionado"]);
const ALLOWED_COMPANIES = new Set(["united_trading_sac", "comercial_importadora_sudamericana_sac"]);
const ALLOWED_CALL_STATUS = new Set(["abierto", "resuelto"]);

function normalizeStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_STATUS.has(normalized) ? normalized : "operativo";
}

function normalizeType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_TYPES.has(normalized) ? normalized : "laboratorio";
}

function normalizeCompany(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_COMPANIES.has(normalized) ? normalized : "united_trading_sac";
}

function normalizeCallStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_CALL_STATUS.has(normalized) ? normalized : "abierto";
}

export async function listEquipment({
  page,
  pageSize,
  search,
  equipmentType,
  operationalStatus,
  companyName,
}) {
  const where = [];
  const params = [];

  if (equipmentType) {
    where.push("e.equipment_type = ?");
    params.push(normalizeType(equipmentType));
  }

  if (operationalStatus) {
    where.push("e.operational_status = ?");
    params.push(normalizeStatus(operationalStatus));
  }

  if (companyName) {
    where.push("e.company_name = ?");
    params.push(normalizeCompany(companyName));
  }

  if (search) {
    where.push("(e.brand LIKE ? OR e.model LIKE ? OR e.serial_number LIKE ? OR e.install_location LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM inventory_equipment e ${whereClause}`,
    params,
  );

  const [rows] = await pool.query(
    `
      SELECT
        e.*,
        (SELECT COUNT(*) FROM inventory_accessories a WHERE a.equipment_id = e.id) AS accessoriesCount,
        (SELECT COUNT(*) FROM inventory_maintenance m WHERE m.equipment_id = e.id AND m.completed_at IS NULL) AS pendingMaintenanceCount
      FROM inventory_equipment e
      ${whereClause}
      ORDER BY e.updated_at DESC, e.id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset],
  );

  return {
    items: rows,
    totalItems: Number(countRows?.[0]?.total || 0),
  };
}

export async function getEquipmentById(id) {
  const [rows] = await pool.query(
    `
      SELECT
        e.*,
        (SELECT COUNT(*) FROM inventory_accessories a WHERE a.equipment_id = e.id) AS accessoriesCount,
        (SELECT COUNT(*) FROM inventory_maintenance m WHERE m.equipment_id = e.id AND m.completed_at IS NULL) AS pendingMaintenanceCount
      FROM inventory_equipment e
      WHERE e.id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows?.[0] || null;
}

export async function createEquipment(payload) {
  const [result] = await pool.query(
    `
      INSERT INTO inventory_equipment (
        company_name,
        equipment_type,
        brand,
        model,
        serial_number,
        invoice_number,
        import_date,
        install_location,
        area_name,
        ingress_date,
        condition_status,
        operational_status,
        next_maintenance_date,
        maintenance_alert_days,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      normalizeCompany(payload.companyName),
      normalizeType(payload.equipmentType),
      payload.brand,
      payload.model,
      payload.serialNumber,
      payload.invoiceNumber,
      payload.importDate,
      payload.installLocation,
      payload.areaName,
      payload.ingressDate,
      payload.conditionStatus,
      normalizeStatus(payload.operationalStatus),
      payload.nextMaintenanceDate,
      payload.maintenanceAlertDays,
      payload.notes,
    ],
  );

  return Number(result.insertId);
}

export async function updateEquipment(id, payload) {
  const [result] = await pool.query(
    `
      UPDATE inventory_equipment
      SET
        company_name = ?,
        equipment_type = ?,
        brand = ?,
        model = ?,
        serial_number = ?,
        invoice_number = ?,
        import_date = ?,
        install_location = ?,
        area_name = ?,
        ingress_date = ?,
        condition_status = ?,
        operational_status = ?,
        next_maintenance_date = ?,
        maintenance_alert_days = ?,
        notes = ?
      WHERE id = ?
      LIMIT 1
    `,
    [
      normalizeCompany(payload.companyName),
      normalizeType(payload.equipmentType),
      payload.brand,
      payload.model,
      payload.serialNumber,
      payload.invoiceNumber,
      payload.importDate,
      payload.installLocation,
      payload.areaName,
      payload.ingressDate,
      payload.conditionStatus,
      normalizeStatus(payload.operationalStatus),
      payload.nextMaintenanceDate,
      payload.maintenanceAlertDays,
      payload.notes,
      id,
    ],
  );

  return Number(result.affectedRows || 0);
}

export async function updateEquipmentStatus(id, operationalStatus) {
  const [result] = await pool.query(
    `
      UPDATE inventory_equipment
      SET operational_status = ?
      WHERE id = ?
      LIMIT 1
    `,
    [normalizeStatus(operationalStatus), id],
  );

  return Number(result.affectedRows || 0);
}

export async function deleteEquipment(id) {
  const [result] = await pool.query(
    `DELETE FROM inventory_equipment WHERE id = ? LIMIT 1`,
    [id],
  );

  return Number(result.affectedRows || 0);
}

export async function listAccessoriesByEquipmentId(equipmentId) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM inventory_accessories
      WHERE equipment_id = ?
      ORDER BY id DESC
    `,
    [equipmentId],
  );

  return rows;
}

export async function createAccessory(equipmentId, payload) {
  const [result] = await pool.query(
    `
      INSERT INTO inventory_accessories (
        equipment_id,
        accessory_name,
        brand,
        serial_number,
        ingress_date,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      equipmentId,
      payload.accessoryName,
      payload.brand,
      payload.serialNumber,
      payload.ingressDate,
      payload.notes,
    ],
  );

  return Number(result.insertId);
}

export async function updateAccessory(accessoryId, payload) {
  const [result] = await pool.query(
    `
      UPDATE inventory_accessories
      SET
        accessory_name = ?,
        brand = ?,
        serial_number = ?,
        ingress_date = ?,
        notes = ?
      WHERE id = ?
      LIMIT 1
    `,
    [
      payload.accessoryName,
      payload.brand,
      payload.serialNumber,
      payload.ingressDate,
      payload.notes,
      accessoryId,
    ],
  );

  return Number(result.affectedRows || 0);
}

export async function deleteAccessory(accessoryId) {
  const [result] = await pool.query(
    `DELETE FROM inventory_accessories WHERE id = ? LIMIT 1`,
    [accessoryId],
  );

  return Number(result.affectedRows || 0);
}

export async function listMaintenanceByEquipmentId(equipmentId) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM inventory_maintenance
      WHERE equipment_id = ?
      ORDER BY planned_date ASC, id ASC
    `,
    [equipmentId],
  );

  return rows;
}

export async function createMaintenance(equipmentId, payload) {
  const [result] = await pool.query(
    `
      INSERT INTO inventory_maintenance (
        equipment_id,
        planned_date,
        completed_at,
        notes
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      equipmentId,
      payload.plannedDate,
      payload.completedAt,
      payload.notes,
    ],
  );

  return Number(result.insertId);
}

export async function markMaintenanceCompleted(id) {
  const [result] = await pool.query(
    `
      UPDATE inventory_maintenance
      SET completed_at = COALESCE(completed_at, NOW())
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return Number(result.affectedRows || 0);
}

export async function listUpcomingMaintenance({ days = 30, companyName = "" }) {
  const where = [
    "m.completed_at IS NULL",
    "m.planned_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)",
  ];
  const params = [days];

  if (companyName) {
    where.push("e.company_name = ?");
    params.push(normalizeCompany(companyName));
  }

  const [rows] = await pool.query(
    `
      SELECT
        m.*,
        e.company_name,
        e.brand,
        e.model,
        e.serial_number,
        e.install_location,
        e.equipment_type,
        DATEDIFF(m.planned_date, CURDATE()) AS daysLeft
      FROM inventory_maintenance m
      INNER JOIN inventory_equipment e ON e.id = m.equipment_id
      WHERE ${where.join(" AND ")}
      ORDER BY m.planned_date ASC, m.id ASC
    `,
    params,
  );

  return rows;
}

export async function listServiceCalls({ page, pageSize, companyName, equipmentId, search }) {
  const where = ["c.attention_type = 'espontanea'"];
  const params = [];

  if (companyName) {
    where.push("c.company_name = ?");
    params.push(normalizeCompany(companyName));
  }

  if (equipmentId) {
    where.push("c.equipment_id = ?");
    params.push(Number(equipmentId));
  }

  if (search) {
    where.push("(c.issue_description LIKE ? OR c.action_taken LIKE ? OR e.brand LIKE ? OR e.model LIKE ? OR e.serial_number LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  const whereClause = `WHERE ${where.join(" AND ")}`;
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM inventory_service_calls c LEFT JOIN inventory_equipment e ON e.id = c.equipment_id ${whereClause}`,
    params,
  );

  const [rows] = await pool.query(
    `
      SELECT
        c.*,
        e.brand,
        e.model,
        e.serial_number
      FROM inventory_service_calls c
      LEFT JOIN inventory_equipment e ON e.id = c.equipment_id
      ${whereClause}
      ORDER BY c.reported_at DESC, c.id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset],
  );

  return {
    items: rows,
    totalItems: Number(countRows?.[0]?.total || 0),
  };
}

export async function createServiceCall(payload) {
  const [result] = await pool.query(
    `
      INSERT INTO inventory_service_calls (
        company_name,
        equipment_id,
        attention_type,
        reported_at,
        issue_description,
        action_taken,
        status,
        resolved_at
      )
      VALUES (?, ?, 'espontanea', ?, ?, ?, ?, ?)
    `,
    [
      normalizeCompany(payload.companyName),
      payload.equipmentId,
      payload.reportedAt,
      payload.issueDescription,
      payload.actionTaken,
      normalizeCallStatus(payload.status),
      payload.resolvedAt,
    ],
  );

  return Number(result.insertId);
}

export async function resolveServiceCall(id, payload) {
  const [result] = await pool.query(
    `
      UPDATE inventory_service_calls
      SET
        action_taken = COALESCE(NULLIF(?, ''), action_taken),
        status = 'resuelto',
        resolved_at = COALESCE(?, NOW())
      WHERE id = ?
        AND attention_type = 'espontanea'
      LIMIT 1
    `,
    [payload.actionTaken, payload.resolvedAt, id],
  );

  return Number(result.affectedRows || 0);
}
