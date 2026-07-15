import { pool } from "../db/pool.js";

const ALLOWED_COMPANIES = new Set(["united_trading_sac", "comercial_importadora_sudamericana_sac"]);

function normalizeCompany(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_COMPANIES.has(normalized) ? normalized : "united_trading_sac";
}

function toNullable(value) {
  const text = String(value || "").trim();
  return text || null;
}

export async function listScheduleTemplates({ companyName = "", hospitalName = "", year = 0 }) {
  const where = [];
  const params = [];

  if (companyName) {
    where.push("t.company_name = ?");
    params.push(normalizeCompany(companyName));
  }

  if (hospitalName) {
    where.push("t.hospital_name LIKE ?");
    params.push(`%${hospitalName}%`);
  }

  if (year > 0) {
    where.push("t.year = ?");
    params.push(Number(year));
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
      SELECT t.*
      FROM inventory_schedule_templates t
      ${whereClause}
      ORDER BY t.year DESC, t.hospital_name ASC, t.id DESC
    `,
    params,
  );

  return rows;
}

export async function getScheduleTemplateById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM inventory_schedule_templates WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows?.[0] || null;
}

export async function listTemplateActions(templateId) {
  const [rows] = await pool.query(
    `
      SELECT id, template_id, action_name, sort_order
      FROM inventory_schedule_template_actions
      WHERE template_id = ?
      ORDER BY sort_order ASC, id ASC
    `,
    [templateId],
  );
  return rows;
}

export async function upsertScheduleTemplate(payload) {
  const [result] = await pool.query(
    `
      INSERT INTO inventory_schedule_templates (
        company_name,
        hospital_name,
        year,
        title,
        institution_name,
        logo_data,
        seal_left_data,
        seal_right_data,
        signature_data,
        stamp_data,
        footer_left,
        footer_center,
        footer_right
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        institution_name = VALUES(institution_name),
        logo_data = VALUES(logo_data),
        seal_left_data = VALUES(seal_left_data),
        seal_right_data = VALUES(seal_right_data),
        signature_data = VALUES(signature_data),
        stamp_data = VALUES(stamp_data),
        footer_left = VALUES(footer_left),
        footer_center = VALUES(footer_center),
        footer_right = VALUES(footer_right)
    `,
    [
      normalizeCompany(payload.companyName),
      payload.hospitalName,
      Number(payload.year),
      payload.title,
      payload.institutionName,
      toNullable(payload.logoData),
      toNullable(payload.sealLeftData),
      toNullable(payload.sealRightData),
      toNullable(payload.signatureData),
      toNullable(payload.stampData),
      toNullable(payload.footerLeft),
      toNullable(payload.footerCenter),
      toNullable(payload.footerRight),
    ],
  );

  if (result.insertId) return Number(result.insertId);

  const [rows] = await pool.query(
    `
      SELECT id
      FROM inventory_schedule_templates
      WHERE company_name = ?
        AND hospital_name = ?
        AND year = ?
      LIMIT 1
    `,
    [normalizeCompany(payload.companyName), payload.hospitalName, Number(payload.year)],
  );

  return Number(rows?.[0]?.id || 0);
}

export async function replaceTemplateActions(templateId, actions = []) {
  await pool.query(`DELETE FROM inventory_schedule_template_actions WHERE template_id = ?`, [templateId]);

  for (let index = 0; index < actions.length; index += 1) {
    await pool.query(
      `
        INSERT INTO inventory_schedule_template_actions (template_id, action_name, sort_order)
        VALUES (?, ?, ?)
      `,
      [templateId, actions[index], index + 1],
    );
  }
}

export async function createSchedulePlan(payload) {
  const [result] = await pool.query(
    `
      INSERT INTO inventory_schedule_plans (
        equipment_id,
        template_id,
        company_name,
        hospital_name,
        year,
        frequency_months,
        start_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.equipmentId,
      payload.templateId,
      normalizeCompany(payload.companyName),
      payload.hospitalName,
      payload.year,
      payload.frequencyMonths,
      payload.startDate,
    ],
  );

  return Number(result.insertId);
}

export async function getSchedulePlanById(id) {
  const [rows] = await pool.query(
    `
      SELECT
        p.*,
        e.brand,
        e.model,
        e.serial_number,
        e.equipment_type,
        t.title AS template_title,
        t.institution_name,
        t.logo_data,
        t.seal_left_data,
        t.seal_right_data,
        t.signature_data,
        t.stamp_data,
        t.footer_left,
        t.footer_center,
        t.footer_right
      FROM inventory_schedule_plans p
      INNER JOIN inventory_equipment e ON e.id = p.equipment_id
      LEFT JOIN inventory_schedule_templates t ON t.id = p.template_id
      WHERE p.id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows?.[0] || null;
}

export async function listSchedulePlans({ companyName = "", hospitalName = "", year = 0, equipmentId = 0 }) {
  const where = [];
  const params = [];

  if (companyName) {
    where.push("p.company_name = ?");
    params.push(normalizeCompany(companyName));
  }

  if (hospitalName) {
    where.push("p.hospital_name LIKE ?");
    params.push(`%${hospitalName}%`);
  }

  if (year > 0) {
    where.push("p.year = ?");
    params.push(Number(year));
  }

  if (equipmentId > 0) {
    where.push("p.equipment_id = ?");
    params.push(Number(equipmentId));
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
      SELECT
        p.*,
        e.brand,
        e.model,
        e.serial_number,
        e.equipment_type
      FROM inventory_schedule_plans p
      INNER JOIN inventory_equipment e ON e.id = p.equipment_id
      ${whereClause}
      ORDER BY p.year DESC, p.id DESC
    `,
    params,
  );

  return rows;
}

export async function replacePlanActions(planId, actions = []) {
  await pool.query(`DELETE FROM inventory_schedule_plan_actions WHERE plan_id = ?`, [planId]);

  for (let index = 0; index < actions.length; index += 1) {
    await pool.query(
      `
        INSERT INTO inventory_schedule_plan_actions (plan_id, action_name, sort_order)
        VALUES (?, ?, ?)
      `,
      [planId, actions[index], index + 1],
    );
  }
}

export async function listPlanActions(planId) {
  const [rows] = await pool.query(
    `
      SELECT id, plan_id, action_name, sort_order
      FROM inventory_schedule_plan_actions
      WHERE plan_id = ?
      ORDER BY sort_order ASC, id ASC
    `,
    [planId],
  );

  return rows;
}

export async function listPlanExecutions(planId) {
  const [rows] = await pool.query(
    `
      SELECT id, plan_id, performed_at, month_number, notes, created_at
      FROM inventory_schedule_executions
      WHERE plan_id = ?
      ORDER BY performed_at ASC, id ASC
    `,
    [planId],
  );

  return rows;
}

export async function upsertPlanExecution(planId, payload) {
  const [result] = await pool.query(
    `
      INSERT INTO inventory_schedule_executions (
        plan_id,
        performed_at,
        month_number,
        notes
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        performed_at = VALUES(performed_at),
        notes = VALUES(notes)
    `,
    [planId, payload.performedAt, payload.monthNumber, toNullable(payload.notes)],
  );

  return Number(result.insertId || result.affectedRows || 0);
}
