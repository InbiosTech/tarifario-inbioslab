import { pool } from "../db/pool.js";

const SORT_COLUMN_MAP = {
  id: "p.id",
  title: "p.title",
  price: "COALESCE(p.promo_price, e.price_public, p.price)",
  displayorder: "p.display_order",
  active: "p.is_active",
};

function resolveSort(sortBy) {
  const key = String(sortBy || "displayOrder").toLowerCase();
  return SORT_COLUMN_MAP[key] || SORT_COLUMN_MAP.displayorder;
}

export async function listPublicPromotions() {
  return listPublicPromotionsByAudience({ audience: "publico" });
}

export async function listPublicPromotionsByAudience({ audience = "publico" } = {}) {
  const safeAudience = String(audience || "publico").toLowerCase() === "convenio" ? "convenio" : "publico";
  const isConvenio = safeAudience === "convenio";

  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.exam_id AS examId,
        p.code,
        p.title,
        p.description,
        COALESCE(NULLIF(TRIM(p.fundament), ''), NULLIF(TRIM(e.method), ''), e.info, '') AS fundament,
        p.long_description AS longDescription,
        COALESCE(NULLIF(p.name, ''), p.title) AS name,
        COALESCE(NULLIF(p.image_modal_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_card_url, '')) AS image,
        COALESCE(NULLIF(p.image_card_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_modal_url, '')) AS imageCard,
        COALESCE(NULLIF(p.image_modal_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_card_url, '')) AS imageModal,
        p.applies_to AS appliesTo,
        COALESCE(e.price_public, p.price) AS basePricePublic,
        COALESCE(e.price_convenio, e.price_public, p.price) AS basePriceConvenio,
        COALESCE(p.promo_price_public, p.promo_price) AS promoPricePublic,
        COALESCE(p.promo_price_convenio, p.promo_price, e.price_convenio) AS promoPriceConvenio,
        ${isConvenio ? "COALESCE(e.price_convenio, e.price_public, p.price)" : "COALESCE(e.price_public, p.price)"} AS basePrice,
        ${isConvenio ? "COALESCE(p.promo_price_convenio, p.promo_price, e.price_convenio, e.price_public, p.price)" : "COALESCE(p.promo_price_public, p.promo_price, e.price_public, p.price)"} AS promoPrice,
        ${isConvenio ? "COALESCE(p.promo_price_convenio, p.promo_price, e.price_convenio, e.price_public, p.price)" : "COALESCE(p.promo_price_public, p.promo_price, e.price_public, p.price)"} AS price,
        COALESCE(p.promo_price_public, p.promo_price, e.price_public, p.price) AS price1,
        COALESCE(p.promo_price_convenio, p.promo_price, e.price_convenio, e.price_public, p.price) AS price2,
        p.is_active AS active,
        p.display_order AS displayOrder,
        p.starts_at AS startsAt,
        p.ends_at AS endsAt,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM promotions p
      LEFT JOIN laboratory_tests e ON e.id = p.exam_id
      WHERE p.is_active = 1
        AND (p.applies_to = 'ambos' OR p.applies_to = ?)
      ORDER BY p.display_order ASC, p.id ASC
    `,
    [safeAudience],
  );

  return rows;
}

export async function listPromotionsPaginated({
  includeInactive,
  search,
  pageSize,
  offset,
  sortBy,
  sortOrder,
}) {
  const whereParts = [];
  const params = [];

  if (!includeInactive) {
    whereParts.push("p.is_active = 1");
  }

  if (search) {
    whereParts.push("(p.title LIKE ? OR p.description LIKE ? OR p.name LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const sortColumn = resolveSort(sortBy);
  const order = String(sortOrder || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM promotions p ${whereClause}`,
    params,
  );

  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.exam_id AS examId,
        p.code,
        p.title,
        p.description,
        COALESCE(NULLIF(TRIM(p.fundament), ''), NULLIF(TRIM(e.method), ''), e.info, '') AS fundament,
        p.long_description AS longDescription,
        COALESCE(NULLIF(p.name, ''), p.title) AS name,
        COALESCE(NULLIF(p.image_modal_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_card_url, '')) AS image,
        COALESCE(NULLIF(p.image_card_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_modal_url, '')) AS imageCard,
        COALESCE(NULLIF(p.image_modal_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_card_url, '')) AS imageModal,
        p.applies_to AS appliesTo,
        COALESCE(e.price_public, p.price) AS basePrice,
        COALESCE(p.promo_price_public, p.promo_price) AS promoPricePublic,
        COALESCE(p.promo_price_convenio, p.promo_price, e.price_convenio) AS promoPriceConvenio,
        p.promo_price AS promoPrice,
        COALESCE(p.promo_price, e.price_public, p.price) AS price,
        COALESCE(p.promo_price, e.price_public, p.price) AS price1,
        COALESCE(p.promo_price, e.price_public, p.price) AS price2,
        p.is_active AS active,
        p.display_order AS displayOrder,
        p.starts_at AS startsAt,
        p.ends_at AS endsAt,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM promotions p
      LEFT JOIN laboratory_tests e ON e.id = p.exam_id
      ${whereClause}
      ORDER BY ${sortColumn} ${order}, p.id ASC
      LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset],
  );

  return {
    items: rows,
    totalItems: Number(countRows?.[0]?.total || 0),
  };
}

