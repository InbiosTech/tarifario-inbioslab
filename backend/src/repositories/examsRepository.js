import { pool } from "../db/pool.js";

const selectProjection = `
  id,
  name,
  sample,
  method,
  price_public AS price1,
  price_convenio AS price2,
  tube,
  info,
  process_time AS time,
  quantity,
  active
`;

const sortColumnMap = {
  id: "id",
  name: "name",
  price1: "price_public",
  price2: "price_convenio",
  active: "active",
};

function buildWhereClause({ includeInactive = false, search = "" } = {}) {
  const clauses = [];
  const params = [];

  if (!includeInactive) {
    clauses.push("active = 1");
  }

  if (search) {
    clauses.push("(name LIKE ? OR sample LIKE ? OR method LIKE ?)");
    const token = `%${search}%`;
    params.push(token, token, token);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export async function listExams({
  includeInactive = false,
  search = "",
  offset = 0,
  pageSize = 20,
  sortBy = "id",
  sortOrder = "asc",
} = {}) {
  const { whereSql, params } = buildWhereClause({ includeInactive, search });
  const orderByColumn = sortColumnMap[sortBy] || "id";
  const orderByDirection = String(sortOrder).toUpperCase() === "DESC" ? "DESC" : "ASC";

  const [rows] = await pool.query(
    `SELECT ${selectProjection}
     FROM laboratory_tests
     ${whereSql}
     ORDER BY ${orderByColumn} ${orderByDirection}, id ASC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return rows;
}

export async function countExams({ includeInactive = false, search = "" } = {}) {
  const { whereSql, params } = buildWhereClause({ includeInactive, search });
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM laboratory_tests ${whereSql}`,
    params
  );

  return Number(rows[0]?.total || 0);
}

export async function getExamById(id) {
  const [rows] = await pool.query(
    `SELECT ${selectProjection} FROM laboratory_tests WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function createExam(payload) {
  const [result] = await pool.query(
    `INSERT INTO laboratory_tests (
      name, sample, method, price_public, price_convenio, tube, info, process_time, quantity, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.sample,
      payload.method,
      payload.price1,
      payload.price2,
      payload.tube,
      payload.info,
      payload.time,
      payload.quantity,
      payload.active,
    ]
  );

  return getExamById(result.insertId);
}

export async function updateExam(id, payload) {
  const [result] = await pool.query(
    `UPDATE laboratory_tests
      SET name = ?, sample = ?, method = ?, price_public = ?, price_convenio = ?,
          tube = ?, info = ?, process_time = ?, quantity = ?, active = ?
      WHERE id = ?`,
    [
      payload.name,
      payload.sample,
      payload.method,
      payload.price1,
      payload.price2,
      payload.tube,
      payload.info,
      payload.time,
      payload.quantity,
      payload.active,
      id,
    ]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getExamById(id);
}

export async function deleteExam(id) {
  const [result] = await pool.query("DELETE FROM laboratory_tests WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function bulkUpsertExams(items, { truncateBeforeImport = false } = {}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (truncateBeforeImport) {
      await connection.query("TRUNCATE TABLE laboratory_tests");
    }

    for (const item of items) {
      if (item.id) {
        await connection.query(
          `INSERT INTO laboratory_tests (
            id, name, sample, method, price_public, price_convenio, tube, info, process_time, quantity, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            sample = VALUES(sample),
            method = VALUES(method),
            price_public = VALUES(price_public),
            price_convenio = VALUES(price_convenio),
            tube = VALUES(tube),
            info = VALUES(info),
            process_time = VALUES(process_time),
            quantity = VALUES(quantity),
            active = VALUES(active),
            updated_at = CURRENT_TIMESTAMP`,
          [
            item.id,
            item.name,
            item.sample,
            item.method,
            item.price1,
            item.price2,
            item.tube,
            item.info,
            item.time,
            item.quantity,
            item.active,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO laboratory_tests (
            name, sample, method, price_public, price_convenio, tube, info, process_time, quantity, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.name,
            item.sample,
            item.method,
            item.price1,
            item.price2,
            item.tube,
            item.info,
            item.time,
            item.quantity,
            item.active,
          ]
        );
      }
    }

    await connection.commit();
    return {
      imported: items.length,
      truncateBeforeImport,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function insertAuditLog({ action, examId = null, actor = "system", actorRole = "system", payload = null }) {
  const safePayload = payload ? JSON.stringify(payload) : null;
  await pool.query(
    `INSERT INTO exams_audit_log (action, exam_id, actor, actor_role, payload)
     VALUES (?, ?, ?, ?, ?)`,
    [action, examId, actor, actorRole, safePayload]
  );
}

export async function listAuditLogs({ limit = 50 } = {}) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const [rows] = await pool.query(
    `SELECT id, action, exam_id AS examId, actor, actor_role AS actorRole, payload, created_at AS createdAt
     FROM exams_audit_log
     ORDER BY id DESC
     LIMIT ?`,
    [safeLimit]
  );

  return rows.map((row) => ({
    ...row,
    payload: typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload,
  }));
}
