import { badRequest } from "./httpErrors.js";

const ALLOWED_SORT_BY = ["id", "name", "price1", "price2", "active"];
const ALLOWED_SORT_ORDER = ["asc", "desc"];

export function parseIdParam(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("Invalid id");
  }
  return id;
}

export function parseListQuery(query = {}) {
  const includeInactive = String(query.includeInactive || "0") === "1";
  const search = String(query.search || "").trim();

  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 20);

  if (!Number.isInteger(page) || page < 1) {
    throw badRequest("page must be an integer >= 1");
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw badRequest("pageSize must be an integer between 1 and 100");
  }

  const sortBy = String(query.sortBy || "id").toLowerCase();
  if (!ALLOWED_SORT_BY.includes(sortBy)) {
    throw badRequest(`sortBy must be one of: ${ALLOWED_SORT_BY.join(", ")}`);
  }

  const sortOrder = String(query.sortOrder || "asc").toLowerCase();
  if (!ALLOWED_SORT_ORDER.includes(sortOrder)) {
    throw badRequest(`sortOrder must be one of: ${ALLOWED_SORT_ORDER.join(", ")}`);
  }

  return {
    includeInactive,
    search,
    page,
    pageSize,
    sortBy,
    sortOrder,
    offset: (page - 1) * pageSize,
  };
}