export async function getPromotionById(id) {
  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.exam_id AS examId,
        p.code,
        p.title,
        p.description,
        COALESCE(NULLIF(TRIM(p.fundament), ''), NULLIF(TRIM(e.method), ''), e.info, '') AS fundament,
        p.long_description AS longDescription,
        COALESCE(NULLIF(p.name, ''), p.title) AS name,
        COALESCE(NULLIF(p.image_modal_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_card_url, '')) AS image,
        COALESCE(NULLIF(p.image_card_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_modal_url, '')) AS imageCard,
        COALESCE(NULLIF(p.image_modal_url, ''), NULLIF(p.image_url, ''), NULLIF(p.image_card_url, '')) AS imageModal,
        p.applies_to AS appliesTo,
        COALESCE(e.price_public, p.price) AS basePrice,
        COALESCE(p.promo_price_public, p.promo_price) AS promoPricePublic,
        COALESCE(p.promo_price_convenio, p.promo_price, e.price_convenio) AS promoPriceConvenio,
        p.promo_price AS promoPrice,
        COALESCE(p.promo_price, e.price_public, p.price) AS price,
        COALESCE(p.promo_price, e.price_public, p.price) AS price1,
        COALESCE(p.promo_price, e.price_public, p.price) AS price2,
        p.is_active AS active,
        p.display_order AS displayOrder,
        p.starts_at AS startsAt,
        p.ends_at AS endsAt,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM promotions p
      LEFT JOIN laboratory_tests e ON e.id = p.exam_id
      WHERE p.id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows[0] || null;
}

export async function createPromotion(payload) {
  const [result] = await pool.query(
    `
      INSERT INTO promotions (
        exam_id,
        code,
        title,
        description,
        fundament,
        long_description,
        name,
        image_url,
        image_card_url,
        image_modal_url,
        applies_to,
        price,
        promo_price,
        promo_price_public,
        promo_price_convenio,
        is_active,
        display_order,
        starts_at,
        ends_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.examId,
      payload.code,
      payload.title,
      payload.description,
      payload.fundament,
      payload.longDescription,
      payload.name,
      payload.image,
      payload.imageCard,
      payload.imageModal,
      payload.appliesTo,
      payload.price,
      payload.promoPrice,
      payload.promoPricePublic,
      payload.promoPriceConvenio,
      payload.active,
      payload.displayOrder,
      payload.startsAt,
      payload.endsAt,
    ],
  );

  return Number(result.insertId);
}

export async function updatePromotion(id, payload) {
  const [result] = await pool.query(
    `
      UPDATE promotions
      SET
        exam_id = ?,
        code = ?,
        title = ?,
        description = ?,
        fundament = ?,
        long_description = ?,
        name = ?,
        image_url = ?,
        image_card_url = ?,
        image_modal_url = ?,
        applies_to = ?,
        price = ?,
        promo_price = ?,
        promo_price_public = ?,
        promo_price_convenio = ?,
        is_active = ?,
        display_order = ?,
        starts_at = ?,
        ends_at = ?
      WHERE id = ?
      LIMIT 1
    `,
    [
      payload.examId,
      payload.code,
      payload.title,
      payload.description,
      payload.fundament,
      payload.longDescription,
      payload.name,
      payload.image,
      payload.imageCard,
      payload.imageModal,
      payload.appliesTo,
      payload.price,
      payload.promoPrice,
      payload.promoPricePublic,
      payload.promoPriceConvenio,
      payload.active,
      payload.displayOrder,
      payload.startsAt,
      payload.endsAt,
      id,
    ],
  );

  return Number(result.affectedRows || 0);
}

export async function deletePromotion(id) {
  const [result] = await pool.query(
    `DELETE FROM promotions WHERE id = ? LIMIT 1`,
    [id],
  );

  return Number(result.affectedRows || 0);
}
